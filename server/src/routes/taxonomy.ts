import { Router } from "express";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "../db.js";
import { slugify } from "../utils/slugify.js";
import { requireAdmin } from "../middleware/auth.js";

const namedListSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  image: z.string().optional().default(""),
});

/**
 * One generic router factory reused for categories, occasions and fabric
 * types -- all three are just name+slug keyed lists (fabric types simply
 * ignore description/image).
 */
function makeNamedListRouter(model: "category" | "occasion" | "fabricType") {
  const router = Router();
  const delegate = () => (prisma as unknown as Record<string, PrismaClient["category"]>)[model];
  const hasExtraFields = model !== "fabricType";

  router.get("/", async (_req, res) => {
    const items = await delegate().findMany({ orderBy: { name: "asc" } });
    res.json(items);
  });

  router.post("/", requireAdmin, async (req, res) => {
    const parsed = namedListSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    const { name, description, image } = parsed.data;
    const slug = slugify(name);
    const data = hasExtraFields ? { name, slug, description, image } : { name, slug };
    try {
      const item = await delegate().create({ data: data as never });
      res.status(201).json(item);
    } catch {
      res.status(409).json({ error: `"${name}" already exists` });
    }
  });

  router.put("/:slug", requireAdmin, async (req, res) => {
    const parsed = namedListSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    const { name, description, image } = parsed.data;
    const slug = slugify(name);
    const data = hasExtraFields ? { name, slug, description, image } : { name, slug };
    const item = await delegate().update({
      where: { slug: req.params.slug },
      data: data as never,
    });
    res.json(item);
  });

  router.delete("/:slug", requireAdmin, async (req, res) => {
    await delegate().delete({ where: { slug: req.params.slug } });
    res.status(204).end();
  });

  return router;
}

export const categoriesRouter = makeNamedListRouter("category");
export const occasionsRouter = makeNamedListRouter("occasion");
export const fabricTypesRouter = makeNamedListRouter("fabricType");
