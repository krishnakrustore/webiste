import { Router, type Request } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db.js";
import { slugify } from "../utils/slugify.js";
import { requireAdmin, isAdminRequest } from "../middleware/auth.js";
import {
  persistImage,
  normalizeStoredSrc,
  deleteUnusedAssets,
  publicSrc,
  ImageValidationError,
} from "../utils/imageStore.js";

export const productsRouter = Router();

// Zoom is the AI close-up; Blouse/Pallu/Detail are kept for existing products and manual uploads.
export const IMAGE_LABELS = ["", "Catalogue", "Zoom", "Blouse", "Pallu", "Detail"] as const;

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
  price: z.number().nonnegative().default(0),
  priceUnit: z.string().default(""),
  material: z.string().default(""),
  color: z.string().default(""),
  pattern: z.string().default(""),
  occasion: z.string().default(""),
  availability: z.enum(["Available", "Made to Order", "Sold Out"]).default("Available"),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("published"),
  seoTitle: z.string().max(70, "SEO title should be 70 characters or fewer").default(""),
  seoDescription: z.string().max(170, "SEO description should be 170 characters or fewer").default(""),
  images: z.array(imageSchema).min(1, "At least one image is required").max(12, "At most 12 images per product"),
});

type ProductWithImages = {
  images: { id: string; src: string; alt: string; label: string; position: number }[];
} & Record<string, unknown>;

export function serializeProduct(req: Request, product: ProductWithImages) {
  return {
    ...product,
    images: [...product.images]
      .sort((a, b) => a.position - b.position)
      .map((img) => ({ ...img, src: publicSrc(req, img.src) })),
  };
}

export async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "product";
  let slug = base;
  for (let n = 2; ; n++) {
    const clash = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!clash || clash.id === excludeId) return slug;
    slug = `${base}-${n}`;
  }
}

/**
 * Creates/updates a row under a unique slug. Two saves with the same name at the same moment
 * (e.g. bulk import generating two "Red Banarasi Silk Saree"s in parallel) can both see a slug
 * as free, so a slug collision is retried with the next suffix.
 */
export async function withUniqueSlug<T>(name: string, write: (slug: string) => Promise<T>, excludeId?: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const slug = await uniqueSlug(name, excludeId);
    try {
      return await write(slug);
    } catch (err) {
      const slugClash = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && String(err.meta?.target).includes("slug");
      if (!slugClash || attempt >= 5) throw err;
    }
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

// GET /api/products?category=&featured=&q=   (admins may add ?all=true or ?status=draft|published)
productsRouter.get("/", async (req, res) => {
  const { category, featured, q, all, status } = req.query as Record<string, string | undefined>;
  const where: Record<string, unknown> = {};
  if (!isAdminRequest(req)) where.status = "published";
  else if (status === "draft" || status === "published") where.status = status;
  else if (all !== "true") where.status = "published";
  if (category) where.category = category;
  if (featured === "true") where.featured = true;
  if (q) {
    const contains = isPostgres() ? { contains: q, mode: "insensitive" } : { contains: q };
    where.OR = ["name", "material", "color", "subcategory", "category"].map((field) => ({ [field]: contains }));
  }
  const products = await prisma.product.findMany({ where, include: { images: true }, orderBy: { createdAt: "desc" } });
  res.json(products.map((p) => serializeProduct(req, p)));
});

productsRouter.get("/slug/:slug", async (req, res) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug }, include: { images: true } });
  if (!product || (product.status !== "published" && !isAdminRequest(req))) return res.status(404).json({ error: "Product not found" });
  res.json(serializeProduct(req, product));
});

productsRouter.get("/:id", async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id }, include: { images: true } });
  if (!product || (product.status !== "published" && !isAdminRequest(req))) return res.status(404).json({ error: "Product not found" });
  res.json(serializeProduct(req, product));
});

productsRouter.post("/", requireAdmin, async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid product" });
  const { images, ...data } = parsed.data;

  try {
    const stored = await storeImages(images);
    const product = await withUniqueSlug(data.name, (slug) =>
      prisma.product.create({
        data: { ...data, slug, sku: data.sku || null, images: { create: stored } },
        include: { images: true },
      })
    );
    res.status(201).json(serializeProduct(req, product));
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
    res.json(serializeProduct(req, product));
  } catch (err) {
    if (err instanceof ImageValidationError) return res.status(400).json({ error: err.message });
    throw err;
  }
});

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1).max(500),
  action: z.enum(["publish", "unpublish", "delete"]),
});

productsRouter.post("/bulk", requireAdmin, async (req, res) => {
  const parsed = bulkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
  const { ids, action } = parsed.data;
  if (action === "delete") {
    const doomed = await prisma.product.findMany({ where: { id: { in: ids } }, include: { images: true } });
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
    await deleteUnusedAssets(doomed.flatMap((p) => p.images.map((i) => i.src)), []);
    return res.json({ count: doomed.length });
  }
  const result = await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { status: action === "publish" ? "published" : "draft" },
  });
  res.json({ count: result.count });
});

productsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id }, include: { images: true } });
  if (!existing) return res.status(404).json({ error: "Product not found" });
  await prisma.product.delete({ where: { id: existing.id } });
  await deleteUnusedAssets(existing.images.map((i) => i.src), []);
  res.status(204).end();
});
