import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { assertSiteAccess, siteAccessErrorResponse, siteAccessWhere } from "@/lib/site/access";
import { deleteSiteMedia, getSiteMedia, isSiteMediaUrl, materializeDataUrlsForSite } from "@/lib/site/media";
import { getSiteLaunchReadiness } from "@/lib/site/launch-readiness";
import { normalizeSectionSettings } from "@/lib/site/section-layout";
import { sanitizeLink } from "@/lib/site/links";
import { toRenderSection } from "@/lib/site/section";
import {
  normalizeCanvasSectionsV2,
  normalizeSiteContentV2,
  normalizeThemeV2,
  V2_TEMPLATE_IDS,
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

const saveSectionSchema = z.object({
  id: z.string().min(1).max(120),
  type: z.string().min(1).max(50),
  title: z.string().max(200).default(""),
  subtitle: z.string().max(400).default(""),
  body: z.string().max(4000).default(""),
  ctaText: z.string().max(120).default(""),
  ctaLink: z.string().max(2000).default("").transform(sanitizeLink),
  imagePrompt: z.string().max(500).default(""),
  mediaUrl: z.string().max(2000).default(""),
  altText: z.string().max(300).default(""),
  settings: z.record(z.unknown()).default({}),
  isVisible: z.boolean().default(true),
  order: z.number().int().min(0).max(100),
});

const atomicSaveSchema = z.object({
  site: updateSiteSchema,
  sections: z.array(saveSectionSchema).max(40),
  deletedSectionIds: z.array(z.string().min(1).max(120)).max(40).default([]),
  expectedUpdatedAt: z.string().datetime().optional(),
});

const v2SaveSchema = z.object({
  builderVersion: z.literal(2),
  site: updateSiteSchema,
  templateId: z.enum(V2_TEMPLATE_IDS).optional(),
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
        templateId: site.templateId,
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
      select: { id: true, builderVersion: true, templateId: true, status: true, updatedAt: true },
    });
    const body = await req.json().catch(() => null);

    if (body?.builderVersion === 2) {
      const parsedV2 = v2SaveSchema.safeParse(body);
      if (!parsedV2.success) {
        return NextResponse.json({ error: parsedV2.error.errors[0]?.message ?? "Documento V2 inválido." }, { status: 400 });
      }

      if (owned.builderVersion !== 2) {
        return NextResponse.json({ error: "Este proyecto V1 debe migrarse antes de editarlo.", code: "LEGACY_READ_ONLY" }, { status: 409 });
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
              templateId: parsedV2.data.templateId ?? owned.templateId,
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
      const fresh = await prisma.site.findUnique({ where: { id: siteId }, select: { updatedAt: true, templateId: true } });
      return NextResponse.json({
        ok: true,
        builderVersion: 2,
        templateId: parsedV2.data.templateId ?? owned.templateId,
        content,
        design,
        sections,
        updatedAt: fresh?.updatedAt.toISOString() ?? new Date().toISOString(),
      });
    }

    const parsed = atomicSaveSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos inválidos." }, { status: 400 });

    if (owned.builderVersion === 1 && owned.status === "PUBLISHED") {
      return NextResponse.json({
        error: "Los sitios V1 publicados son de solo lectura. Crea una copia V2 para editarlos.",
        code: "LEGACY_READ_ONLY",
      }, { status: 409 });
    }

    const deleted = parsed.data.deletedSectionIds.length
      ? await prisma.siteSection.findMany({
          where: { siteId, id: { in: parsed.data.deletedSectionIds } },
          select: { content: true },
        })
      : [];
    const deletedMedia = deleted
      .map((section) => (section.content as Record<string, unknown> | null)?.mediaUrl)
      .filter((value): value is string => isSiteMediaUrl(siteId, value));

    try {
      await prisma.$transaction(async (tx) => {
        const where = {
          ...siteAccessWhere(siteId, actor, { allowGuest: false }),
          ...(parsed.data.expectedUpdatedAt
            ? { updatedAt: new Date(parsed.data.expectedUpdatedAt) }
            : {}),
        };
        const gated = await tx.site.updateMany({
          where,
          data: parsed.data.site,
        });
        if (!gated.count) {
          const error = new Error("STALE_WRITE");
          (error as Error & { code?: string }).code = "STALE_WRITE";
          throw error;
        }
        if (parsed.data.deletedSectionIds.length) {
          await tx.siteSection.deleteMany({ where: { siteId, id: { in: parsed.data.deletedSectionIds } } });
        }
        for (const section of parsed.data.sections) {
          const content = {
            subtitle: section.subtitle,
            body: section.body,
            ctaText: section.ctaText,
            ctaLink: section.ctaLink,
            imagePrompt: section.imagePrompt,
            mediaUrl: section.mediaUrl,
            altText: section.altText,
          };
          if (section.id.startsWith("new-")) {
            await tx.siteSection.create({ data: {
              siteId,
              type: section.type,
              title: section.title,
              content,
              order: section.order,
              isVisible: section.isVisible,
              settingsJson: normalizeSectionSettings(section.settings),
            } });
          } else {
            const updated = await tx.siteSection.updateMany({
              where: { id: section.id, siteId },
              data: {
                title: section.title,
                content,
                order: section.order,
                isVisible: section.isVisible,
                settingsJson: normalizeSectionSettings(section.settings),
              },
            });
            if (!updated.count) throw new Error("Sección no encontrada.");
          }
        }
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

    const sections = await prisma.siteSection.findMany({ where: { siteId }, orderBy: { order: "asc" } });
    const referencedMedia = new Set(sections
      .map((section) => (section.content as Record<string, unknown> | null)?.mediaUrl)
      .filter((value): value is string => isSiteMediaUrl(siteId, value)));
    const storedMedia = await getSiteMedia(siteId).catch(() => []);
    const staleMedia = [...deletedMedia, ...storedMedia.map((blob) => blob.url)]
      .filter((url, index, all) => !referencedMedia.has(url) && all.indexOf(url) === index);
    if (staleMedia.length) {
      const { del } = await import("@vercel/blob");
      await del(staleMedia).catch(() => null);
    }
    const fresh = await prisma.site.findUnique({ where: { id: siteId }, select: { updatedAt: true } });
    return NextResponse.json({
      ok: true,
      sections: sections.map(toRenderSection),
      updatedAt: fresh?.updatedAt.toISOString() ?? new Date().toISOString(),
    });
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
