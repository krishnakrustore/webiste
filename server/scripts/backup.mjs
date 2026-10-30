// Copies the local database (all products, images, imports) to ../backups/ with today's date. Run: npm run backup
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "prisma", "dev.db");
if (!existsSync(source)) {
  console.error("No local database found at prisma/dev.db");
  process.exit(1);
}
const dir = path.join(root, "..", "backups");
mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
const target = path.join(dir, `dev-${stamp}.db`);
copyFileSync(source, target);
console.log(`Backup saved: ${target}`);
