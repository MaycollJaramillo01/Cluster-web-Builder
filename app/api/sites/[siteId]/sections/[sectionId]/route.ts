import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { assertSiteAccess, siteAccessErrorResponse } from "@/lib/site/access";
import { isSiteMediaUrl } from "@/lib/site/media";
import { normalizeSectionSettings } from "@/lib/site/section-layout";
import { sanitizeLink } from "@/lib/site/links";
import { toRenderSection } from "@/lib/site/section";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSectionSchema = z.object({
  title: z.string().max(200).optional(),
  subtitle: z.string().max(400).optional(),
  body: z.string().max(4000).optional(),
  ctaText: z.string().max(120).optional(),
  ctaLink: z.string().max(300).transform(sanitizeLink).optional(),
  imagePrompt: z.string().max(500).optional(),
  mediaUrl: z.string().max(2000).optional(),
  altText: z.string().max(300).optional(),
  settings: z.record(z.unknown()).optional(),
  isVisible: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string; sectionId: string }> }
) {
  const { siteId, sectionId } = await params;

  let data;
  try {
    data = updateSectionSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message ?? "Datos inválidos." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  try {
    await assertSiteAccess({ siteId, request: req, requireUser: true, select: { id: true } });
    const existing = await prisma.siteSection.findFirst({ where: { id: sectionId, siteId } });
    if (!existing) {
      return NextResponse.json({ error: "Sección no encontrada." }, { status: 404 });
    }

    const currentContent = (existing.content ?? {}) as Record<string, unknown>;
    const nextContent = { ...currentContent };
    for (const key of ["subtitle", "body", "ctaText", "ctaLink", "imagePrompt", "mediaUrl", "altText"] as const) {
      if (data[key] !== undefined) nextContent[key] = data[key];
    }

    const updated = await prisma.siteSection.update({
      where: { id: sectionId },
      data: {
        title: data.title ?? existing.title,
        isVisible: data.isVisible ?? existing.isVisible,
        order: data.order ?? existing.order,
        content: nextContent as object,
        settingsJson: normalizeSectionSettings((data.settings ?? existing.settingsJson ?? {}) as Record<string, unknown>),
      },
    });
    return NextResponse.json({ ok: true, section: toRenderSection(updated) });
  } catch (error) {
    return siteAccessErrorResponse(error) ?? NextResponse.json({ error: "No se pudo actualizar la sección." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string; sectionId: string }> }
) {
  const { siteId, sectionId } = await params;
  try {
    await assertSiteAccess({ siteId, request, requireUser: true, select: { id: true } });
    const section = await prisma.siteSection.findFirst({
      where: { id: sectionId, siteId },
      select: { id: true, type: true, content: true },
    });
    if (!section) return NextResponse.json({ error: "Bloque no encontrado." }, { status: 404 });
    if (section.type === "hero" || section.type === "footer") {
      return NextResponse.json({ error: "La portada y el pie de página no se pueden eliminar." }, { status: 400 });
    }
    await prisma.siteSection.delete({ where: { id: section.id } });
    const mediaUrl = (section.content as Record<string, unknown> | null)?.mediaUrl;
    if (isSiteMediaUrl(siteId, mediaUrl)) {
      const { del } = await import("@vercel/blob");
      await del(mediaUrl).catch(() => null);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return siteAccessErrorResponse(error) ?? NextResponse.json({ error: "Bloque no encontrado." }, { status: 404 });
  }
}
