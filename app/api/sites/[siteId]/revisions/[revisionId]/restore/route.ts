import { NextRequest, NextResponse } from "next/server";

import { getUserBySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeCanvasSectionsV2, normalizeSiteContentV2, normalizeThemeV2, V2_TEMPLATE_IDS } from "@/lib/site/v2-schema";

export async function POST(request: NextRequest, { params }: { params: Promise<{ siteId: string; revisionId: string }> }) {
  const user = await getUserBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const { siteId, revisionId } = await params;
  const site = await prisma.site.findFirst({
    where: { id: siteId, builderVersion: 2, ...(user.role === "ADMIN" ? {} : { userId: user.id }) },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  if (!site) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
  const revision = await prisma.siteRevision.findFirst({ where: { id: revisionId, siteId } });
  if (!revision) return NextResponse.json({ error: "Revisión no encontrada." }, { status: 404 });

  const raw = revision.snapshotJson as { site?: { templateId?: unknown; contentJson?: unknown; designJson?: unknown }; sections?: unknown };
  const templateId = (V2_TEMPLATE_IDS as readonly string[]).includes(String(raw.site?.templateId)) ? String(raw.site?.templateId) : "conversion";
  const content = normalizeSiteContentV2(raw.site?.contentJson);
  const design = normalizeThemeV2(raw.site?.designJson);
  const sections = normalizeCanvasSectionsV2(raw.sections);
  if (sections.length < 3) return NextResponse.json({ error: "La revisión no contiene un documento V2 restaurable." }, { status: 409 });

  const currentSnapshot = JSON.parse(JSON.stringify({
    site: { templateId: site.templateId, contentJson: site.contentJson, designJson: site.designJson },
    sections: site.sections.map((section) => section.content),
  }));
  const undoRevision = await prisma.$transaction(async (tx) => {
    const created = await tx.siteRevision.create({ data: { siteId, reason: "restore", snapshotJson: currentSnapshot } });
    await tx.site.update({ where: { id: siteId }, data: {
      templateId, contentJson: content as object, designJson: design as object,
      primaryColor: design.primary, secondaryColor: design.secondary, accentColor: design.accent,
    } });
    await tx.siteSection.deleteMany({ where: { siteId } });
    await tx.siteSection.createMany({ data: sections.map((section, order) => ({
      id: section.id, siteId, type: "canvas", title: section.key, order, isVisible: true,
      content: section as object, settingsJson: {},
    })) });
    return created;
  });
  return NextResponse.json({ ok: true, templateId, content, design, sections, revisionId: undoRevision.id });
}
