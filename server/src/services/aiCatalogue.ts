import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import { z } from "zod";
import { prisma } from "../db.js";

export const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-5.4-mini";
export const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst";

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
  Catalogue: `Create a premium e-commerce catalogue photograph of the EXACT saree shown in the reference photos, draped on a standing shop mannequin: a beige torso form with a slim arm hanging straight down on one side and the other arm bent at the elbow with its hand at waist height in front of the body, lightly holding the folded pallu panel exactly as in a shop display (the hand is visible; the other hand hangs at the side clear of the saree), and a turned wooden finial on top of the neck instead of a head (no human model, no face).
Show the finished drape the way a saree shop displays it: the pallu comes over the shoulder as a wide diagonal band across the chest with its border running along both edges, the saree's front is gathered into neat, evenly spaced pleats falling straight to the floor, and the rest of the pallu hangs from the bent arm in a long folded panel so its border, stripes and woven design are clearly visible, spreading onto the floor at the bottom right. The saree's bottom border shows along the hem.
Tall portrait framing, mannequin standing upright and centred in a slight three-quarter view, the ENTIRE mannequin must be inside the frame with clear empty margin above the wooden finial and below the hem and fallen pallu: nothing cropped or cut off at any edge.
Plain, seamless studio backdrop with a gentle floor shadow. Pick a backdrop that contrasts with the saree so it stands out, and vary it by saree: mid or light grey, taupe, soft sage, dusty blue, cream or warm beige. Do NOT default to orange, peach or yellow; use those only if the saree is cool-toned or dark.
${FIDELITY_RULES}`,
} as const;

export type ShotKind = keyof typeof SHOTS;

// The zoom picture is not generated: it is cropped from the mannequin photo (no extra AI call or cost).
// The box is a tight close-up on the mannequin's bent hand holding the pallu, with the pallu border and body weave around it, as fractions of the image.
const ZOOM_BOX = { left: 0.33, top: 0.19, size: 0.4 };

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
// Only the gpt-image-1 family takes input_fidelity: gpt-image-2 ignores it and the 2.5 models reject it with a 400.
const takesInputFidelity = (model: string) => /^gpt-image-1/.test(model);

export async function generateShot(photos: string[], kind: ShotKind, notes = ""): Promise<string> {
  const ai = requireClient();
  const extra = notes.trim() ? `\nAdditional notes from the store: ${notes.trim()}` : "";
  const request = {
    model: IMAGE_MODEL,
    image: await Promise.all(photos.map(toUpload)),
    prompt: SHOTS[kind] + extra,
    size: "1024x1536",
    quality: "high",
    output_format: "webp",
    output_compression: 85,
  } as const;

  const result = await ai.images.edit(takesInputFidelity(IMAGE_MODEL) ? { ...request, input_fidelity: "high" } : request);
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

export type GroupingPhoto = { image: string; gapSeconds: number | null };

// Three differently-sized window layouts; a boundary must be found by at least two of them (the AI is noisy run to run).
const LAYOUTS = [
  { window: 14, decide: 11 },
  { window: 12, decide: 9 },
  { window: 16, decide: 12 },
];

/** "3 min later", "40 sec later" ... for the prompt. */
function describeGap(seconds: number | null) {
  if (seconds === null) return "time unknown";
  if (seconds < 90) return `${Math.max(0, Math.round(seconds))} sec after the previous photo`;
  if (seconds < 5400) return `${Math.round(seconds / 60)} min after the previous photo`;
  return "hours/days after the previous photo";
}

const GROUPING_RULES =
  "When you are unsure, answer SAME saree: a wrongly split saree is worse than two sarees kept together, because staff can easily split a group but wasting a generation on a fragment costs money. " +
  "You sort a shop's phone photos of sarees. The shop photographs one saree at a time, usually 3-10 photos each: the full saree laid out, then close-ups of the body, border, pallu and blouse piece, often on a different surface or in different light. " +
  "ALL of those close-ups and angles are the SAME saree. Judge by the cloth itself: base colour, motif shape and spacing, border colour and width, zari. " +
  "Say DIFFERENT only when the base colour or the weave/motif design is clearly not the same cloth. A change of angle, zoom, lighting, background or a folded vs. spread saree is NOT a different saree. " +
  "The time gap between photos is a hint: photos of one saree are usually seconds apart (under a minute); under 30 seconds is very likely the same saree; a gap of several minutes usually means the next saree began, but is not proof on its own.";

/**
 * Photos arrive in shooting order. Returns the indices where a new saree starts (always includes 0).
 * Looks at overlapping windows of larger images plus the time gaps, so each call only compares neighbours.
 */
async function detectSareeStarts(photos: GroupingPhoto[], layout: { window: number; decide: number }): Promise<number[]> {
  const { window: WINDOW, decide: DECIDE } = layout;
  const ai = requireClient();
  const starts = new Set<number>([0]);
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["starts"],
    properties: { starts: { type: "array", items: { type: "integer" }, description: "Photo numbers that show a DIFFERENT saree from the photo just before them." } },
  };

  for (let s = 0; s < photos.length - 1; s += DECIDE) {
    const window = photos.slice(s, s + WINDOW);
    const last = s + WINDOW >= photos.length;
    const completion = await ai.chat.completions.create({
      model: TEXT_MODEL,
      response_format: { type: "json_schema", json_schema: { name: "saree_boundaries", strict: true, schema } },
      messages: [
        { role: "system", content: GROUPING_RULES },
        {
          role: "user",
          content: [
            { type: "text", text: `There are ${window.length} photos in shooting order, numbered 1 to ${window.length}. For each photo from 2 onwards, decide whether it shows a DIFFERENT saree from the photo just before it. Return only those photo numbers.` },
            ...window.flatMap((p, i) => [
              { type: "text" as const, text: `Photo ${i + 1} (${i === 0 ? "first in this set" : describeGap(p.gapSeconds)}):` },
              { type: "image_url" as const, image_url: { url: p.image, detail: "low" as const } },
            ]),
          ],
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    const result = z.object({ starts: z.array(z.number().int()) }).safeParse(raw ? JSON.parse(raw) : null);
    if (!result.success) throw new Error("The AI returned an unreadable grouping. Please try again.");
    // Later photos in the window are only context for the next window, except in the final one.
    const maxDecided = last ? window.length : DECIDE + 1;
    for (const n of result.data.starts) {
      if (n >= 2 && n <= maxDecided) starts.add(s + n - 1);
    }
  }
  return [...starts].sort((a, b) => a - b);
}

/**
 * Second pass: for every pair of neighbouring groups, shows a few photos of each and asks if it is really
 * one saree. Returns, per group, whether it should be joined onto the group before it.
 */
async function findSplitSarees(groups: { images: string[]; tail: string[]; gapSeconds: number | null }[]): Promise<boolean[]> {
  const ai = requireClient();
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["sameSaree"],
    properties: { sameSaree: { type: "boolean" } },
  };
  const joins: boolean[] = groups.map(() => false);

  const check = async (i: number) => {
    const [a, b] = [{ images: groups[i].tail }, groups[i]];
    const completion = await ai.chat.completions.create({
      model: TEXT_MODEL,
      response_format: { type: "json_schema", json_schema: { name: "same_saree", strict: true, schema } },
      messages: [
        { role: "system", content: GROUPING_RULES },
        {
          role: "user",
          content: [
            { type: "text", text: `Set A (${a.images.length} photos) and Set B (${b.images.length} photos) were split apart by an earlier pass. Set B starts ${describeGap(b.gapSeconds)}. Is Set B the SAME saree as Set A (just more angles/close-ups), or a different saree?` },
            { type: "text", text: "Set A:" },
            ...a.images.map((url) => ({ type: "image_url" as const, image_url: { url, detail: "high" as const } })),
            { type: "text", text: "Set B:" },
            ...b.images.map((url) => ({ type: "image_url" as const, image_url: { url, detail: "high" as const } })),
          ],
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    const result = z.object({ sameSaree: z.boolean() }).safeParse(raw ? JSON.parse(raw) : null);
    if (!result.success) throw new Error("The AI returned an unreadable grouping. Please try again.");
    joins[i] = result.data.sameSaree;
  };

  const queue = groups.map((_, i) => i).slice(1);
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      for (let i = queue.shift(); i !== undefined; i = queue.shift()) await check(i);
    })
  );
  return joins;
}

/**
 * Full pipeline: find where each saree starts, then repeatedly join neighbouring groups that look like one saree
 * (compared using the photos nearest the boundary, which are the best evidence). Returns start indices.
 */
export async function detectSarees(photos: GroupingPhoto[]): Promise<number[]> {
  const runs = await Promise.all(LAYOUTS.map((layout) => detectSareeStarts(photos, layout)));
  const votes = new Map<number, number>();
  for (const run of runs) for (const i of run) votes.set(i, (votes.get(i) ?? 0) + 1);
  let starts = [...votes].filter(([i, n]) => i === 0 || n >= 2).map(([i]) => i).sort((a, b) => a - b);
  for (let round = 0; round < 3 && starts.length > 1; round++) {
    const ranges = starts.map((from, i) => ({ from, to: starts[i + 1] ?? photos.length }));
    const joins = await findSplitSarees(
      ranges.map((r, i) => ({
        // Photos nearest the boundary: the end of the previous group is passed as the "A" side by the caller below.
        images: photos.slice(r.from, Math.min(r.to, r.from + 3)).map((p) => p.image),
        gapSeconds: photos[r.from].gapSeconds,
        tail: i ? photos.slice(Math.max(ranges[i - 1].from, ranges[i - 1].to - 3), ranges[i - 1].to).map((p) => p.image) : [],
      }))
    );
      const next = starts.filter((_, i) => !(i > 0 && joins[i] && ranges[i - 1].to - ranges[i - 1].from + (ranges[i].to - ranges[i].from) <= 16));
    if (next.length === starts.length) break;
    starts = next;
  }
  return starts;
}
