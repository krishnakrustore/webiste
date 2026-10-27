import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth.js";
import { openai, SHOTS, SHOT_KINDS, TEXT_MODEL, IMAGE_MODEL, generateShot, makeZoom, describeSaree, aiErrorMessage, type ShotKind } from "../services/aiCatalogue.js";

export const aiRouter = Router();

const photoSchema = z
  .string()
  .regex(/^data:image\/(jpeg|jpg|png|webp);base64,/i, "Photos must be JPEG, PNG or WebP")
  .max(6_000_000, "One of the photos is too large -- please use a smaller image");

const photosSchema = z.array(photoSchema).min(1, "Add at least one photo").max(10, "Use at most 10 photos");

aiRouter.get("/status", requireAdmin, (_req, res) => {
  res.json({ enabled: Boolean(openai()), textModel: TEXT_MODEL, imageModel: IMAGE_MODEL, prompts: SHOTS });
});

const imageRequestSchema = z.object({
  photos: photosSchema,
  kind: z.enum(SHOT_KINDS as [ShotKind, ...ShotKind[]]),
  notes: z.string().max(500).optional().default(""),
});

aiRouter.post("/image", requireAdmin, async (req, res) => {
  if (!openai()) return res.status(501).json({ error: "AI generation is not configured. Add OPENAI_API_KEY on the server." });
  const parsed = imageRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
  try {
    const src = await generateShot(parsed.data.photos, parsed.data.kind, parsed.data.notes);
    res.json({ kind: parsed.data.kind, src });
  } catch (err) {
    console.error("AI image error:", err);
    res.status(502).json({ error: aiErrorMessage(err) });
  }
});

// The zoom picture is a crop of the generated photo -- needs no AI call, so it works without an API key too.
aiRouter.post("/zoom", requireAdmin, async (req, res) => {
  const parsed = z.object({ image: z.string().regex(/^data:image\/(jpeg|jpg|png|webp);base64,/i).max(8_000_000) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Send the photo to zoom into." });
  try {
    res.json({ src: await makeZoom(parsed.data.image) });
  } catch (err) {
    console.error("Zoom crop error:", err);
    res.status(400).json({ error: "Could not crop that image." });
  }
});

const describeRequestSchema = z.object({
  photos: photosSchema,
  notes: z.string().max(500).optional().default(""),
});

aiRouter.post("/describe", requireAdmin, async (req, res) => {
  if (!openai()) return res.status(501).json({ error: "AI generation is not configured. Add OPENAI_API_KEY on the server." });
  const parsed = describeRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
  try {
    res.json(await describeSaree(parsed.data.photos, parsed.data.notes));
  } catch (err) {
    console.error("AI describe error:", err);
    res.status(502).json({ error: aiErrorMessage(err) });
  }
});
