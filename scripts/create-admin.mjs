/**
 * One-time script to create the initial admin user.
 * Run with: node scripts/create-admin.mjs
 */
import { createHash, randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const USERNAME = "Maycolljaramillo";
const PASSWORD = "Zap52426;";
const NAME = "Maycoll Jaramillo";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { username: USERNAME } });
  if (existing) {
    console.log(`✓ User "${USERNAME}" already exists (id: ${existing.id}). No changes made.`);
    return;
  }

  const passwordHash = hashPassword(PASSWORD);
  const user = await prisma.user.create({
    data: {
      username: USERNAME,
      passwordHash,
      role: "ADMIN",
      name: NAME,
    },
  });

  console.log(`✓ Admin user created:`);
  console.log(`  id:       ${user.id}`);
  console.log(`  username: ${user.username}`);
  console.log(`  role:     ${user.role}`);
}

main()
  .catch((e) => { console.error("✗ Error:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
