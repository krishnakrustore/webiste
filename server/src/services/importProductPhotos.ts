import { prisma } from "../db.js";
import { deleteUnusedAssets, persistImage, readAsDataUrl } from "../utils/imageStore.js";

type SourcePhoto = { id: string; position: number; src: string };

/** Gallery order: generated photo, then the photos the admin ticked (in shooting order), then anything else, then the zoom. */
export async function orderProductImages(productId: string) {
  const images = await prisma.productImage.findMany({ where: { productId }, orderBy: { position: "asc" } });
  const sources = await prisma.importPhoto.findMany({
    where: { id: { in: images.map((i) => i.importPhotoId).filter((id): id is string => Boolean(id)) } },
    select: { id: true, position: true },
  });
  const shot = new Map(sources.map((p) => [p.id, p.position]));
  const rank = (i: { label: string; importPhotoId: string | null }) => (i.label === "Catalogue" ? 0 : i.label === "Zoom" ? 3 : i.importPhotoId ? 1 : 2);
  const key = (i: { position: number; importPhotoId: string | null }) => (i.importPhotoId ? shot.get(i.importPhotoId) ?? 0 : i.position);
  const sorted = [...images].sort((a, b) => rank(a) - rank(b) || key(a) - key(b));
  await prisma.$transaction(sorted.map((img, position) => prisma.productImage.update({ where: { id: img.id }, data: { position } })));
}

/** Copies a source photo into the product (a separate stored copy, so deleting the import keeps it). */
export async function copyPhotoToProduct(productId: string, photo: SourcePhoto, alt: string) {
  return { src: await persistImage(await readAsDataUrl(photo.src)), alt, label: "", position: 1 + photo.position, importPhotoId: photo.id };
}

export async function addPhotoToProduct(productId: string, photo: SourcePhoto) {
  if (await prisma.productImage.findFirst({ where: { productId, importPhotoId: photo.id } })) return;
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } });
  const data = await copyPhotoToProduct(productId, photo, `${product?.name ?? "Saree"} -- photo`);
  await prisma.productImage.create({ data: { ...data, productId } });
  await orderProductImages(productId);
}

export async function removePhotoFromProduct(productId: string, photoId: string) {
  const images = await prisma.productImage.findMany({ where: { productId, importPhotoId: photoId } });
  if (!images.length) return;
  await prisma.productImage.deleteMany({ where: { id: { in: images.map((i) => i.id) } } });
  await deleteUnusedAssets(images.map((i) => i.src), []);
  await orderProductImages(productId);
}
