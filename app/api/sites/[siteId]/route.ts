import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { assertSiteAccess, siteAccessErrorResponse, siteAccessWhere } from "@/lib/site/access";
import { deleteSiteMedia, isSiteMediaUrl, materializeDataUrlsForSite } from "@/lib/site/media";
import { getSiteLaunchReadiness } from "@/lib/site/launch-readiness";
import { toRenderSection } from "@/lib/site/section";
import {
  normalizeCanvasSectionsV2,
  normalizeSiteContentV2,
  normalizeThemeV2,
} from "@/lib/site/v2-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hex = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Color hex inválido.");

const updateSiteSchema = z.object({
  businessName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().max(160).nullable().optional(),
  location: z.string().trim().max(160).nullable().optional(),
  domain: z.string().trim().max(160).nullable().optional(),
  primaryColor: hex.optional(),
  secondaryColor: hex.optional(),
  accentColor: hex.optional(),
});

const v2SaveSchema = z.object({
  builderVersion: z.literal(2),
  site: updateSiteSchema,
  content: z.unknown(),
  design: z.unknown(),
  sections: z.array(z.unknown()).min(3).max(40),
  expectedUpdatedAt: z.string().datetime().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  try {
    const { site } = await assertSiteAccess({
      siteId,
      request: req,
      include: { sections: { orderBy: { order: "asc" } } },
    });

    const sections = site.sections ?? [];

    return NextResponse.json({
      site: {
        id: site.id,
        businessName: site.businessName,
        businessType: site.businessType,
        phone: site.phone,
        email: site.email,
        location: site.location,
        domain: site.domain,
        language: site.language,
        status: site.status,
        primaryColor: site.primaryColor,
        secondaryColor: site.secondaryColor,
        accentColor: site.accentColor,
        builderVersion: site.builderVersion,
        content: site.contentJson,
        design: site.designJson,
        replacesSiteId: site.replacesSiteId,
        updatedAt: site.updatedAt instanceof Date
          ? site.updatedAt.toISOString()
          : String(site.updatedAt ?? ""),
      },
      sections: site.builderVersion === 2
        ? sections.map((section) => section.content)
        : sections.map(toRenderSection),
      launchReadiness: getSiteLaunchReadiness({
        builderVersion: site.builderVersion,
        status: site.status,
        contentJson: site.contentJson,
        phone: site.phone,
        email: site.email,
        logoUrl: typeof site.logoUrl === "string" ? site.logoUrl : null,
        coverUrl: typeof site.coverUrl === "string" ? site.coverUrl : null,
        sections,
      }),
    });
  } catch (error) {
    return siteAccessErrorResponse(error) ?? NextResponse.json({ error: "Sitio no encontrado." }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  try {
    const { actor } = await assertSiteAccess({ siteId, request: req, requireUser: true });

    let data;
    try {
      data = updateSiteSchema.parse(await req.json());
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: err.errors[0]?.message ?? "Datos inválidos." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
    }

    const updated = await prisma.site.updateMany({
      where: siteAccessWhere(siteId, actor, { allowGuest: false }),
      data,
    });
    if (updated.count === 0) throw new Error("not-found");
    return NextResponse.json({ ok: true, site: { id: siteId } });
  } catch (error) {
    const access = siteAccessErrorResponse(error);
    if (access) return access;
    return NextResponse.json(
      { error: "No se pudo actualizar el sitio (¿existe?)." },
      { status: 404 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  try {
    const { site: owned, actor } = await assertSiteAccess({
      siteId,
      request: req,
      requireUser: true,
      select: { id: true, builderVersion: true, updatedAt: true },
    });
    const body = await req.json().catch(() => null);

    if (body?.builderVersion === 2) {
      const parsedV2 = v2SaveSchema.safeParse(body);
      if (!parsedV2.success) {
        return NextResponse.json({ error: parsedV2.error.errors[0]?.message ?? "Documento V2 inválido." }, { status: 400 });
      }

      if (owned.builderVersion !== 2) {
        return NextResponse.json({ error: "El editor Legacy fue eliminado.", code: "LEGACY_EDITOR_REMOVED" }, { status: 410 });
      }

      const normalizedContent = normalizeSiteContentV2(parsedV2.data.content);
      const design = normalizeThemeV2(parsedV2.data.design);
      const normalizedSections = normalizeCanvasSectionsV2(parsedV2.data.sections);
      const content = await materializeDataUrlsForSite(siteId, normalizedContent, "content");
      const sections = await materializeDataUrlsForSite(siteId, normalizedSections, "section");
      if (sections.length !== parsedV2.data.sections.length) {
        return NextResponse.json({ error: "El documento contiene bloques o estilos no permitidos." }, { status: 400 });
      }
      const regions = sections.map((section) => section.region);
      if (regions.filter((region) => region === "header").length !== 1 || regions.filter((region) => region === "footer").length !== 1 || !regions.includes("main")) {
        return NextResponse.json({ error: "El sitio necesita un header, contenido principal y un footer." }, { status: 400 });
      }

      const before = await prisma.siteSection.findMany({ where: { siteId }, select: { content: true } });
      const oldMedia = collectMediaUrls(before.map((section) => section.content), siteId);

      try {
        await prisma.$transaction(async (tx) => {
          const where = {
            ...siteAccessWhere(siteId, actor, { allowGuest: false }),
            ...(parsedV2.data.expectedUpdatedAt
              ? { updatedAt: new Date(parsedV2.data.expectedUpdatedAt) }
              : {}),
          };
          const gated = await tx.site.updateMany({
            where,
            data: {
              ...parsedV2.data.site,
              contentJson: content as object,
              designJson: design as object,
              primaryColor: design.primary,
              secondaryColor: design.secondary,
              accentColor: design.accent,
              logoUrl: content.business.logo || null,
              coverUrl: content.hero.media || content.about.media || content.media[0]?.url || null,
            },
          });
          if (!gated.count) {
            const error = new Error("STALE_WRITE");
            (error as Error & { code?: string }).code = "STALE_WRITE";
            throw error;
          }
          await tx.siteSection.deleteMany({ where: { siteId } });
          await tx.siteSection.createMany({
            data: sections.map((section, order) => ({
              id: section.id,
              siteId,
              type: "canvas",
              title: section.key,
              order,
              isVisible: true,
              content: section as object,
              settingsJson: {},
            })),
          });
        });
      } catch (error) {
        if (error instanceof Error && (error as Error & { code?: string }).code === "STALE_WRITE") {
          return NextResponse.json(
            { error: "El sitio cambió en otra pestaña. Recarga antes de guardar.", code: "STALE_WRITE" },
            { status: 409 },
          );
        }
        throw error;
      }

      const newMedia = collectMediaUrls([content, sections], siteId);
      const staleMedia = [...oldMedia].filter((url) => !newMedia.has(url));
      if (staleMedia.length) {
        const { del } = await import("@vercel/blob");
        await del(staleMedia).catch(() => null);
      }
      const fresh = await prisma.site.findUnique({ where: { id: siteId }, select: { updatedAt: true } });
      return NextResponse.json({
        ok: true,
        builderVersion: 2,
        content,
        design,
        sections,
        updatedAt: fresh?.updatedAt.toISOString() ?? new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: "El editor Legacy fue eliminado.", code: "LEGACY_EDITOR_REMOVED" },
      { status: 410 },
    );
  } catch (error) {
    return siteAccessErrorResponse(error) ?? NextResponse.json({ error: "No se pudo guardar." }, { status: 500 });
  }
}

function collectMediaUrls(values: unknown[], siteId: string) {
  const urls = new Set<string>();
  const visit = (value: unknown) => {
    if (typeof value === "string") {
      if (isSiteMediaUrl(siteId, value)) urls.add(value);
      return;
    }
    if (Array.isArray(value)) return value.forEach(visit);
    if (value && typeof value === "object") Object.values(value as Record<string, unknown>).forEach(visit);
  };
  values.forEach(visit);
  return urls;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  try {
    const { actor } = await assertSiteAccess({ siteId, request: req, requireUser: true });
    const deleted = await prisma.site.deleteMany({
      where: siteAccessWhere(siteId, actor, { allowGuest: false }),
    });
    if (!deleted.count) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
    const removedMedia = await deleteSiteMedia(siteId).catch(() => 0);
    return NextResponse.json({ ok: true, removedMedia });
  } catch (error) {
    return siteAccessErrorResponse(error) ?? NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
  }
}
