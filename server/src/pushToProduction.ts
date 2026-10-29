import "dotenv/config";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { prisma } from "./db.js";
import { readAsDataUrl } from "./utils/imageStore.js";

// Copies the published products on THIS computer to the live site (images included) through the live admin API.
// Safe to re-run: products already copied are remembered in .push-state.json and skipped.
// Needs PROD_API_URL, PROD_ADMIN_USERNAME, PROD_ADMIN_PASSWORD in server/.env. Add --dry to only count.
const { PROD_API_URL, PROD_ADMIN_USERNAME, PROD_ADMIN_PASSWORD } = process.env;
if (!PROD_API_URL || !PROD_ADMIN_USERNAME || !PROD_ADMIN_PASSWORD) {
  console.error("Set PROD_API_URL (e.g. https://your-app.up.railway.app/api), PROD_ADMIN_USERNAME and PROD_ADMIN_PASSWORD in server/.env first.");
  process.exit(1);
}
const api = PROD_API_URL.replace(/\/$/, "");
const STATE = ".push-state.json";
const done: Record<string, string> = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {};

const login = await fetch(`${api}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: PROD_ADMIN_USERNAME, password: PROD_ADMIN_PASSWORD }),
});
if (!login.ok) {
  console.error(`Could not log in to ${api} (status ${login.status}). Check the URL and the admin username/password.`);
  process.exit(1);
}
const { token } = (await login.json()) as { token: string };

const products = await prisma.product.findMany({ where: { status: "published" }, include: { images: { orderBy: { position: "asc" } } }, orderBy: { createdAt: "asc" } });
// Sample products that still use stock photos from the web (not your own images) are not copied.
const own = (src: string) => src.includes("/api/images/") || src.includes("res.cloudinary.com");
const mine = products.filter((p) => p.images.every((i) => own(i.src)));
const todo = mine.filter((p) => !done[p.id]);
console.log(`${products.length} published products here: ${products.length - mine.length} sample products skipped, ${mine.length - todo.length} already on the live site, ${todo.length} to copy.`);
if (process.argv.includes("--dry")) process.exit(0);

let copied = 0;
const failed: string[] = [];
const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.slice(8)) || todo.length;
const queue = todo.slice(0, limit);
await Promise.all(
  Array.from({ length: 3 }, async () => {
    for (let p = queue.shift(); p; p = queue.shift()) {
      try {
        const images = await Promise.all(p.images.map(async (i) => ({ src: await readAsDataUrl(i.src), alt: i.alt, label: i.label })));
        const res = await fetch(`${api}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: p.name, sku: p.sku, category: p.category, subcategory: p.subcategory, description: p.description,
            shortDescription: p.shortDescription, price: p.price, priceUnit: p.priceUnit, material: p.material, color: p.color,
            pattern: p.pattern, occasion: p.occasion, availability: p.availability, featured: p.featured, status: "published",
            seoTitle: p.seoTitle, seoDescription: p.seoDescription, images,
          }),
        });
        if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 160)}`);
        done[p.id] = ((await res.json()) as { id: string }).id;
        writeFileSync(STATE, JSON.stringify(done, null, 1));
        console.log(`[${++copied}/${todo.length}] ${p.name}`);
      } catch (err) {
        failed.push(p.name);
        console.error(`FAILED ${p.name}: ${err instanceof Error ? err.message : err}`);
      }
    }
  })
);
console.log(`\nCopied ${copied}. Failed ${failed.length}.${failed.length ? " Run the command again to retry those." : ""}`);
await prisma.$disconnect();
