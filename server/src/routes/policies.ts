import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

export const policiesRouter = Router();

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const sectionSchema = z.object({
  heading: z.string().min(1),
  body: z.string().min(1),
});

const schema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1),
  image: z.string().default(""),
  sections: z.array(sectionSchema).default([]),
  position: z.number().int().default(0),
});

function serialize(policy: { sectionsJson: string; [key: string]: unknown }) {
  const { sectionsJson, ...rest } = policy;
  let sections: unknown = [];
  try {
    sections = JSON.parse(sectionsJson);
  } catch {
    sections = [];
  }
  return { ...rest, sections };
}

policiesRouter.get("/", async (_req, res) => {
  const policies = await prisma.policy.findMany({ orderBy: { position: "asc" } });
  res.json(policies.map(serialize));
});

policiesRouter.post("/", requireAdmin, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid policy" });
  const { sections, slug, ...rest } = parsed.data;
  const finalSlug = slug?.trim() ? slugify(slug) : slugify(rest.title);
  const policy = await prisma.policy.create({
    data: { ...rest, slug: finalSlug, sectionsJson: JSON.stringify(sections) },
  });
  res.status(201).json(serialize(policy));
});

policiesRouter.put("/:id", requireAdmin, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid policy" });
  const { sections, slug, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest, sectionsJson: JSON.stringify(sections) };
  if (slug?.trim()) data.slug = slugify(slug);
  const policy = await prisma.policy.update({ where: { id: req.params.id }, data });
  res.json(serialize(policy));
});

policiesRouter.delete("/:id", requireAdmin, async (req, res) => {
  await prisma.policy.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
