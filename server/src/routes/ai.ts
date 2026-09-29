import { Router } from "express";
import { z } from "zod";
import OpenAI, { toFile } from "openai";
import { prisma } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

export const aiRouter = Router();

const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-5.4-mini";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

let client: OpenAI | null = null;
function openai(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 5 * 60 * 1000, maxRetries: 1 });
  return client;
}

const photoSchema = z
  .string()
  .regex(/^data:image\/(jpeg|jpg|png|webp);base64,/i, "Photos must be JPEG, PNG or WebP")
  .max(6_000_000, "One of the photos is too large -- please use a smaller image");

const photosSchema = z.array(photoSchema).min(1, "Add at least one photo").max(10, "Use at most 10 photos");

const SHOTS = {
  Catalogue: `Create a premium e-commerce catalogue photograph of an Indian woman model wearing the EXACT saree shown in the reference photos.
The saree must match the reference photos exactly: same base colour, same motifs and their size and spacing, same zari/woven work, same border design and width, same pallu design. Do not invent, simplify, recolour, restyle or "improve" any part of the fabric design.
Keep the fabric's real texture, sheen and the way it folds and drapes as seen in the reference photos.
Drape: classic Nivi style with neat, evenly pleated front folds and the pallu over the left shoulder, falling so its design is clearly visible. Blouse made from the saree's own blouse fabric.
Full-length, standing, front-facing, graceful relaxed pose, natural expression, tasteful traditional jewellery.
Setting: clean, softly lit premium studio with a warm neutral backdrop and minimal props.
Photorealistic, sharp fabric detail, true-to-life colours. No text, logos, watermarks or borders in the image.`,
  Blouse: `Create a clean e-commerce product photograph of the BLOUSE PIECE of the saree shown in the reference photos.
Show the blouse fabric neatly folded and laid flat so its body, motifs and any border are clearly visible.
Colours, motifs, weave and border must match the reference photos exactly -- do not invent or restyle anything. Keep the real fabric texture and the way it folds.
Top-down view, soft even studio lighting, plain warm neutral background. Photorealistic, sharp detail. No text, logos or watermarks.`,
  Pallu: `Create a clean e-commerce product photograph of the PALLU (the decorated end piece) of the saree shown in the reference photos.
Spread the pallu flat so its complete design, border and tassels/fringe (if any) are fully visible.
Colours, motifs, zari work and border must match the reference photos exactly -- do not invent or restyle anything. Keep the real fabric texture, sheen and natural folds at the edges.
Top-down view, soft even studio lighting, plain warm neutral background. Photorealistic, sharp detail. No text, logos or watermarks.`,
} as const;

type ShotKind = keyof typeof SHOTS;

function toUpload(dataUrl: string, i: number) {
  const [, mime, base64] = /^data:(image\/[a-z]+);base64,(.+)$/i.exec(dataUrl)!;
  const ext = mime.split("/")[1].replace("jpeg", "jpg");
  return toFile(Buffer.from(base64, "base64"), `photo-${i + 1}.${ext}`, { type: mime });
}

function aiError(err: unknown) {
  if (err instanceof OpenAI.APIError) {
    if (err.status === 401) return "The OpenAI API key is invalid. Check OPENAI_API_KEY on the server.";
    if (err.status === 429) return "OpenAI rate limit or billing limit reached. Check your OpenAI API billing and try again shortly.";
    if (err.status === 400) return `OpenAI rejected the request: ${err.message}`;
    return `OpenAI error (${err.status}): ${err.message}`;
  }
  return "The AI request failed. Please try again.";
}

aiRouter.get("/status", requireAdmin, (_req, res) => {
  res.json({ enabled: Boolean(openai()), textModel: TEXT_MODEL, imageModel: IMAGE_MODEL, prompts: SHOTS });
});

const imageRequestSchema = z.object({
  photos: photosSchema,
  kind: z.enum(["Catalogue", "Blouse", "Pallu"]),
  notes: z.string().max(500).optional().default(""),
});

aiRouter.post("/image", requireAdmin, async (req, res) => {
  const ai = openai();
  if (!ai) return res.status(501).json({ error: "AI generation is not configured. Add OPENAI_API_KEY on the server." });
  const parsed = imageRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
  const { photos, kind, notes } = parsed.data;

  try {
    const prompt = notes.trim() ? `${SHOTS[kind as ShotKind]}\nAdditional notes from the store: ${notes.trim()}` : SHOTS[kind as ShotKind];
    const result = await ai.images.edit({
      model: IMAGE_MODEL,
      image: await Promise.all(photos.map(toUpload)),
      prompt,
      size: "1024x1536",
      quality: "high",
      input_fidelity: "high",
      output_format: "webp",
      output_compression: 85,
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) return res.status(502).json({ error: "The AI returned no image. Please try again." });
    res.json({ kind, src: `data:image/webp;base64,${b64}` });
  } catch (err) {
    console.error("AI image error:", err);
    res.status(502).json({ error: aiError(err) });
  }
});

const describeRequestSchema = z.object({
  photos: photosSchema,
  notes: z.string().max(500).optional().default(""),
});

const detailsSchema = z.object({
  name: z.string(),
  shortDescription: z.string(),
  description: z.string(),
  category: z.string(),
  subcategory: z.string(),
  occasion: z.string(),
  material: z.string(),
  color: z.string(),
  pattern: z.string(),
  seoTitle: z.string(),
  seoDescription: z.string(),
  altCatalogue: z.string(),
  altBlouse: z.string(),
  altPallu: z.string(),
});

const clamp = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`);

aiRouter.post("/describe", requireAdmin, async (req, res) => {
  const ai = openai();
  if (!ai) return res.status(501).json({ error: "AI generation is not configured. Add OPENAI_API_KEY on the server." });
  const parsed = describeRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
  const { photos, notes } = parsed.data;

  const [categories, fabricTypes, occasions] = await Promise.all([
    prisma.category.findMany({ select: { name: true } }),
    prisma.fabricType.findMany({ select: { name: true } }),
    prisma.occasion.findMany({ select: { name: true } }),
  ]);
  const enumOf = (rows: { name: string }[], allowEmpty = false) => {
    const values = rows.map((r) => r.name);
    return { type: "string", enum: allowEmpty ? [...values, ""] : values.length ? values : [""] };
  };
  const text = (description: string) => ({ type: "string", description });

  const schema = {
    type: "object",
    additionalProperties: false,
    required: Object.keys(detailsSchema.shape),
    properties: {
      name: text("Product name, 3-7 words, e.g. 'Black Tussar Silk Saree with Floral Zari Border'. No brand name."),
      shortDescription: text("One sentence under 140 characters for product cards."),
      description: text("2 short paragraphs, 90-160 words total, warm and specific: weave, motifs, border, pallu, blouse, how to style it."),
      category: enumOf(categories),
      subcategory: { ...enumOf(fabricTypes, true), description: "Closest fabric type, or empty if unsure." },
      occasion: enumOf(occasions),
      material: text("Fabric as it appears, e.g. 'Tussar Silk'. If uncertain, describe the look, e.g. 'Silk-finish fabric'."),
      color: text("Main colour(s), e.g. 'Black with antique gold'."),
      pattern: text("Weave/design, e.g. 'Floral zari border, butta body'."),
      seoTitle: text("Under 60 characters, lead with the key search phrase, e.g. 'Black Tussar Silk Saree with Floral Zari Border'."),
      seoDescription: text("140-155 characters, natural sentence with the main keywords, ending with 'Shop online at Krishna Gari Battala Kottu, Hyderabad.' if it fits."),
      altCatalogue: text("Image alt text for the model/catalogue photo, under 125 characters."),
      altBlouse: text("Image alt text for the blouse piece photo, under 125 characters."),
      altPallu: text("Image alt text for the pallu photo, under 125 characters."),
    },
  };

  try {
    const completion = await ai.chat.completions.create({
      model: TEXT_MODEL,
      response_format: { type: "json_schema", json_schema: { name: "saree_listing", strict: true, schema } },
      messages: [
        {
          role: "system",
          content:
            "You write product listings for Krishna Gari Battala Kottu, a premium saree and fabric store in Hyderabad. " +
            "Describe only what is visible in the photos. Never invent certifications, thread counts, weights, lengths, origin claims or 'pure'/'handloom' claims unless the store's notes state them. " +
            "Never mention price. Write in clear, elegant Indian English suitable for search engines and shoppers.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `These are phone photos of one saree from our store.${notes.trim() ? ` Store notes (trusted facts): ${notes.trim()}` : ""} Write the listing.`,
            },
            ...photos.slice(0, 6).map((url) => ({ type: "image_url" as const, image_url: { url } })),
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    const details = detailsSchema.safeParse(raw ? JSON.parse(raw) : null);
    if (!details.success) return res.status(502).json({ error: "The AI returned an incomplete listing. Please try again." });
    const d = details.data;
    res.json({
      ...d,
      shortDescription: clamp(d.shortDescription, 160),
      seoTitle: clamp(d.seoTitle, 70),
      seoDescription: clamp(d.seoDescription, 170),
    });
  } catch (err) {
    console.error("AI describe error:", err);
    res.status(502).json({ error: aiError(err) });
  }
});
