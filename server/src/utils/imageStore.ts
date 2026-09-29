import type { Request } from "express";
import { prisma } from "../db.js";

const PREFIX = "/api/images/";
const MAX_BYTES = 8 * 1024 * 1024;

export class ImageValidationError extends Error {}

/** Stores a data: URL as an ImageAsset and returns its relative URL; any other src is returned unchanged. */
export async function persistImage(src: string): Promise<string> {
  if (!src.startsWith("data:")) return src;
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(src);
  if (!match) throw new ImageValidationError("Unsupported image format");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > MAX_BYTES) throw new ImageValidationError("Image is larger than 8MB");
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
  const candidates = previous.map(assetIdOf).filter((id): id is string => Boolean(id) && !keep.has(id));
  const drop: string[] = [];
  for (const id of candidates) {
    // Past orders keep a copy of the product's first image URL -- don't break their thumbnails.
    const usedByOrder = await prisma.orderItem.findFirst({ where: { image: { endsWith: `${PREFIX}${id}` } }, select: { id: true } });
    if (!usedByOrder) drop.push(id);
  }
  if (drop.length) await prisma.imageAsset.deleteMany({ where: { id: { in: drop } } });
}

function apiOrigin(req: Request): string {
  return process.env.PUBLIC_API_ORIGIN?.replace(/\/$/, "") ?? `${req.protocol}://${req.get("host")}`;
}

/** Turns stored relative image paths into absolute URLs the storefront (a different origin) can load. */
export function publicSrc(req: Request, src: string): string {
  return src.startsWith(PREFIX) ? `${apiOrigin(req)}${src}` : src;
}
