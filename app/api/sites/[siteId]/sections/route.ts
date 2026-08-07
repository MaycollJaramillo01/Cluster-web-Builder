import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { assertSiteAccess, siteAccessErrorResponse } from "@/lib/site/access";
import { normalizeSectionSettings } from "@/lib/site/section-layout";
import { sanitizeLink } from "@/lib/site/links";
import { toRenderSection } from "@/lib/site/section";

const createSectionSchema = z.object({
  type: z.enum([
    "text", "image", "video", "about_us", "cta", "testimonials", "services",
    "faq", "gallery", "pricing", "process", "benefits", "location", "contact", "trust_badges",
  ]),
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
  order: z.number().int().min(0).max(100).default(0),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const parsed = createSectionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message || "Bloque inválido." }, { status: 400 });

  try {
    const { site } = await assertSiteAccess({
      siteId,
      request,
      requireUser: true,
      select: { id: true, _count: { select: { sections: true } } },
    });
    const sectionCount = Number((site as { _count?: { sections?: number } })._count?.sections ?? 0);
    if (sectionCount >= 40) return NextResponse.json({ error: "El sitio alcanzó el máximo de 40 bloques." }, { status: 400 });

    const data = parsed.data;
    const section = await prisma.siteSection.create({ data: {
      siteId,
      type: data.type,
      title: data.title,
      order: data.order,
      isVisible: data.isVisible,
      content: {
        subtitle: data.subtitle,
        body: data.body,
        ctaText: data.ctaText,
        ctaLink: data.ctaLink,
        imagePrompt: data.imagePrompt,
        mediaUrl: data.mediaUrl,
        altText: data.altText,
      },
      settingsJson: normalizeSectionSettings(data.settings),
    } });
    return NextResponse.json({ ok: true, section: toRenderSection(section) }, { status: 201 });
  } catch (error) {
    return siteAccessErrorResponse(error) ?? NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
  }
}
