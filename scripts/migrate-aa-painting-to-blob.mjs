import { readFile } from "node:fs/promises";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const slug = "aa-painting-remodeling-high-point";
const localPrefix = "/sites/aa-painting-remodeling/";
const publicDir = path.join(process.cwd(), "public", "sites", "aa-painting-remodeling");

loadEnvLocal();

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error("BLOB_READ_WRITE_TOKEN no está configurado en .env.local");
}

try {
  const site = await prisma.site.findUnique({
    where: { publicSlug: slug },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  if (!site) {
    throw new Error(`No existe el sitio /s/${slug}`);
  }

  const files = await listFiles(publicDir);
  const urlMap = new Map();

  for (const file of files) {
    const filename = path.basename(file);
    const localUrl = `${localPrefix}${filename}`;
    const blobPathname = `sites/aa-painting-remodeling/${filename}`;
    const blob = await put(blobPathname, createReadStream(file), {
      access: "public",
      allowOverwrite: true,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
    });
    urlMap.set(localUrl, blob.url);
    console.log(`uploaded ${localUrl}`);
  }

  const replaceLocalUrl = (value) => {
    if (typeof value === "string") return urlMap.get(value) ?? value;
    if (Array.isArray(value)) return value.map(replaceLocalUrl);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, nested]) => [key, replaceLocalUrl(nested)]),
      );
    }
    return value;
  };

  await prisma.$transaction([
    prisma.site.update({
      where: { id: site.id },
      data: {
        logoUrl: replaceLocalUrl(site.logoUrl),
        coverUrl: replaceLocalUrl(site.coverUrl),
        contentJson: replaceLocalUrl(site.contentJson),
        designJson: replaceLocalUrl(site.designJson),
        blueprintJson: replaceLocalUrl(site.blueprintJson),
      },
    }),
    ...site.sections.map((section) =>
      prisma.siteSection.update({
        where: { id: section.id },
        data: {
          content: replaceLocalUrl(section.content),
          settingsJson: replaceLocalUrl(section.settingsJson),
        },
      }),
    ),
  ]);

  console.log(JSON.stringify({
    siteId: site.id,
    slug,
    uploaded: files.length,
    updated: true,
  }, null, 2));
} finally {
  await prisma.$disconnect();
}

async function listFiles(dir) {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(dir, entry.name))
    .filter((file) => /\.(png|jpe?g|webp|gif|mp4|webm)$/i.test(file));
}

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const raw = readFileSyncCompat(envPath);
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] ??= value;
  }
}

function readFileSyncCompat(file) {
  return readFileSync(file, "utf8");
}
