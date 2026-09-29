import { Router } from "express";
import { prisma } from "../db.js";
import { slugify } from "../utils/slugify.js";

export const sitemapRouter = Router();

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

sitemapRouter.get("/", async (_req, res) => {
  const site = (process.env.SITE_URL || "https://krishnagaribattalakottu.com").replace(/\/$/, "");
  const [categories, products, policies] = await Promise.all([
    prisma.category.findMany({ select: { slug: true } }),
    prisma.product.findMany({ select: { slug: true, category: true, updatedAt: true } }),
    prisma.policy.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  const urls: { loc: string; lastmod?: Date; priority: string }[] = [
    { loc: "/", priority: "1.0" },
    { loc: "/collection", priority: "0.9" },
    { loc: "/about", priority: "0.5" },
    { loc: "/contact", priority: "0.5" },
    ...categories.map((c) => ({ loc: `/collection/${c.slug}`, priority: "0.8" })),
    ...products.map((p) => ({ loc: `/collection/${slugify(p.category)}/${p.slug}`, lastmod: p.updatedAt, priority: "0.7" })),
    ...policies.map((p) => ({ loc: `/policies/${p.slug}`, lastmod: p.updatedAt, priority: "0.3" })),
  ];

  const body = urls
    .map(
      (u) =>
        `  <url><loc>${escapeXml(site + u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.toISOString().slice(0, 10)}</lastmod>` : ""}<priority>${u.priority}</priority></url>`
    )
    .join("\n");

  res.set("Cache-Control", "public, max-age=3600");
  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
});
