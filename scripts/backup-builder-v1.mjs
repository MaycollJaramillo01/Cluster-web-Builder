import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { gzipSync, gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const outputDir = new URL("../.tmp/builder-v1-backups/", import.meta.url);
await mkdir(outputDir, { recursive: true });

try {
  const sites = await prisma.site.findMany({
    orderBy: { createdAt: "asc" },
    include: { sections: { orderBy: { order: "asc" } }, leads: true, views: true, revisions: true },
  });
  const payload = { schema: "cluster-sites-backup-v1", createdAt: new Date().toISOString(), sites };
  const json = JSON.stringify(payload);
  const gzip = gzipSync(json, { level: 9 });
  const stamp = payload.createdAt.replace(/[:.]/g, "-");
  const backupUrl = new URL(`${stamp}.json.gz`, outputDir);
  const manifestUrl = new URL(`${stamp}.manifest.json`, outputDir);
  await writeFile(backupUrl, gzip);

  const restored = JSON.parse(gunzipSync(await readFile(backupUrl)).toString("utf8"));
  const ids = new Set(restored.sites.map((site) => site.id));
  const slugs = new Set(restored.sites.map((site) => site.publicSlug));
  const counts = {
    total: restored.sites.length,
    publishedV1: restored.sites.filter((site) => site.builderVersion === 1 && site.status === "PUBLISHED").length,
    generatedV1: restored.sites.filter((site) => site.builderVersion === 1 && site.status === "GENERATED").length,
    sections: restored.sites.reduce((sum, site) => sum + site.sections.length, 0),
    leads: restored.sites.reduce((sum, site) => sum + site.leads.length, 0),
    views: restored.sites.reduce((sum, site) => sum + site.views.length, 0),
  };
  const verified = restored.schema === payload.schema && ids.size === counts.total && slugs.size === counts.total && counts.total === sites.length;
  const manifest = { backup: fileURLToPath(backupUrl), sha256: createHash("sha256").update(gzip).digest("hex"), verified, counts };
  await writeFile(manifestUrl, JSON.stringify(manifest, null, 2));
  if (!verified) throw new Error("La prueba de restauración del respaldo falló.");
  console.log(JSON.stringify({ ...manifest, manifest: fileURLToPath(manifestUrl) }, null, 2));
} finally {
  await prisma.$disconnect();
}
