/**
 * One-time script to create the initial admin user.
 * Run with: node scripts/create-admin.mjs
 */
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const SCRYPT_PARAMS = { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };

const USERNAME = process.env.ADMIN_USERNAME?.trim();
const PASSWORD = process.env.ADMIN_PASSWORD;
const NAME = process.env.ADMIN_NAME?.trim() || null;
const EMAIL = process.env.ADMIN_EMAIL?.trim() || null;

if (!USERNAME || !PASSWORD || PASSWORD.length < 10) {
  throw new Error("Define ADMIN_USERNAME y ADMIN_PASSWORD (mínimo 10 caracteres).");
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64, SCRYPT_PARAMS).toString("hex");
  return `scrypt$${SCRYPT_PARAMS.N}$${SCRYPT_PARAMS.r}$${SCRYPT_PARAMS.p}$${salt}$${hash}`;
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
      email: EMAIL,
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
