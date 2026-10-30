import "dotenv/config";
import { prisma } from "./db.js";
import { assignMissingSkus } from "./utils/sku.js";

console.log(`Gave ${await assignMissingSkus()} products a code.`);
await prisma.$disconnect();
