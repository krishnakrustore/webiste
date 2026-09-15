import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { slugify } from "../utils/slugify.js";
import { requireAdmin } from "../middleware/auth.js";

export const productsRouter = Router();

const imageSchema = z.object({ src: z.string().min(1), alt: z.string().default("") });

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional().nullable(),
  category: z.string().min(1),
  subcategory: z.string().default(""),
  description: z.string().default(""),
  shortDescription: z.string().default(""),
  price: z.number().nonnegative(),
  priceUnit: z.string().default("per piece"),
  material: z.string().default(""),
  color: z.string().default(""),
  pattern: z.string().default(""),
  occasion: z.string().default(""),
  availability: z.enum(["Available", "Made to Order", "Sold Out"]).default("Available"),
  featured: z.boolean().default(false),
  images: z.array(imageSchema).min(1, "At least one image is required"),
});

function withImages(product: { images: { id: string; src: string; alt: string; position: number }[] } & Record<string, unknown>) {
  return { ...product, images: [...product.images].sort((a, b) => a.position - b.position) };
}

// GET /api/products?category=&featured=&q=
productsRouter.get("/", async (req, res) => {
  const { category, featured, q } = req.query as { category?: string; featured?: string; q?: string };
  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (featured === "true") where.featured = true;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { material: { contains: q } },
      { color: { contains: q } },
      { subcategory: { contains: q } },
    ];
  }
  const products = await prisma.product.findMany({
    where,
    include: { images: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(products.map(withImages));
});

productsRouter.get("/slug/:slug", async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: { images: true },
  });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(withImages(product));
});

productsRouter.get("/:id", async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id }, include: { images: true } });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(withImages(product));
});

productsRouter.post("/", requireAdmin, async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid product" });
  const data = parsed.data;

  const slug = slugify(data.name);
  const product = await prisma.product.create({
    data: {
      ...data,
      slug,
      sku: data.sku || null,
      images: { create: data.images.map((img, i) => ({ src: img.src, alt: img.alt, position: i })) },
    },
    include: { images: true },
  });
  res.status(201).json(withImages(product));
});

productsRouter.put("/:id", requireAdmin, async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid product" });
  const data = parsed.data;
  const slug = slugify(data.name);

  await prisma.productImage.deleteMany({ where: { productId: req.params.id } });
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...data,
      slug,
      sku: data.sku || null,
      images: { create: data.images.map((img, i) => ({ src: img.src, alt: img.alt, position: i })) },
    },
    include: { images: true },
  });
  res.json(withImages(product));
});

productsRouter.delete("/:id", requireAdmin, async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
