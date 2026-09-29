import { Router } from "express";
import { prisma } from "../db.js";

export const imagesRouter = Router();

imagesRouter.get("/:id", async (req, res) => {
  const asset = await prisma.imageAsset.findUnique({ where: { id: req.params.id } });
  if (!asset) return res.status(404).end();
  // Asset ids are never reused -- a changed image gets a new id -- so this is safe to cache forever.
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  res.type(asset.mime).send(Buffer.from(asset.data));
});
