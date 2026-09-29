// Local dev runs on a SQLite file, but prisma/schema.prisma must stay
// "postgresql" because it is what Railway deploys. This writes a throwaway
// SQLite copy of the schema (gitignored), syncs the local dev.db to it and
// regenerates the Prisma client. Never edit the provider in schema.prisma.
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "prisma", "schema.prisma");
const target = join(root, "prisma", "schema.local.prisma");

const schema = readFileSync(source, "utf8");
if (!schema.includes('provider = "postgresql"')) {
  throw new Error('prisma/schema.prisma must use provider = "postgresql" -- it is the production schema.');
}
writeFileSync(target, schema.replace('provider = "postgresql"', 'provider = "sqlite"'));

execSync(`npx prisma db push --schema "${target}" --accept-data-loss`, { cwd: root, stdio: "inherit" });
