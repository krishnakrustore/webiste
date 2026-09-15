import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

export const scheduleCallRouter = Router();

const scheduleSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  preferredTime: z.string().min(1),
  notes: z.string().optional().nullable(),
});

// No email account is configured, so requests are stored here and surface
// in Admin > Schedule Requests -- swap in a real email service (Resend,
// SendGrid, etc.) later and call it from this handler if you want an
// actual email notification too.
scheduleCallRouter.post("/", async (req, res) => {
  const parsed = scheduleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
  const item = await prisma.scheduleCallRequest.create({ data: parsed.data });
  res.status(201).json(item);
});

scheduleCallRouter.get("/", requireAdmin, async (_req, res) => {
  const items = await prisma.scheduleCallRequest.findMany({ orderBy: { createdAt: "desc" } });
  res.json(items);
});

scheduleCallRouter.delete("/:id", requireAdmin, async (req, res) => {
  await prisma.scheduleCallRequest.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
