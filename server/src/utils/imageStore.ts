import type { Request } from "express";
import { createHash } from "node:crypto";
import { prisma } from "../db.js";

const PREFIX = "/api/images/";
const MAX_BYTES = 8 * 1024 * 1024;

export class ImageValidationError extends Error {}

// ---- Cloudinary (optional) ------------------------------------------------
// With CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET set, product and banner images go to Cloudinary's CDN instead of
// the database. Bulk-import source photos always stay in the database (they are temporary), so they never use credits.
const cloud = () => {
  const { CLOUDINARY_CLOUD_NAME: name, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = process.env;
  return name && key && secret ? { name, key, secret } : null;
};
export const cloudinaryEnabled = () => cloud() !== null;
const sign = (params: Record<string, string>, secret: string) =>
  createHash("sha1")
    .update(
      Object.keys(params)
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join("&") + secret
    )
    .digest("hex");

async function uploadToCloudinary(dataUrl: string): Promise<string> {
  const c = cloud()!;
  const params = { folder: "kgbk", timestamp: String(Math.floor(Date.now() / 1000)) };
  const form = new FormData();
  form.set("file", dataUrl);
  form.set("api_key", c.key);
  form.set("signature", sign(params, c.secret));
  for (const [k, v] of Object.entries(params)) form.set(k, v);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${c.name}/image/upload`, { method: "POST", body: form });
  const body = (await res.json().catch(() => null)) as { secure_url?: string; error?: { message?: string } } | null;
  if (!res.ok || !body?.secure_url) throw new Error(`Cloudinary upload failed: ${body?.error?.message ?? res.status}`);
  // f_auto/q_auto: Cloudinary serves each visitor the smallest good format (WebP/AVIF), which saves bandwidth credits.
  return body.secure_url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
}

const cloudinaryPublicId = (src: string) =>
  /res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(kgbk\/[^./]+)\.\w+$/.exec(src)?.[1] ?? null;

async function deleteFromCloudinary(publicIds: string[]) {
  const c = cloud();
  if (!c) return;
  for (const id of publicIds) {
    const params = { public_id: id, timestamp: String(Math.floor(Date.now() / 1000)) };
    const form = new FormData();
    form.set("api_key", c.key);
    form.set("signature", sign(params, c.secret));
    for (const [k, v] of Object.entries(params)) form.set(k, v);
    await fetch(`https://api.cloudinary.com/v1_1/${c.name}/image/destroy`, { method: "POST", body: form }).catch(() => undefined);
  }
}

/**
 * Stores a data: URL and returns its URL; any other src is returned unchanged.
 * "public" images (products, banners) go to Cloudinary when configured; "private" ones always stay in the database.
 */
export async function persistImage(src: string, where: "public" | "private" = "public"): Promise<string> {
  if (!src.startsWith("data:")) return src;
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(src);
  if (!match) throw new ImageValidationError("Unsupported image format");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > MAX_BYTES) throw new ImageValidationError("Image is larger than 8MB");
  if (where === "public" && cloudinaryEnabled()) return uploadToCloudinary(src);
  const asset = await prisma.imageAsset.create({ data: { mime: match[1].toLowerCase(), data: new Uint8Array(bytes) } });
  return `${PREFIX}${asset.id}`;
}

/** Also accepts absolute URLs this server previously handed out, so round-tripped product JSON doesn't re-upload. */
export function normalizeStoredSrc(src: string): string {
  const i = src.indexOf(PREFIX);
  return i > 0 && /^https?:\/\//.test(src) ? src.slice(i) : src;
}

export function assetIdOf(src: string): string | null {
  const normalized = normalizeStoredSrc(src);
  return normalized.startsWith(PREFIX) ? normalized.slice(PREFIX.length) : null;
}

export async function deleteUnusedAssets(previous: string[], next: string[]) {
  const keep = new Set(next.map(assetIdOf).filter(Boolean));
  const drop = previous.map(assetIdOf).filter((id): id is string => Boolean(id) && !keep.has(id));
  if (drop.length) await prisma.imageAsset.deleteMany({ where: { id: { in: drop } } });
  const kept = new Set(next);
  await deleteFromCloudinary(previous.filter((src) => !kept.has(src)).map(cloudinaryPublicId).filter((id): id is string => Boolean(id)));
}

/** Loads a stored image back as a data URL (for sending to the AI). */
export async function readAsDataUrl(src: string): Promise<string> {
  if (/^https?:\/\//.test(src) && !src.includes(PREFIX)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error("A stored photo could not be downloaded");
    return `data:${res.headers.get("content-type") ?? "image/webp"};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  }
  const id = assetIdOf(src);
  if (!id) throw new Error(`Not a stored image: ${src}`);
  const asset = await prisma.imageAsset.findUnique({ where: { id } });
  if (!asset) throw new Error("A source photo is missing from storage");
  return `data:${asset.mime};base64,${Buffer.from(asset.data).toString("base64")}`;
}

function apiOrigin(req: Request): string {
  return process.env.PUBLIC_API_ORIGIN?.replace(/\/$/, "") ?? `${req.protocol}://${req.get("host")}`;
}

/** Turns stored relative image paths into absolute URLs the storefront (a different origin) can load. */
export function publicSrc(req: Request, src: string): string {
  return src.startsWith(PREFIX) ? `${apiOrigin(req)}${src}` : src;
}
