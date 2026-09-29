import { Router, type Request } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { persistImage, normalizeStoredSrc, deleteUnusedAssets, publicSrc, ImageValidationError } from "../utils/imageStore.js";

export const bannersRouter = Router();

const bannerSchema = z.object({
  image: z.string().min(1),
  link: z.string().optional().nullable(),
  alt: z.string().default(""),
  position: z.number().int().default(0),
  active: z.boolean().default(true),
});

const serialize = (req: Request, banner: { image: string }) => ({ ...banner, image: publicSrc(req, banner.image) });

bannersRouter.get("/", async (req, res) => {
  const { active } = req.query as { active?: string };
  const where = active === "true" ? { active: true } : {};
  const items = await prisma.banner.findMany({ where, orderBy: { position: "asc" } });
  res.json(items.map((b) => serialize(req, b)));
});

bannersRouter.post("/", requireAdmin, async (req, res) => {
  const parsed = bannerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid banner" });
  try {
    const image = await persistImage(normalizeStoredSrc(parsed.data.image));
    const item = await prisma.banner.create({ data: { ...parsed.data, image } });
    res.status(201).json(serialize(req, item));
  } catch (err) {
    if (err instanceof ImageValidationError) return res.status(400).json({ error: err.message });
    throw err;
  }
});

bannersRouter.put("/:id", requireAdmin, async (req, res) => {
  const parsed = bannerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid banner" });
  const existing = await prisma.banner.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Banner not found" });
  try {
    const image = await persistImage(normalizeStoredSrc(parsed.data.image));
    const item = await prisma.banner.update({ where: { id: existing.id }, data: { ...parsed.data, image } });
    await deleteUnusedAssets([existing.image], [image]);
    res.json(serialize(req, item));
  } catch (err) {
    if (err instanceof ImageValidationError) return res.status(400).json({ error: err.message });
    throw err;
  }
});

bannersRouter.delete("/:id", requireAdmin, async (req, res) => {
  const existing = await prisma.banner.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Banner not found" });
  await prisma.banner.delete({ where: { id: existing.id } });
  await deleteUnusedAssets([existing.image], []);
  res.status(204).end();
});
