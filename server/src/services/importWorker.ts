import sharp from "sharp";
import { prisma } from "../db.js";
import { copyPhotoToProduct } from "./importProductPhotos.js";
import { persistImage, readAsDataUrl, deleteUnusedAssets } from "../utils/imageStore.js";
import { withUniqueSlug } from "../routes/products.js";
import {
  openai,
  generateShot,
  makeZoom,
  describeSaree,
  detectSarees,
  aiErrorMessage,
  isOutOfCredits,
  isRateLimited,
  type Listing,
} from "./aiCatalogue.js";

// Each group makes 2 OpenAI calls at once (1 image + listing).
const CONCURRENCY = Math.max(1, Number(process.env.IMPORT_CONCURRENCY) || 3);
const MAX_REFERENCE_PHOTOS = 8;
const RATE_LIMIT_PAUSE_MS = 60_000;
// Large batches will hit OpenAI rate limits; waiting and retrying is normal, not a failure.
const MAX_RATE_LIMIT_RETRIES = 10;

let active = 0;
let groupingActive = false;
const rateLimitRetries = new Map<string, number>();

const naturalCompare = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

type SortablePhoto = { name: string; folder: string; takenAt: string };

/**
 * Shooting order: camera capture time when the photo has one (survives renamed/copied/mixed files),
 * otherwise folder + natural file name. Photos without a capture time go after those with one.
 */
export function shootingOrder(a: SortablePhoto, b: SortablePhoto) {
  if (a.takenAt && b.takenAt) return a.takenAt.localeCompare(b.takenAt) || naturalCompare(a.name, b.name);
  if (a.takenAt !== b.takenAt) return a.takenAt ? -1 : 1;
  return naturalCompare(a.folder, b.folder) || naturalCompare(a.name, b.name);
}

/** Call once on boot: anything interrupted by a restart is picked up again. */
export async function startImportWorker() {
  await prisma.importGroup.updateMany({ where: { status: "processing" }, data: { status: "queued" } });
  kickImportWorker();
}

export function kickImportWorker() {
  void runGroupingQueue();
  while (active < CONCURRENCY) {
    active++;
    void processNext().finally(() => {
      active--;
    });
  }
}

// ---- grouping -------------------------------------------------------------

async function runGroupingQueue() {
  if (groupingActive) return;
  groupingActive = true;
  try {
    for (;;) {
      const batch = await prisma.importBatch.findFirst({ where: { status: "grouping" }, orderBy: { createdAt: "asc" } });
      if (!batch) return;
      try {
        await groupBatch(batch.id, batch.mode);
        await prisma.importBatch.update({ where: { id: batch.id }, data: { status: "review", error: "" } });
      } catch (err) {
        console.error("Import grouping error:", err);
        await prisma.importBatch.update({ where: { id: batch.id }, data: { status: "uploading", error: aiErrorMessage(err) } });
      }
    }
  } finally {
    groupingActive = false;
  }
}

const secondsBetween = (earlier: string, later: string) => (Date.parse(`${later}Z`) - Date.parse(`${earlier}Z`)) / 1000;

/** A small copy of a stored photo. Bigger copies made the AI nitpick texture and split one saree into pieces. */
async function groupingImage(src: string) {
  const input = Buffer.from((await readAsDataUrl(src)).split(",")[1], "base64");
  const out = await sharp(input).rotate().resize({ width: 384, height: 384, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
  return `data:image/jpeg;base64,${out.toString("base64")}`;
}

async function groupBatch(batchId: string, mode: string) {
  const photos = await prisma.importPhoto.findMany({ where: { batchId }, select: { id: true, name: true, folder: true, takenAt: true, src: true } });
  if (!photos.length) throw new Error("Upload some photos first.");

  const starts = new Set<number>([0]);
  if (mode === "folders") {
    photos.sort((a, b) => naturalCompare(a.folder, b.folder) || naturalCompare(a.name, b.name));
    photos.forEach((p, i) => {
      if (i > 0 && p.folder !== photos[i - 1].folder) starts.add(i);
    });
  } else {
    if (!openai()) throw new Error("AI grouping needs OPENAI_API_KEY on the server. Use folder grouping instead.");
    // Folders are ignored here: camera folders (DCIM/100MEDIA, 101MEDIA...) can split one saree's photos.
    photos.sort(shootingOrder);
    const gaps = photos.map((p, i) => (i && p.takenAt && photos[i - 1].takenAt ? secondsBetween(photos[i - 1].takenAt!, p.takenAt) : null));
    const images: string[] = [];
    for (const p of photos) images.push(await groupingImage(p.src));
    for (const index of await detectSarees(images.map((image, i) => ({ image, gapSeconds: gaps[i] })))) starts.add(index);
  }

  const boundaries = [...starts].sort((a, b) => a - b);
  await prisma.$transaction(
    async (tx) => {
      await tx.importGroup.deleteMany({ where: { batchId, productId: null } });
      for (const [i, from] of boundaries.entries()) {
        const slice = photos.slice(from, boundaries[i + 1] ?? photos.length);
        const group = await tx.importGroup.create({ data: { batchId, position: i } });
        await tx.importPhoto.updateMany({ where: { id: { in: slice.map((p) => p.id) } }, data: { groupId: group.id } });
      }
      for (const [position, p] of photos.entries()) {
        await tx.importPhoto.update({ where: { id: p.id }, data: { position } });
      }
    },
    { timeout: 120_000 }
  );
}

// ---- generation -----------------------------------------------------------

async function claimNextGroup() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = await prisma.importGroup.findFirst({
      where: { status: "queued", batch: { status: "running" } },
      orderBy: [{ batch: { createdAt: "asc" } }, { position: "asc" }],
      select: { id: true },
    });
    if (!candidate) return null;
    // Only one worker wins the claim even if two raced to the same row.
    const { count } = await prisma.importGroup.updateMany({ where: { id: candidate.id, status: "queued" }, data: { status: "processing", error: "" } });
    if (count === 1) return candidate.id;
  }
  return null;
}

async function processNext(): Promise<void> {
  for (;;) {
    const groupId = await claimNextGroup();
    if (!groupId) return;
    await processGroup(groupId);
  }
}

function pickReferencePhotos<T>(photos: T[]): T[] {
  if (photos.length <= MAX_REFERENCE_PHOTOS) return photos;
  const step = (photos.length - 1) / (MAX_REFERENCE_PHOTOS - 1);
  return Array.from({ length: MAX_REFERENCE_PHOTOS }, (_, i) => photos[Math.round(i * step)]);
}

async function processGroup(groupId: string) {
  const group = await prisma.importGroup.findUnique({
    where: { id: groupId },
    include: { batch: true, photos: { orderBy: { position: "asc" } } },
  });
  if (!group) return;

  try {
    if (!group.photos.length) throw new Error("This saree has no photos.");
    const references = await Promise.all(pickReferencePhotos(group.photos).map((p) => readAsDataUrl(p.src)));
    const notes = group.batch.notes;
    const existing = group.productId ? await prisma.product.findUnique({ where: { id: group.productId }, include: { images: true } }) : null;

    const [listing, catalogue] = await Promise.all([
      existing ? Promise.resolve(null) : describeSaree(references, notes),
      generateShot(references, "Catalogue", notes),
    ]);
    // Second picture is a zoomed crop of the first -- no second generation.
    const zoom = await makeZoom(catalogue);

    const altFor = (kind: string, l: Listing | null) =>
      (kind === "Catalogue" ? l?.altCatalogue : l?.altZoom) || `${existing?.name ?? l?.name ?? "Saree"} -- ${kind.toLowerCase()}`;
    // Order: generated photo, then the source photos the admin ticked, then the zoom.
    const chosen = group.photos.filter((p) => p.include);
    const productName = existing?.name ?? listing?.name ?? "Saree";
    const images: { src: string; alt: string; label: string; position: number; importPhotoId?: string }[] = [
      { src: await persistImage(catalogue), alt: altFor("Catalogue", listing), label: "Catalogue", position: 0 },
      ...(await Promise.all(chosen.map(async (p, i) => ({ ...(await copyPhotoToProduct("", p, `${productName} -- photo ${i + 1}`)), position: 1 + i })))),
      { src: await persistImage(zoom), alt: altFor("Zoom", listing), label: "Zoom", position: 1 + chosen.length },
    ];

    let productId = existing?.id;
    if (existing) {
      // Regenerate: replace only the images, keep any details the admin already edited.
      await prisma.$transaction([
        prisma.productImage.deleteMany({ where: { productId: existing.id } }),
        prisma.product.update({ where: { id: existing.id }, data: { images: { create: images } } }),
      ]);
      await deleteUnusedAssets(existing.images.map((i) => i.src), images.map((i) => i.src));
    } else if (listing) {
      const product = await withUniqueSlug(listing.name, (slug) => prisma.product.create({
        data: {
          name: listing.name,
          slug,
          category: listing.category,
          subcategory: listing.subcategory,
          occasion: listing.occasion,
          material: listing.material,
          color: listing.color,
          pattern: listing.pattern,
          shortDescription: listing.shortDescription,
          description: listing.description,
          seoTitle: listing.seoTitle,
          seoDescription: listing.seoDescription,
          status: "draft",
          images: { create: images },
        },
      }));
      productId = product.id;
    }

    rateLimitRetries.delete(groupId);
    await prisma.importGroup.update({ where: { id: groupId }, data: { status: "done", error: "", productId } });
  } catch (err) {
    console.error(`Import group ${groupId} failed:`, err);
    if (isOutOfCredits(err)) {
      // Stop the whole batch rather than failing every remaining saree one by one.
      await prisma.importGroup.update({ where: { id: groupId }, data: { status: "queued" } });
      await prisma.importBatch.update({ where: { id: group.batchId }, data: { status: "paused", error: aiErrorMessage(err) } });
      return;
    }
    if (isRateLimited(err) && (rateLimitRetries.get(groupId) ?? 0) < MAX_RATE_LIMIT_RETRIES) {
      rateLimitRetries.set(groupId, (rateLimitRetries.get(groupId) ?? 0) + 1);
      await new Promise((r) => setTimeout(r, RATE_LIMIT_PAUSE_MS));
      await prisma.importGroup.update({ where: { id: groupId }, data: { status: "queued" } });
      return;
    }
    rateLimitRetries.delete(groupId);
    await prisma.importGroup.update({ where: { id: groupId }, data: { status: "failed", error: aiErrorMessage(err) } });
  } finally {
    await markBatchDoneIfFinished(group.batchId);
  }
}

async function markBatchDoneIfFinished(batchId: string) {
  const remaining = await prisma.importGroup.count({ where: { batchId, status: { in: ["queued", "processing"] } } });
  if (remaining === 0) {
    await prisma.importBatch.updateMany({ where: { id: batchId, status: "running" }, data: { status: "done" } });
  }
}
