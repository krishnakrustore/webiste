import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

export const testimonialsRouter = Router();

const testimonialSchema = z.object({
  name: z.string().min(1),
  location: z.string().default(""),
  message: z.string().min(1),
  rating: z.number().int().min(1).max(5).default(5),
  avatar: z.string().optional().nullable(),
  source: z.string().default("Google"),
  featured: z.boolean().default(true),
  position: z.number().int().default(0),
});

testimonialsRouter.get("/", async (req, res) => {
  const { featured } = req.query as { featured?: string };
  const where = featured === "true" ? { featured: true } : {};
  const items = await prisma.testimonial.findMany({ where, orderBy: [{ position: "asc" }, { createdAt: "desc" }] });
  res.json(items);
});

testimonialsRouter.post("/", requireAdmin, async (req, res) => {
  const parsed = testimonialSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid testimonial" });
  const item = await prisma.testimonial.create({ data: parsed.data });
  res.status(201).json(item);
});

testimonialsRouter.put("/:id", requireAdmin, async (req, res) => {
  const parsed = testimonialSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid testimonial" });
  const item = await prisma.testimonial.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(item);
});

testimonialsRouter.delete("/:id", requireAdmin, async (req, res) => {
  await prisma.testimonial.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
