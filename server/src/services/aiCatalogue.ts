import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import { z } from "zod";
import { prisma } from "../db.js";

export const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-5.4-mini";
export const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

let client: OpenAI | null = null;
export function openai(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 5 * 60 * 1000, maxRetries: 1 });
  return client;
}

const FIDELITY_RULES = `The saree must match the reference photos exactly: same base colour, same motifs with the same size and spacing, same zari/woven work, same border design and width, same pallu design. Do not invent, simplify, recolour, restyle or "improve" any part of the design. Keep the fabric's real texture and sheen.
Ignore everything in the reference photos that is not the saree: people, hands, hangers, furniture, backgrounds, and any text, logos or watermarks.
Photorealistic, sharp fabric detail, true-to-life colours, soft even studio lighting. No people, no text, no logos, no watermarks, no borders around the image.`;

export const SHOTS = {
  Catalogue: `Create a premium e-commerce catalogue photograph of the EXACT saree shown in the reference photos, draped on a standing dress-form mannequin (no human model, no face).
Show the finished drape the way a saree shop displays it: neat, evenly spaced pleats falling down the front of the mannequin, the saree's border running down along the pleat edge, and the pallu brought over the shoulder and hanging down the front in a folded panel so its wide border is clearly visible, with the remaining pallu falling to the floor and spreading out on the right.
Tall portrait framing, mannequin standing upright and centred in a three-quarter view, shot from slightly below so the whole drape is visible from the shoulder to the floor.
Plain, seamless warm studio backdrop in a soft neutral tone that flatters the saree's colours (peach, beige or cream), with a gentle floor shadow.
${FIDELITY_RULES}`,
} as const;

export type ShotKind = keyof typeof SHOTS;

// The zoom picture is not generated: it is cropped from the mannequin photo (no extra AI call or cost).
// The box covers the body motifs and the border/pallu panel in the middle of the drape, as fractions of the image.
const ZOOM_BOX = { left: 0.19, top: 0.26, size: 0.62 };

/** Crops the zoomed-in view out of a generated mannequin photo; returns a webp data URL. */
export async function makeZoom(dataUrl: string): Promise<string> {
  const match = /^data:image\/[a-z+]+;base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new Error("Invalid image");
  const input = Buffer.from(match[1], "base64");
  const { width, height } = await sharp(input).metadata();
  if (!width || !height) throw new Error("Could not read the generated image");
  const out = await sharp(input)
    .extract({
      left: Math.round(width * ZOOM_BOX.left),
      top: Math.round(height * ZOOM_BOX.top),
      width: Math.round(width * ZOOM_BOX.size),
      height: Math.round(height * ZOOM_BOX.size),
    })
    .webp({ quality: 90 })
    .toBuffer();
  return `data:image/webp;base64,${out.toString("base64")}`;
}
export const SHOT_KINDS = Object.keys(SHOTS) as ShotKind[];

function toUpload(dataUrl: string, i: number) {
  const match = /^data:(image\/[a-z]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new Error("Invalid reference photo");
  const ext = match[1].split("/")[1].replace("jpeg", "jpg");
  return toFile(Buffer.from(match[2], "base64"), `photo-${i + 1}.${ext}`, { type: match[1] });
}

export function isOutOfCredits(err: unknown) {
  return err instanceof OpenAI.APIError && (err.code === "insufficient_quota" || err.type === "insufficient_quota");
}

export function isRateLimited(err: unknown) {
  return err instanceof OpenAI.APIError && err.status === 429 && !isOutOfCredits(err);
}

export function aiErrorMessage(err: unknown) {
  if (err instanceof OpenAI.APIError) {
    if (isOutOfCredits(err)) {
      return "Your OpenAI API account has no credits. Add credits at platform.openai.com > Settings > Billing (separate from a ChatGPT subscription), then try again.";
    }
    if (err.status === 401) return "The OpenAI API key is invalid. Check OPENAI_API_KEY on the server.";
    if (err.status === 429) return "OpenAI is rate-limiting requests right now. Wait a minute and try again.";
    if (err.status === 400) return `OpenAI rejected the request: ${err.message}`;
    return `OpenAI error (${err.status}): ${err.message}`;
  }
  return err instanceof Error && err.message ? err.message : "The AI request failed. Please try again.";
}

function requireClient(): OpenAI {
  const ai = openai();
  if (!ai) throw new Error("AI generation is not configured. Add OPENAI_API_KEY on the server.");
  return ai;
}

/** Generates one product shot from the reference photos; returns a webp data URL. */
export async function generateShot(photos: string[], kind: ShotKind, notes = ""): Promise<string> {
  const ai = requireClient();
  const prompt = notes.trim() ? `${SHOTS[kind]}\nAdditional notes from the store: ${notes.trim()}` : SHOTS[kind];
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
  if (!b64) throw new Error("The AI returned no image. Please try again.");
  return `data:image/webp;base64,${b64}`;
}

export const listingSchema = z.object({
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
  altZoom: z.string(),
});
export type Listing = z.infer<typeof listingSchema>;

const clamp = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`);

/** Writes the full product listing from the reference photos, constrained to the store's own categories. */
export async function describeSaree(photos: string[], notes = ""): Promise<Listing> {
  const ai = requireClient();
  const [categories, fabricTypes, occasions] = await Promise.all([
    prisma.category.findMany({ select: { name: true } }),
    prisma.fabricType.findMany({ select: { name: true } }),
    prisma.occasion.findMany({ select: { name: true } }),
  ]);
  const enumOf = (rows: { name: string }[], allowEmpty = false) => {
    const values = rows.map((r) => r.name);
    return { type: "string", enum: allowEmpty || !values.length ? [...values, ""] : values };
  };
  const text = (description: string) => ({ type: "string", description });

  const schema = {
    type: "object",
    additionalProperties: false,
    required: Object.keys(listingSchema.shape),
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
      seoDescription: text("140-155 characters, natural sentence with the main keywords, ending with 'Shop at Krishna Gari Battala Kottu, Hyderabad.' if it fits."),
      altCatalogue: text("Image alt text for the saree draped on a mannequin, under 125 characters."),
      altZoom: text("Image alt text for the close-up showing the weave, motifs and border, under 125 characters."),
    },
  };

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
          { type: "text", text: `These are photos of one saree from our store.${notes.trim() ? ` Store notes (trusted facts): ${notes.trim()}` : ""} Write the listing.` },
          ...photos.slice(0, 6).map((url) => ({ type: "image_url" as const, image_url: { url } })),
        ],
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  const parsed = listingSchema.safeParse(raw ? JSON.parse(raw) : null);
  if (!parsed.success) throw new Error("The AI returned an incomplete listing. Please try again.");
  const d = parsed.data;
  return { ...d, shortDescription: clamp(d.shortDescription, 160), seoTitle: clamp(d.seoTitle, 70), seoDescription: clamp(d.seoDescription, 170) };
}

const CHUNK = 16;

/**
 * Photos arrive in shooting order. Returns the indices where a new saree starts (always includes 0).
 * Looks at overlapping windows of small thumbnails, so each call only has to compare neighbours.
 */
export async function detectSareeStarts(thumbs: string[]): Promise<number[]> {
  const ai = requireClient();
  const starts = new Set<number>([0]);
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["starts"],
    properties: { starts: { type: "array", items: { type: "integer" }, description: "Photo numbers that show a DIFFERENT saree from the photo just before them." } },
  };

  for (let s = 0; s < thumbs.length - 1; s += CHUNK - 1) {
    const window = thumbs.slice(s, s + CHUNK);
    const completion = await ai.chat.completions.create({
      model: TEXT_MODEL,
      response_format: { type: "json_schema", json_schema: { name: "saree_boundaries", strict: true, schema } },
      messages: [
        {
          role: "system",
          content:
            "You sort a shop's phone photos of sarees. Photos are numbered in the order they were taken; the shop photographs one saree at a time, usually 3-10 photos each. " +
            "Close-ups of the border, pallu, blouse piece or weave of the same saree count as the SAME saree. A different base colour or different motifs means a DIFFERENT saree.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: `There are ${window.length} photos, numbered 1 to ${window.length}. For each photo from 2 onwards, decide whether it shows a different saree from the photo just before it. Return those photo numbers.` },
            ...window.flatMap((url, i) => [
              { type: "text" as const, text: `Photo ${i + 1}:` },
              { type: "image_url" as const, image_url: { url, detail: "low" as const } },
            ]),
          ],
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    const result = z.object({ starts: z.array(z.number().int()) }).safeParse(raw ? JSON.parse(raw) : null);
    if (!result.success) throw new Error("The AI returned an unreadable grouping. Please try again.");
    for (const n of result.data.starts) {
      if (n >= 2 && n <= window.length) starts.add(s + n - 1);
    }
  }
  return [...starts].sort((a, b) => a - b);
}
