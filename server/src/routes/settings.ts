import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

export const settingsRouter = Router();
const ID = "singleton";

const settingsSchema = z.object({
  businessName: z.string().default(""),
  phone: z.string().default(""),
  whatsapp: z.string().default(""),
  addressLine: z.string().default(""),
  mapsUrl: z.string().default(""),
  instagram: z.string().default(""),
  facebook: z.string().default(""),
  googleRating: z.number().min(0).max(5).default(0),
  googleReviewCount: z.number().int().min(0).default(0),
  googleReviewUrl: z.string().default(""),
});

settingsRouter.get("/", async (_req, res) => {
  const settings = await prisma.settings.upsert({ where: { id: ID }, update: {}, create: { id: ID } });
  res.json(settings);
});

settingsRouter.put("/", requireAdmin, async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid settings" });
  const settings = await prisma.settings.upsert({
    where: { id: ID },
    update: parsed.data,
    create: { id: ID, ...parsed.data },
  });
  res.json(settings);
});
