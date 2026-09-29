import { Router, type Request } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { slugify } from "../utils/slugify.js";
import { requireAdmin } from "../middleware/auth.js";
import {
  persistImage,
  normalizeStoredSrc,
  deleteUnusedAssets,
  publicSrc,
  ImageValidationError,
} from "../utils/imageStore.js";

export const productsRouter = Router();

export const IMAGE_LABELS = ["", "Catalogue", "Blouse", "Pallu", "Detail"] as const;

const imageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().default(""),
  label: z.enum(IMAGE_LABELS).default(""),
});

const productSchema = z.object({
  name: z.string().trim().min(1),
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
  seoTitle: z.string().max(70, "SEO title should be 70 characters or fewer").default(""),
  seoDescription: z.string().max(170, "SEO description should be 170 characters or fewer").default(""),
  images: z.array(imageSchema).min(1, "At least one image is required").max(12, "At most 12 images per product"),
});

type ProductWithImages = {
  images: { id: string; src: string; alt: string; label: string; position: number }[];
} & Record<string, unknown>;

function serialize(req: Request, product: ProductWithImages) {
  return {
    ...product,
    images: [...product.images]
      .sort((a, b) => a.position - b.position)
      .map((img) => ({ ...img, src: publicSrc(req, img.src) })),
  };
}

async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "product";
  let slug = base;
  for (let n = 2; ; n++) {
    const clash = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!clash || clash.id === excludeId) return slug;
    slug = `${base}-${n}`;
  }
}

async function storeImages(images: z.infer<typeof imageSchema>[]) {
  const stored = [];
  for (const [i, img] of images.entries()) {
    stored.push({ src: await persistImage(normalizeStoredSrc(img.src)), alt: img.alt, label: img.label, position: i });
  }
  return stored;
}

const isPostgres = () => !process.env.DATABASE_URL?.startsWith("file:");

// GET /api/products?category=&featured=&q=
productsRouter.get("/", async (req, res) => {
  const { category, featured, q } = req.query as { category?: string; featured?: string; q?: string };
  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (featured === "true") where.featured = true;
  if (q) {
    const contains = isPostgres() ? { contains: q, mode: "insensitive" } : { contains: q };
    where.OR = ["name", "material", "color", "subcategory", "category"].map((field) => ({ [field]: contains }));
  }
  const products = await prisma.product.findMany({ where, include: { images: true }, orderBy: { createdAt: "desc" } });
  res.json(products.map((p) => serialize(req, p)));
});

productsRouter.get("/slug/:slug", async (req, res) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug }, include: { images: true } });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(serialize(req, product));
});

productsRouter.get("/:id", async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id }, include: { images: true } });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(serialize(req, product));
});

productsRouter.post("/", requireAdmin, async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid product" });
  const { images, ...data } = parsed.data;

  try {
    const product = await prisma.product.create({
      data: {
        ...data,
        slug: await uniqueSlug(data.name),
        sku: data.sku || null,
        images: { create: await storeImages(images) },
      },
      include: { images: true },
    });
    res.status(201).json(serialize(req, product));
  } catch (err) {
    if (err instanceof ImageValidationError) return res.status(400).json({ error: err.message });
    throw err;
  }
});

productsRouter.put("/:id", requireAdmin, async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid product" });
  const { images, ...data } = parsed.data;

  const existing = await prisma.product.findUnique({ where: { id: req.params.id }, include: { images: true } });
  if (!existing) return res.status(404).json({ error: "Product not found" });

  try {
    const stored = await storeImages(images);
    // Keep the URL stable unless the name actually changed -- changing slugs breaks shared links and search rankings.
    const slug = existing.name === data.name ? existing.slug : await uniqueSlug(data.name, existing.id);

    const product = await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: existing.id } });
      return tx.product.update({
        where: { id: existing.id },
        data: { ...data, slug, sku: data.sku || null, images: { create: stored } },
        include: { images: true },
      });
    });
    await deleteUnusedAssets(existing.images.map((i) => i.src), stored.map((i) => i.src));
    res.json(serialize(req, product));
  } catch (err) {
    if (err instanceof ImageValidationError) return res.status(400).json({ error: err.message });
    throw err;
  }
});

productsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id }, include: { images: true } });
  if (!existing) return res.status(404).json({ error: "Product not found" });
  await prisma.product.delete({ where: { id: existing.id } });
  await deleteUnusedAssets(existing.images.map((i) => i.src), []);
  res.status(204).end();
});
