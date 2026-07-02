import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getUserBySessionToken, GUEST_COOKIE, hashGuestToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sanitizeLink } from "@/lib/site/links";
import { toRenderSection } from "@/lib/site/section";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Guardado atomico del editor: el estado completo (sitio + secciones +
 * eliminaciones) se aplica en una sola transaccion Prisma. O se guarda todo,
 * o no se guarda nada — sin estados intermedios ni bloques duplicados.
 */

const MAX_SECTIONS = 40;

/** Tipos que el editor puede crear. hero y footer solo existen desde la generacion. */
const CREATABLE_TYPES = new Set([
  "text", "image", "video", "about_us", "cta", "testimonials", "services",
  "faq", "gallery", "pricing", "process", "benefits", "location", "contact", "trust_badges",
]);

const hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Color hex inválido.");

const sectionSchema = z.object({
  id: z.string().min(1).max(80),
  type: z.string().min(2).max(40).regex(/^[a-z_]+$/, "Tipo de bloque inválido."),
  title: z.string().max(200).default(""),
  subtitle: z.string().max(400).default(""),
  body: z.string().max(4000).default(""),
  ctaText: z.string().max(120).default(""),
  ctaLink: z.string().max(300).default("").transform(sanitizeLink),
  imagePrompt: z.string().max(500).default(""),
  mediaUrl: z.string().max(2000).default(""),
  altText: z.string().max(300).default(""),
  settings: z.record(z.unknown()).default({}),
  isVisible: z.boolean().default(true),
  order: z.number().int().min(0).max(200),
});

const savePayloadSchema = z.object({
  site: z.object({
    businessName: z.string().trim().min(1, "El nombre del negocio no puede quedar vacío.").max(120),
    phone: z.string().trim().max(40).nullable(),
    email: z.string().trim().max(160).nullable(),
    location: z.string().trim().max(160).nullable(),
    primaryColor: hex,
    secondaryColor: hex,
    accentColor: hex,
  }),
  sections: z.array(sectionSchema).min(1, "El sitio necesita al menos una sección.").max(MAX_SECTIONS, `Máximo ${MAX_SECTIONS} bloques.`),
  deletedSectionIds: z.array(z.string().min(1).max(80)).max(MAX_SECTIONS).default([]),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const user = await getUserBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const guestTokenHash = hashGuestToken(request.cookies.get(GUEST_COOKIE)?.value);
  if (!user && !guestTokenHash) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  const parsed = savePayloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || "Datos inválidos." }, { status: 400 });
  }
  const payload = parsed.data;

  for (const section of payload.sections) {
    if (JSON.stringify(section.settings).length > 20_000) {
      return NextResponse.json({ error: "Un bloque tiene demasiado contenido en sus elementos." }, { status: 400 });
    }
  }

  const site = await prisma.site.findFirst({
    where: {
      id: siteId,
      ...(user?.role === "ADMIN" ? {} : { OR: [
        ...(user ? [{ userId: user.id }] : []),
        ...(guestTokenHash ? [{ userId: null, guestTokenHash, guestExpiresAt: { gt: new Date() } }] : []),
      ] }),
    },
    select: { id: true, sections: { select: { id: true, type: true } } },
  });
  if (!site) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });

  const existingById = new Map(site.sections.map((section) => [section.id, section]));
  const deletedIds = new Set(payload.deletedSectionIds);

  // Validaciones de integridad antes de tocar la base.
  for (const id of deletedIds) {
    const existing = existingById.get(id);
    if (!existing) continue; // ya eliminada: reintentar no debe fallar ni duplicar
    if (existing.type === "hero" || existing.type === "footer") {
      return NextResponse.json({ error: "La portada y el pie de página no se pueden eliminar." }, { status: 400 });
    }
  }

  const creations = payload.sections.filter((section) => section.id.startsWith("new-"));
  const updates = payload.sections.filter((section) => !section.id.startsWith("new-"));

  for (const section of creations) {
    if (!CREATABLE_TYPES.has(section.type)) {
      return NextResponse.json({ error: `No se puede crear un bloque de tipo "${section.type}".` }, { status: 400 });
    }
  }
  for (const section of updates) {
    if (!existingById.has(section.id) || deletedIds.has(section.id)) {
      return NextResponse.json({ error: "El editor tiene datos desactualizados. Recarga la página." }, { status: 409 });
    }
  }

  const content = (section: z.infer<typeof sectionSchema>) => ({
    subtitle: section.subtitle,
    body: section.body,
    ctaText: section.ctaText,
    ctaLink: section.ctaLink,
    imagePrompt: section.imagePrompt,
    mediaUrl: section.mediaUrl,
    altText: section.altText,
  });

  try {
    const results = await prisma.$transaction([
      prisma.site.update({
        where: { id: site.id },
        data: {
          businessName: payload.site.businessName,
          phone: payload.site.phone,
          email: payload.site.email,
          location: payload.site.location,
          primaryColor: payload.site.primaryColor,
          secondaryColor: payload.site.secondaryColor,
          accentColor: payload.site.accentColor,
        },
      }),
      ...[...deletedIds].filter((id) => existingById.has(id)).map((id) =>
        prisma.siteSection.delete({ where: { id } }),
      ),
      ...updates.map((section) =>
        prisma.siteSection.update({
          where: { id: section.id },
          data: {
            title: section.title,
            order: section.order,
            isVisible: section.isVisible,
            content: content(section),
            settingsJson: section.settings as object,
            // El tipo de un bloque existente no se cambia desde el editor.
          },
        }),
      ),
      ...creations.map((section) =>
        prisma.siteSection.create({
          data: {
            siteId: site.id,
            type: section.type,
            title: section.title,
            order: section.order,
            isVisible: section.isVisible,
            content: content(section),
            settingsJson: section.settings as object,
          },
        }),
      ),
    ]);

    // Mapea los ids temporales del cliente a las filas reales creadas.
    const createdRows = results.slice(results.length - creations.length) as Array<Parameters<typeof toRenderSection>[0]>;
    const idMap: Record<string, string> = {};
    creations.forEach((section, index) => { idMap[section.id] = createdRows[index].id; });

    const sections = await prisma.siteSection.findMany({ where: { siteId: site.id }, orderBy: { order: "asc" } });
    return NextResponse.json({ ok: true, idMap, sections: sections.map(toRenderSection) });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar. Ningún cambio fue aplicado; intenta de nuevo." }, { status: 500 });
  }
}
