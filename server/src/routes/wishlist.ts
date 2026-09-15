import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireCustomer, type AuthedRequest } from "../middleware/auth.js";

export const wishlistRouter = Router();

wishlistRouter.get("/", requireCustomer, async (req: AuthedRequest, res) => {
  const items = await prisma.wishlistItem.findMany({
    where: { customerId: req.customerId },
    include: { product: { include: { images: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(items.map((i) => i.product));
});

const addSchema = z.object({ productId: z.string().min(1) });

wishlistRouter.post("/", requireCustomer, async (req: AuthedRequest, res) => {
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "productId is required" });
  try {
    await prisma.wishlistItem.create({ data: { customerId: req.customerId!, productId: parsed.data.productId } });
  } catch {
    // already in wishlist -- treat as success (idempotent)
  }
  res.status(201).json({ ok: true });
});

wishlistRouter.delete("/:productId", requireCustomer, async (req: AuthedRequest, res) => {
  await prisma.wishlistItem.deleteMany({ where: { customerId: req.customerId, productId: req.params.productId } });
  res.status(204).end();
});
