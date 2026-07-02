import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getUserBySessionToken, GUEST_COOKIE, hashGuestToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteSiteMedia, getSiteMedia, isSiteMediaUrl } from "@/lib/site/media";
import { normalizeSectionSettings } from "@/lib/site/section-layout";
import { sanitizeLink } from "@/lib/site/links";
import { toRenderSection } from "@/lib/site/section";

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
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const user = await getUserBySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  const guestTokenHash = hashGuestToken(req.cookies.get(GUEST_COOKIE)?.value);
  if (!user && !guestTokenHash) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });

  const site = await prisma.site.findFirst({
    where: {
      id: siteId,
      ...(user?.role === "ADMIN" ? {} : { OR: [
        ...(user ? [{ userId: user.id }] : []),
        ...(guestTokenHash ? [{ userId: null, guestTokenHash, guestExpiresAt: { gt: new Date() } }] : []),
      ] }),
    },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  if (!site) {
    return NextResponse.json({ error: "Sitio no encontrado." }, { status: 404 });
  }

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
    },
    sections: site.sections.map(toRenderSection),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const user = await getUserBySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

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

  try {
    const updated = await prisma.site.updateMany({
      where: { id: siteId, ...(user.role === "ADMIN" ? {} : { userId: user.id }) },
      data,
    });
    if (updated.count === 0) throw new Error("not-found");
    return NextResponse.json({ ok: true, site: { id: siteId } });
  } catch {
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
  const user = await getUserBySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const parsed = atomicSaveSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos inválidos." }, { status: 400 });

  const owned = await prisma.site.findFirst({
    where: { id: siteId, ...(user.role === "ADMIN" ? {} : { userId: user.id }) },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });

  const deleted = parsed.data.deletedSectionIds.length
    ? await prisma.siteSection.findMany({
        where: { siteId, id: { in: parsed.data.deletedSectionIds } },
        select: { content: true },
      })
    : [];
  const deletedMedia = deleted
    .map((section) => (section.content as Record<string, unknown> | null)?.mediaUrl)
    .filter((value): value is string => isSiteMediaUrl(siteId, value));

  await prisma.$transaction(async (tx) => {
    await tx.site.update({ where: { id: siteId }, data: parsed.data.site });
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
  return NextResponse.json({ ok: true, sections: sections.map(toRenderSection) });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const user = await getUserBySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const deleted = await prisma.site.deleteMany({
    where: { id: siteId, ...(user.role === "ADMIN" ? {} : { userId: user.id }) },
  });
  if (!deleted.count) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
  const removedMedia = await deleteSiteMedia(siteId).catch(() => 0);
  return NextResponse.json({ ok: true, removedMedia });
}
