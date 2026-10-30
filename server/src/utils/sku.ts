import { prisma } from "../db.js";

const PREFIX = "KGBK-";

/** Next free product code: KGBK-0001, KGBK-0002, ... (one more than the highest in use). */
export async function nextSku(): Promise<string> {
  const rows = await prisma.product.findMany({ where: { sku: { startsWith: PREFIX } }, select: { sku: true } });
  const max = rows.reduce((m, r) => Math.max(m, parseInt(r.sku!.slice(PREFIX.length), 10) || 0), 0);
  return `${PREFIX}${String(max + 1).padStart(4, "0")}`;
}

/** Gives every product without a code one, oldest first so codes follow the order products were added. */
export async function assignMissingSkus(): Promise<number> {
  const missing = await prisma.product.findMany({ where: { OR: [{ sku: null }, { sku: "" }] }, orderBy: { createdAt: "asc" }, select: { id: true } });
  for (const { id } of missing) await prisma.product.update({ where: { id }, data: { sku: await nextSku() } });
  return missing.length;
}
