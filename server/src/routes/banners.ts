import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

export const bannersRouter = Router();

const bannerSchema = z.object({
  image: z.string().min(1),
  link: z.string().optional().nullable(),
  alt: z.string().default(""),
  position: z.number().int().default(0),
  active: z.boolean().default(true),
});

bannersRouter.get("/", async (req, res) => {
  const { active } = req.query as { active?: string };
  const where = active === "true" ? { active: true } : {};
  const items = await prisma.banner.findMany({ where, orderBy: { position: "asc" } });
  res.json(items);
});

bannersRouter.post("/", requireAdmin, async (req, res) => {
  const parsed = bannerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid banner" });
  const item = await prisma.banner.create({ data: parsed.data });
  res.status(201).json(item);
});

bannersRouter.put("/:id", requireAdmin, async (req, res) => {
  const parsed = bannerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid banner" });
  const item = await prisma.banner.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(item);
});

bannersRouter.delete("/:id", requireAdmin, async (req, res) => {
  await prisma.banner.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
