import "dotenv/config";
import { prisma } from "./db.js";
import { makeZoom } from "./services/aiCatalogue.js";
import { assetIdOf, persistImage, readAsDataUrl } from "./utils/imageStore.js";

// Re-cuts every product's Zoom picture from its Catalogue picture using the current crop box. Free: no AI calls.
const zooms = await prisma.productImage.findMany({ where: { label: "Zoom" } });
let done = 0;
for (const zoom of zooms) {
  const catalogue = await prisma.productImage.findFirst({ where: { productId: zoom.productId, label: "Catalogue" } });
  if (!catalogue || !assetIdOf(catalogue.src)) continue;
  const src = await persistImage(await makeZoom(await readAsDataUrl(catalogue.src)));
  await prisma.productImage.update({ where: { id: zoom.id }, data: { src } });
  const oldId = assetIdOf(zoom.src);
  if (oldId) await prisma.imageAsset.deleteMany({ where: { id: oldId } });
  done++;
}
console.log(`Re-cropped ${done} of ${zooms.length} zoom pictures.`);
await prisma.$disconnect();
