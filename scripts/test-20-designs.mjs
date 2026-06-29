/**
 * test-20-designs.mjs
 * Genera 10 sitios en modo guiado + 10 en modo avanzado con la misma empresa.
 * Verifica que los diseños sean únicos y que cada sitio tenga secciones válidas.
 *
 * Requiere servidor en ejecución: npm run dev -- -p 3010
 * Uso: node scripts/test-20-designs.mjs
 */

import { createHash, randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = process.env.BASE_URL || "http://localhost:3010";

// --keep  → publica los sitios, guarda preview URLs, no limpia al final
// --cleanup → lee el JSON anterior y elimina los sitios guardados
const KEEP_SITES = process.argv.includes("--keep");
const DO_CLEANUP = process.argv.includes("--cleanup");
const suffix = `${Date.now()}-${randomBytes(3).toString("hex")}`;
const username = `qa-designs-${suffix}`;
const tokenRaw = randomBytes(24).toString("base64url");
const tokenHash = hash(tokenRaw);

// ── Empresa de prueba (misma para las 20 generaciones) ──────────────────────
const GUIDED_PAYLOAD = {
  businessName: "Jardinería Torres",
  businessType: "landscaping",
  location: "Managua, Nicaragua",
  services:
    "Diseño de jardines: creamos espacios verdes únicos\nPoda y mantenimiento: servicio mensual\nCésped artificial: instalación rápida\nRiego automático: sistemas inteligentes",
  targetCustomer: "Hogares y empresas que buscan jardines bien cuidados sin esfuerzo",
  proofPoints: "10 años de experiencia · 300+ proyectos · Equipo certificado",
  goal: "quote_forms",
  phone: "+505 8888 1234",
  email: "info@jardineriatorres.com",
  domain: "",
  language: "es",
  visualStyle: "modern_clean",
};

const ADVANCED_PROMPT =
  "Jardinería Torres, empresa de paisajismo en Managua, Nicaragua. " +
  "Ofrecemos diseño de jardines, poda y mantenimiento mensual, instalación de césped artificial " +
  "y sistemas de riego automático inteligentes. Atendemos hogares y empresas. " +
  "Más de 10 años en el mercado con 300 proyectos exitosos. " +
  "Contacto: +505 8888 1234 · info@jardineriatorres.com. " +
  "Queremos un sitio que genere solicitudes de cotización.";

// ── Secciones que debe tener todo sitio válido ───────────────────────────────
const REQUIRED_SECTIONS = ["hero", "cta", "footer"];

// ── Colores de consola ────────────────────────────────────────────────────────
const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

// ── Utilidades ────────────────────────────────────────────────────────────────
function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function pad(str, width) {
  return String(str).padEnd(width);
}

/** Lee un ReadableStream de SSE y devuelve { siteId, ok, error, style }. */
async function parseSSE(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const result = { siteId: null, ok: null, error: null };

  outer: while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      if (!block.trim()) continue;
      const lines = block.split("\n");
      let eventType = null;
      let data = null;
      for (const line of lines) {
        if (line.startsWith("event: ")) eventType = line.slice(7).trim();
        else if (line.startsWith("data: ")) {
          try { data = JSON.parse(line.slice(6)); } catch { /* ignore */ }
        }
      }
      if (eventType === "saved" && data?.siteId) result.siteId = data.siteId;
      if (eventType === "done") { result.ok = data?.ok; break outer; }
      if (eventType === "error") result.error = data?.message;
    }
  }

  return result;
}

/** Ejecuta una generación y devuelve el resultado con diagnóstico. */
async function runGeneration(index, mode, cookie) {
  const label = `#${String(index).padStart(2, "0")} [${mode}]`;
  const body =
    mode === "guided"
      ? JSON.stringify(GUIDED_PAYLOAD)
      : JSON.stringify({ prompt: ADVANCED_PROMPT });

  const start = Date.now();
  let response;
  try {
    response = await fetch(`${BASE_URL}/api/ai/generate-site`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body,
    });
  } catch (err) {
    return { index, mode, ok: false, error: `fetch falló: ${err.message}`, siteId: null, elapsed: Date.now() - start };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return { index, mode, ok: false, error: `HTTP ${response.status}: ${text.slice(0, 120)}`, siteId: null, elapsed: Date.now() - start };
  }

  const { siteId, ok, error } = await parseSSE(response);
  const elapsed = Date.now() - start;
  return { index, mode, ok: ok !== false, error: error ?? null, siteId, elapsed };
}

/** Publica un sitio y devuelve la URL de preview, o null si falla. */
async function publishSite(siteId, cookie) {
  try {
    const res = await fetch(`${BASE_URL}/api/sites/${siteId}/publish`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    if (res.ok) return `${BASE_URL}/preview/${siteId}`;
  } catch { /* ignore */ }
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
let user;
const allSiteIds = [];

try {
  // ── Modo cleanup: elimina los sitios del último run con --keep ────────────
  if (DO_CLEANUP) {
    const jsonPath = join(new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"), "last-test-results.json");
    let keepData;
    try { keepData = JSON.parse(readFileSync(jsonPath, "utf-8")); } catch { keepData = null; }
    const keepIds = keepData?.results?.map((r) => r.siteId).filter(Boolean) ?? [];
    const keepUserId = keepData?.keepUserId ?? null;
    if (keepIds.length > 0) {
      await prisma.site.deleteMany({ where: { id: { in: keepIds } } });
      console.log(c.green(`✓ Eliminados ${keepIds.length} sitios de prueba`));
    }
    if (keepUserId) {
      await prisma.user.deleteMany({ where: { id: keepUserId } });
      console.log(c.green(`✓ Usuario de prueba eliminado`));
    }
    if (!keepIds.length && !keepUserId) {
      console.log(c.yellow("No hay sitios guardados para limpiar. Corre primero con --keep."));
    }
    await prisma.$disconnect();
    process.exit(0);
  }

  // Servidor disponible?
  try {
    const ping = await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(5000) });
    if (!ping.ok && ping.status !== 404) throw new Error(`status ${ping.status}`);
  } catch (err) {
    console.error(c.red(`\n✗ No se puede conectar al servidor en ${BASE_URL}`));
    console.error(c.yellow("  Arranca el servidor primero:  npm run dev -- -p 3010"));
    process.exit(1);
  }

  // Crear usuario de prueba con plan ACTIVE (límite 100 gen/hora)
  user = await prisma.user.create({
    data: { username, passwordHash: "qa:not-used", planStatus: "ACTIVE" },
  });
  await prisma.session.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60_000) },
  });
  const cookie = `__cluster_session=${tokenRaw}`;

  console.log(c.bold(`\n🌿 test-20-designs — Jardinería Torres`));
  console.log(c.dim(`   Servidor : ${BASE_URL}`));
  console.log(c.dim(`   Usuario  : ${username} (ACTIVE)\n`));

  const results = [];

  if (KEEP_SITES) console.log(c.yellow("  Modo --keep: los sitios serán publicados y no se eliminarán\n"));

  // ── 10 pruebas GUIADO ──────────────────────────────────────────────────────
  console.log(c.bold("── Modo GUIADO (10 pruebas) ──────────────────────────────────────"));
  for (let i = 1; i <= 10; i++) {
    process.stdout.write(`  Prueba ${String(i).padStart(2, "0")}/10 guiado... `);
    const result = await runGeneration(i, "guided", cookie);
    if (result.ok && result.siteId) {
      allSiteIds.push(result.siteId);
      if (KEEP_SITES) result.previewUrl = await publishSite(result.siteId, cookie);
      process.stdout.write(c.green(`OK`) + c.dim(` (${(result.elapsed / 1000).toFixed(1)}s)\n`));
    } else {
      process.stdout.write(c.red(`FAIL`) + c.dim(` — ${result.error ?? "sin siteId"}\n`));
    }
    results.push(result);
  }

  // ── 10 pruebas AVANZADO ────────────────────────────────────────────────────
  console.log(c.bold("\n── Modo AVANZADO (10 pruebas) ───────────────────────────────────"));
  for (let i = 11; i <= 20; i++) {
    process.stdout.write(`  Prueba ${String(i).padStart(2, "0")}/20 avanzado... `);
    const result = await runGeneration(i, "advanced", cookie);
    if (result.ok && result.siteId) {
      allSiteIds.push(result.siteId);
      if (KEEP_SITES) result.previewUrl = await publishSite(result.siteId, cookie);
      process.stdout.write(c.green(`OK`) + c.dim(` (${(result.elapsed / 1000).toFixed(1)}s)\n`));
    } else {
      process.stdout.write(c.red(`FAIL`) + c.dim(` — ${result.error ?? "sin siteId"}\n`));
    }
    results.push(result);
  }

  // ── Recuperar diseños de DB ────────────────────────────────────────────────
  const sites = await prisma.site.findMany({
    where: { id: { in: allSiteIds } },
    select: {
      id: true,
      visualStyle: true,
      businessName: true,
      primaryColor: true,
      sections: { select: { type: true, isVisible: true, content: true } },
    },
  });

  const siteMap = new Map(sites.map((s) => [s.id, s]));

  // ── Tabla de resultados ────────────────────────────────────────────────────
  console.log(c.bold("\n── Resultados detallados ─────────────────────────────────────────"));
  console.log(
    c.dim(
      `  ${"#".padEnd(4)} ${"MODO".padEnd(9)} ${"ESTILO".padEnd(26)} ${"SECCIONES".padEnd(12)} ${"VALID?"}`
    )
  );

  const stylesSeen = new Set();
  const duplicateStyles = [];
  let totalValid = 0;

  for (const r of results) {
    if (!r.ok || !r.siteId) {
      console.log(`  ${pad(r.index, 4)} ${pad(r.mode, 9)} ${c.red("FAIL")}  — ${r.error ?? "sin respuesta"}`);
      continue;
    }

    const site = siteMap.get(r.siteId);
    if (!site) {
      console.log(`  ${pad(r.index, 4)} ${pad(r.mode, 9)} ${c.red("no encontrado en DB")}`);
      continue;
    }

    const style = site.visualStyle ?? "desconocido";
    const sectionTypes = site.sections.map((s) => s.type);
    const missingRequired = REQUIRED_SECTIONS.filter((req) => !sectionTypes.includes(req));
    const isValid = missingRequired.length === 0;
    const isDuplicate = stylesSeen.has(style);

    if (isDuplicate) duplicateStyles.push(style);
    stylesSeen.add(style);
    if (isValid) totalValid++;

    const styleLabel = isDuplicate ? c.red(`${style} ⚠ DUP`) : c.green(style);
    const sectionsLabel = isValid ? c.green(`${sectionTypes.length} secs`) : c.red(`falta: ${missingRequired.join(",")}`);
    const validLabel = isValid ? c.green("✓") : c.red("✗");

    console.log(`  ${pad(r.index, 4)} ${pad(r.mode, 9)} ${pad(style, 26)} ${pad(sectionTypes.length + " secs", 12)} ${validLabel}`);
    if (!isValid) {
      console.log(c.red(`         Secciones faltantes: ${missingRequired.join(", ")}`));
    }
  }

  // ── Resumen ────────────────────────────────────────────────────────────────
  const successCount = results.filter((r) => r.ok && r.siteId).length;
  const uniqueStyles = stylesSeen.size;

  console.log(c.bold("\n── Resumen ───────────────────────────────────────────────────────"));
  console.log(`  Generaciones exitosas : ${successCount}/20`);
  console.log(`  Diseños válidos (hero+cta+footer) : ${totalValid}/${successCount}`);
  console.log(`  Estilos únicos        : ${uniqueStyles}/${successCount}`);

  if (duplicateStyles.length > 0) {
    console.log(c.red(`\n  ⚠ Estilos duplicados (${duplicateStyles.length}): ${duplicateStyles.join(", ")}`));
  } else {
    console.log(c.green(`\n  ✓ Sin duplicados — todos los diseños son únicos`));
  }

  // Mostrar la lista de estilos usados
  console.log(c.bold("\n── Estilos seleccionados ─────────────────────────────────────────"));
  const styleList = [...stylesSeen];
  for (let i = 0; i < styleList.length; i++) {
    const modeLabel = i < 10 ? "guiado  " : "avanzado";
    console.log(`  ${String(i + 1).padStart(2, "0")}. [${modeLabel}] ${styleList[i]}`);
  }

  // ── Guardar resultados para la página /test-results ──────────────────────
  const untestedStyles = [];
  // Collect all 26 style IDs dynamically from the results + known set
  const allStyles = [
    "Neobrutalist","Swiss/International","Editorial","Glassmorphism","Retro-futuristic",
    "Bauhaus","Art Deco","Minimal","Flat","Material","Neumorphic","Monochromatic",
    "Scandinavian","Japandi","Dark Mode First","Modernist","Organic/Fluid",
    "Corporate Professional","Tech Forward","Luxury Minimal","Neo-Geo","Kinetic",
    "Gradient Modern","Typography First","Metropolitan","Artisan",
  ];
  const MOOD_MAP = {
    "Neobrutalist": "directa, audaz y deliberadamente cruda",
    "Swiss/International": "serena, racional y confiable",
    "Editorial": "sofisticada, curiosa y cultural",
    "Glassmorphism": "etérea, tecnológica y envolvente",
    "Retro-futuristic": "optimista, nostálgica y visionaria",
    "Bauhaus": "clara, enérgica y universal",
    "Art Deco": "lujosa, teatral y refinada",
    "Minimal": "calmada, esencial y segura",
    "Flat": "amable, clara y accesible",
    "Material": "familiar, ordenada y táctil",
    "Neumorphic": "suave, íntima y táctil",
    "Monochromatic": "cohesiva, segura y contemplativa",
    "Scandinavian": "cálida, honesta y luminosa",
    "Japandi": "serena, artesanal y equilibrada",
    "Dark Mode First": "inmersiva, premium y concentrada",
    "Modernist": "atemporal, confiada y funcional",
    "Organic/Fluid": "vital, cercana y natural",
    "Corporate Professional": "estable, competente y confiable",
    "Tech Forward": "innovadora, precisa y optimista",
    "Luxury Minimal": "exclusiva, silenciosa y segura de sí",
    "Neo-Geo": "intelectual, rítmica y contemporánea",
    "Kinetic": "enérgica, progresiva y viva",
    "Gradient Modern": "luminosa, optimista y envolvente",
    "Typography First": "expresiva, inteligente y memorable",
    "Metropolitan": "cosmopolita, culta y segura",
    "Artisan": "auténtica, arraigada y evocadora",
  };
  for (const s of allStyles) {
    if (!stylesSeen.has(s)) untestedStyles.push({ style: s, mood: MOOD_MAP[s] ?? "" });
  }
  const richResults = results.map((r) => {
    if (!r.ok || !r.siteId) return null;
    const site = siteMap.get(r.siteId);
    if (!site) return null;
    const style = site.visualStyle ?? "desconocido";
    return {
      index: r.index,
      mode: r.mode,
      style,
      mood: MOOD_MAP[style] ?? "",
      sections: site.sections.length,
      valid: REQUIRED_SECTIONS.every((req) => site.sections.some((s) => s.type === req)),
      elapsed: r.elapsed,
      engine: r.elapsed < 2000 ? "fallback" : "ai",
      siteId: r.siteId,
      previewUrl: r.previewUrl ?? null,
    };
  }).filter(Boolean);

  const jsonOutput = {
    runAt: new Date().toISOString(),
    company: GUIDED_PAYLOAD.businessName,
    command: "npm run test:20-designs",
    baseUrl: BASE_URL,
    keepMode: KEEP_SITES,
    keepUserId: KEEP_SITES ? (user?.id ?? null) : null,
    summary: {
      total: 20,
      passed: successCount,
      failed: 20 - successCount,
      uniqueStyles,
      validSites: totalValid,
      aiGenerations: richResults.filter((r) => r.engine === "ai").length,
      fallbackGenerations: richResults.filter((r) => r.engine === "fallback").length,
    },
    results: richResults,
    untestedStyles,
  };
  const outPath = join(new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"), "last-test-results.json");
  writeFileSync(outPath, JSON.stringify(jsonOutput, null, 2), "utf-8");
  console.log(c.dim(`\n  Resultados guardados → ${outPath}`));

  const allPassed = successCount === 20 && totalValid === successCount && duplicateStyles.length === 0;
  console.log(
    allPassed
      ? c.green(c.bold("\n✓ test-20-designs: PASÓ — 20/20 generaciones únicas y válidas"))
      : c.red(c.bold(`\n✗ test-20-designs: FALLÓ — revisa los items marcados arriba`))
  );
  process.exitCode = allPassed ? 0 : 1;

} finally {
  if (KEEP_SITES) {
    console.log(c.yellow("\n  Sitios conservados. Para eliminarlos más tarde:"));
    console.log(c.dim("  node scripts/test-20-designs.mjs --cleanup\n"));
  } else if (!DO_CLEANUP) {
    // Limpieza normal — eliminar sitios y usuario de prueba
    if (allSiteIds.length > 0) {
      await prisma.site.deleteMany({ where: { id: { in: allSiteIds } } });
    }
    if (user) {
      await prisma.user.delete({ where: { id: user.id } });
    }
  }
  await prisma.$disconnect();
}
