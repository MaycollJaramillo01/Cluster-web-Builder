import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { PrismaClient } from "@prisma/client";

const [manifestPath, confirmation] = process.argv.slice(2);
if (!manifestPath || confirmation !== "DELETE-73-GENERATED-V1") {
  throw new Error("Uso: node scripts/delete-generated-v1.mjs <manifest.json> DELETE-73-GENERATED-V1");
}
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
if (!manifest.verified || manifest.counts?.generatedV1 !== 73) throw new Error("El manifiesto no certifica exactamente 73 proyectos GENERATED V1.");
const backupBytes = await readFile(manifest.backup);
if (createHash("sha256").update(backupBytes).digest("hex") !== manifest.sha256) throw new Error("El respaldo cambió después de verificarse.");
const restored = JSON.parse(gunzipSync(backupBytes).toString("utf8"));
if (restored.sites.filter((site) => site.builderVersion === 1 && site.status === "GENERATED").length !== 73) throw new Error("El respaldo no puede reconstruir los 73 borradores.");

const prisma = new PrismaClient();
try {
  const current = await prisma.site.count({ where: { builderVersion: 1, status: "GENERATED" } });
  if (current !== 73) throw new Error(`Se esperaban 73 borradores V1 actuales; existen ${current}. No se borró nada.`);
  const result = await prisma.site.deleteMany({ where: { builderVersion: 1, status: "GENERATED" } });
  if (result.count !== 73) throw new Error(`La eliminación no fue exacta (${result.count}).`);
  console.log(`Eliminados ${result.count} proyectos GENERATED V1. Respaldo: ${manifest.backup}`);
} finally {
  await prisma.$disconnect();
}
