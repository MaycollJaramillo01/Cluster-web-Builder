import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { assertSiteAccess, siteAccessErrorResponse } from "@/lib/site/access";
import { normalizeCanvasSectionsV2, normalizeSiteContentV2, normalizeThemeV2 } from "@/lib/site/v2-schema";

export async function POST(request: NextRequest, { params }: { params: Promise<{ siteId: string; revisionId: string }> }) {
  const { siteId, revisionId } = await params;
  try {
    await assertSiteAccess({ siteId, request, requireUser: true, select: { id: true } });

    const site = await prisma.site.findFirst({
      where: { id: siteId, builderVersion: 2 },
      include: { sections: { orderBy: { order: "asc" } } },
    });
    if (!site) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });

    const revision = await prisma.siteRevision.findFirst({ where: { id: revisionId, siteId } });
    if (!revision) return NextResponse.json({ error: "Revisión no encontrada." }, { status: 404 });

    const raw = revision.snapshotJson as { site?: { contentJson?: unknown; designJson?: unknown }; sections?: unknown };
    const content = normalizeSiteContentV2(raw.site?.contentJson);
    const design = normalizeThemeV2(raw.site?.designJson);
    const sections = normalizeCanvasSectionsV2(raw.sections);
    if (sections.length < 3) return NextResponse.json({ error: "La revisión no contiene un documento V2 restaurable." }, { status: 409 });

    const currentSnapshot = JSON.parse(JSON.stringify({
      site: { contentJson: site.contentJson, designJson: site.designJson },
      sections: site.sections.map((section) => section.content),
    }));
    const undoRevision = await prisma.$transaction(async (tx) => {
      const created = await tx.siteRevision.create({ data: { siteId, reason: "restore", snapshotJson: currentSnapshot } });
      await tx.site.update({ where: { id: siteId }, data: {
        contentJson: content as object, designJson: design as object,
        primaryColor: design.primary, secondaryColor: design.secondary, accentColor: design.accent,
      } });
      await tx.siteSection.deleteMany({ where: { siteId } });
      await tx.siteSection.createMany({ data: sections.map((section, order) => ({
        id: section.id, siteId, type: "canvas", title: section.key, order, isVisible: true,
        content: section as object, settingsJson: {},
      })) });
      return created;
    });
    return NextResponse.json({ ok: true, content, design, sections, revisionId: undoRevision.id });
  } catch (error) {
    return siteAccessErrorResponse(error) ?? NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
  }
}
