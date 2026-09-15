import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

export const careGuidesRouter = Router();

const schema = z.object({
  title: z.string().min(1),
  matchTerm: z.string().min(1),
  content: z.string().min(1),
  position: z.number().int().default(0),
});

careGuidesRouter.get("/", async (_req, res) => {
  const guides = await prisma.careGuide.findMany({ orderBy: { position: "asc" } });
  res.json(guides);
});

careGuidesRouter.post("/", requireAdmin, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid care guide" });
  const guide = await prisma.careGuide.create({ data: parsed.data });
  res.status(201).json(guide);
});

careGuidesRouter.put("/:id", requireAdmin, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid care guide" });
  const guide = await prisma.careGuide.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(guide);
});

careGuidesRouter.delete("/:id", requireAdmin, async (req, res) => {
  await prisma.careGuide.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
