import { Router, type Request } from "express";
import { z } from "zod";
import { addPhotoToProduct, removePhotoFromProduct } from "../services/importProductPhotos.js";
import { prisma } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { persistImage, deleteUnusedAssets, publicSrc, ImageValidationError } from "../utils/imageStore.js";
import { kickImportWorker } from "../services/importWorker.js";

export const importRouter = Router();
importRouter.use(requireAdmin);

const EDITABLE_GROUP = ["pending", "skipped", "failed"];

const batchSchema = z.object({
  name: z.string().trim().min(1).max(120),
  mode: z.enum(["ai", "folders"]).default("ai"),
  notes: z.string().max(500).default(""),
});

async function batchSummary(batchId: string) {
  const counts = await prisma.importGroup.groupBy({ by: ["status"], where: { batchId }, _count: true });
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  const photos = await prisma.importPhoto.count({ where: { batchId } });
  return { photos, groups: counts.reduce((n, c) => n + c._count, 0), byStatus };
}

importRouter.get("/batches", async (_req, res) => {
  const batches = await prisma.importBatch.findMany({ orderBy: { createdAt: "desc" } });
  res.json(await Promise.all(batches.map(async (b) => ({ ...b, ...(await batchSummary(b.id)) }))));
});

importRouter.post("/batches", async (req, res) => {
  const parsed = batchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid batch" });
  res.status(201).json(await prisma.importBatch.create({ data: parsed.data }));
});

importRouter.patch("/batches/:id", async (req, res) => {
  const parsed = batchSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid batch" });
  res.json(await prisma.importBatch.update({ where: { id: req.params.id }, data: parsed.data }));
});

const photoView = (req: Request, p: { id: string; name: string; folder: string; thumb: string; src: string; include: boolean }) => ({
  id: p.id,
  include: p.include,
  name: p.name,
  folder: p.folder,
  thumb: publicSrc(req, p.thumb),
  src: publicSrc(req, p.src),
});

importRouter.get("/batches/:id", async (req, res) => {
  const batch = await prisma.importBatch.findUnique({ where: { id: req.params.id } });
  if (!batch) return res.status(404).json({ error: "Import not found" });
  const groups = await prisma.importGroup.findMany({
    where: { batchId: batch.id },
    orderBy: { position: "asc" },
    include: { photos: { orderBy: { position: "asc" } } },
  });
  const productIds = groups.map((g) => g.productId).filter((id): id is string => Boolean(id));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, status: true, images: { orderBy: { position: "asc" }, select: { src: true, label: true } } },
  });
  const productById = new Map(products.map((p) => [p.id, { ...p, images: p.images.map((i) => ({ ...i, src: publicSrc(req, i.src) })) }]));
  res.json({
    ...batch,
    ...(await batchSummary(batch.id)),
    groups: groups.map((g) => ({
      id: g.id,
      position: g.position,
      status: g.status,
      error: g.error,
      product: g.productId ? productById.get(g.productId) ?? null : null,
      photos: g.photos.map((p) => photoView(req, p)),
    })),
  });
});

// Lets the uploader skip files already sent, so a 1,500-photo upload can resume after an interruption.
importRouter.get("/batches/:id/keys", async (req, res) => {
  const photos = await prisma.importPhoto.findMany({ where: { batchId: req.params.id }, select: { folder: true, name: true } });
  res.json(photos.map((p) => `${p.folder}/${p.name}`));
});

const jpegDataUrl = z.string().regex(/^data:image\/(jpeg|png|webp);base64,/i, "Photos must be JPEG, PNG or WebP");
const uploadSchema = z.object({
  photos: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        folder: z.string().max(500).default(""),
        takenAt: z.string().regex(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})?$/).default(""),
        src: jpegDataUrl,
        thumb: jpegDataUrl,
      })
    )
    .min(1)
    .max(10),
});

importRouter.post("/batches/:id/photos", async (req, res) => {
  const batch = await prisma.importBatch.findUnique({ where: { id: req.params.id } });
  if (!batch) return res.status(404).json({ error: "Import not found" });
  if (!["uploading", "review"].includes(batch.status)) return res.status(409).json({ error: "Photos can't be added while sarees are being generated." });
  const parsed = uploadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid photos" });

  let position = await prisma.importPhoto.count({ where: { batchId: batch.id } });
  let added = 0;
  try {
    for (const p of parsed.data.photos) {
      const exists = await prisma.importPhoto.findUnique({ where: { batchId_folder_name: { batchId: batch.id, folder: p.folder, name: p.name } }, select: { id: true } });
      if (exists) continue;
      const [src, thumb] = [await persistImage(p.src), await persistImage(p.thumb)];
      await prisma.importPhoto.create({ data: { batchId: batch.id, name: p.name, folder: p.folder, takenAt: p.takenAt, src, thumb, position: position++ } });
      added++;
    }
  } catch (err) {
    if (err instanceof ImageValidationError) return res.status(400).json({ error: err.message });
    throw err;
  }
  res.status(201).json({ added });
});

importRouter.post("/batches/:id/group", async (req, res) => {
  const batch = await prisma.importBatch.findUnique({ where: { id: req.params.id } });
  if (!batch) return res.status(404).json({ error: "Import not found" });
  if (!["uploading", "review"].includes(batch.status)) return res.status(409).json({ error: "This import is already generating." });
  if (await prisma.importGroup.count({ where: { batchId: batch.id, productId: { not: null } } })) {
    return res.status(409).json({ error: "Some sarees in this import are already generated, so it can't be regrouped." });
  }
  if (!(await prisma.importPhoto.count({ where: { batchId: batch.id } }))) return res.status(400).json({ error: "Upload some photos first." });
  await prisma.importBatch.update({ where: { id: batch.id }, data: { status: "grouping", error: "" } });
  kickImportWorker();
  res.json({ ok: true });
});

importRouter.post("/batches/:id/generate", async (req, res) => {
  const limit = z.object({ limit: z.number().int().positive().optional() }).safeParse(req.body ?? {});
  const batch = await prisma.importBatch.findUnique({ where: { id: req.params.id } });
  if (!batch) return res.status(404).json({ error: "Import not found" });
  if (batch.status === "grouping" || batch.status === "uploading") return res.status(409).json({ error: "Group the photos into sarees first." });
  const pending = await prisma.importGroup.findMany({
    where: { batchId: batch.id, status: "pending" },
    orderBy: { position: "asc" },
    take: limit.success ? limit.data.limit : undefined,
    select: { id: true },
  });
  await prisma.importGroup.updateMany({ where: { id: { in: pending.map((g) => g.id) } }, data: { status: "queued" } });
  const queued = await prisma.importGroup.count({ where: { batchId: batch.id, status: "queued" } });
  if (!queued) return res.status(400).json({ error: "Nothing left to generate." });
  await prisma.importBatch.update({ where: { id: batch.id }, data: { status: "running", error: "" } });
  kickImportWorker();
  res.json({ queued });
});

importRouter.post("/batches/:id/pause", async (req, res) => {
  await prisma.importBatch.updateMany({ where: { id: req.params.id, status: "running" }, data: { status: "paused" } });
  res.json({ ok: true });
});

importRouter.post("/batches/:id/resume", async (req, res) => {
  const queued = await prisma.importGroup.count({ where: { batchId: req.params.id, status: "queued" } });
  await prisma.importBatch.update({ where: { id: req.params.id }, data: { status: queued ? "running" : "review", error: "" } });
  kickImportWorker();
  res.json({ ok: true });
});

importRouter.delete("/batches/:id", async (req, res) => {
  const batch = await prisma.importBatch.findUnique({ where: { id: req.params.id } });
  if (!batch) return res.status(404).json({ error: "Import not found" });
  if (await prisma.importGroup.count({ where: { batchId: batch.id, status: "processing" } })) {
    return res.status(409).json({ error: "Pause the import and wait for the sarees in progress to finish first." });
  }
  const photos = await prisma.importPhoto.findMany({ where: { batchId: batch.id }, select: { src: true, thumb: true } });
  await prisma.importBatch.delete({ where: { id: batch.id } });
  // Generated products are kept -- only the source photos are removed.
  await deleteUnusedAssets(photos.flatMap((p) => [p.src, p.thumb]), []);
  res.status(204).end();
});

// ---- correcting the grouping ---------------------------------------------

async function loadEditableGroup(id: string) {
  const group = await prisma.importGroup.findUnique({ where: { id }, include: { photos: { orderBy: { position: "asc" } }, batch: true } });
  if (!group) return { ok: false, error: "Saree not found", status: 404 } as const;
  if (!EDITABLE_GROUP.includes(group.status) || group.productId) return { ok: false, error: "This saree is already generated or in progress.", status: 409 } as const;
  return { ok: true, group } as const;
}

async function renumber(batchId: string) {
  const groups = await prisma.importGroup.findMany({ where: { batchId }, orderBy: { position: "asc" }, select: { id: true } });
  await prisma.$transaction(groups.map((g, i) => prisma.importGroup.update({ where: { id: g.id }, data: { position: i } })));
}

importRouter.post("/groups/:id/split", async (req, res) => {
  const result = await loadEditableGroup(req.params.id);
  if (!result.ok) return res.status(result.status).json({ error: result.error });
  const { group } = result;
  const at = group.photos.findIndex((p) => p.id === req.body?.photoId);
  if (at <= 0) return res.status(400).json({ error: "Choose a photo after the first one to start a new saree from." });
  await prisma.$transaction(async (tx) => {
    await tx.importGroup.updateMany({ where: { batchId: group.batchId, position: { gt: group.position } }, data: { position: { increment: 1 } } });
    const next = await tx.importGroup.create({ data: { batchId: group.batchId, position: group.position + 1 } });
    await tx.importPhoto.updateMany({ where: { id: { in: group.photos.slice(at).map((p) => p.id) } }, data: { groupId: next.id } });
  });
  res.json({ ok: true });
});

importRouter.post("/groups/:id/merge-previous", async (req, res) => {
  const result = await loadEditableGroup(req.params.id);
  if (!result.ok) return res.status(result.status).json({ error: result.error });
  const { group } = result;
  const previous = await prisma.importGroup.findFirst({ where: { batchId: group.batchId, position: { lt: group.position } }, orderBy: { position: "desc" } });
  if (!previous) return res.status(400).json({ error: "This is the first saree." });
  if (!EDITABLE_GROUP.includes(previous.status) || previous.productId) return res.status(409).json({ error: "The previous saree is already generated." });
  await prisma.importPhoto.updateMany({ where: { groupId: group.id }, data: { groupId: previous.id } });
  await prisma.importGroup.delete({ where: { id: group.id } });
  await renumber(group.batchId);
  res.json({ ok: true });
});

importRouter.post("/groups/:id/skip", async (req, res) => {
  const result = await loadEditableGroup(req.params.id);
  if (!result.ok) return res.status(result.status).json({ error: result.error });
  const skipped = Boolean(req.body?.skipped);
  await prisma.importGroup.update({ where: { id: req.params.id }, data: { status: skipped ? "skipped" : "pending", error: "" } });
  res.json({ ok: true });
});

// Retry a failed saree, or regenerate the images of a finished one.
importRouter.post("/groups/:id/retry", async (req, res) => {
  const group = await prisma.importGroup.findUnique({ where: { id: req.params.id } });
  if (!group) return res.status(404).json({ error: "Saree not found" });
  if (!["failed", "done"].includes(group.status)) return res.status(409).json({ error: "This saree isn't finished yet." });
  await prisma.importGroup.update({ where: { id: group.id }, data: { status: "queued", error: "" } });
  await prisma.importBatch.update({ where: { id: group.batchId }, data: { status: "running", error: "" } });
  kickImportWorker();
  res.json({ ok: true });
});

// Fixes a photo the AI put with the wrong saree, wherever the right saree is in the list.
importRouter.post("/photos/:id/move", async (req, res) => {
  const photo = await prisma.importPhoto.findUnique({ where: { id: req.params.id }, include: { group: true } });
  if (!photo || !photo.group) return res.status(404).json({ error: "Photo not found" });
  const target = await prisma.importGroup.findFirst({ where: { batchId: photo.batchId, position: Number(req.body?.position) - 1 } });
  if (!target) return res.status(400).json({ error: "There is no saree with that number." });
  for (const g of [photo.group, target]) {
    if (!EDITABLE_GROUP.includes(g.status) || g.productId) return res.status(409).json({ error: `Saree ${g.position + 1} is already generated or in progress.` });
  }
  if (target.id === photo.group.id) return res.json({ ok: true });
  await prisma.importPhoto.update({ where: { id: photo.id }, data: { groupId: target.id } });
  if (!(await prisma.importPhoto.count({ where: { groupId: photo.group.id } }))) {
    await prisma.importGroup.delete({ where: { id: photo.group.id } });
    await renumber(photo.batchId);
  }
  res.json({ ok: true });
});

// Ticks a photo to appear in the product gallery; updates the product too if it already exists.
importRouter.patch("/photos/:id", async (req, res) => {
  const photo = await prisma.importPhoto.findUnique({ where: { id: req.params.id }, include: { group: true } });
  if (!photo) return res.status(404).json({ error: "Photo not found" });
  const include = req.body?.include === true;
  await prisma.importPhoto.update({ where: { id: photo.id }, data: { include } });
  const productId = photo.group?.productId;
  if (productId) await (include ? addPhotoToProduct(productId, photo) : removePhotoFromProduct(productId, photo.id));
  res.json({ ok: true });
});

importRouter.delete("/photos/:id", async (req, res) => {
  const photo = await prisma.importPhoto.findUnique({ where: { id: req.params.id }, include: { group: true } });
  if (!photo) return res.status(404).json({ error: "Photo not found" });
  if (photo.group && (!EDITABLE_GROUP.includes(photo.group.status) || photo.group.productId)) {
    return res.status(409).json({ error: "This saree is already generated or in progress." });
  }
  await prisma.importPhoto.delete({ where: { id: photo.id } });
  await deleteUnusedAssets([photo.src, photo.thumb], []);
  if (photo.groupId && !(await prisma.importPhoto.count({ where: { groupId: photo.groupId } }))) {
    await prisma.importGroup.delete({ where: { id: photo.groupId } });
    await renumber(photo.batchId);
  }
  res.status(204).end();
});
