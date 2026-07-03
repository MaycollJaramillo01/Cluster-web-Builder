import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { getUserBySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { migrateLegacySiteDocument } from "@/lib/site/v2-migrate";

export async function POST(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const user = await getUserBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const { siteId } = await params;
  const source = await prisma.site.findFirst({
    where: { id: siteId, ...(user.role === "ADMIN" ? {} : { userId: user.id }) },
    include: { sections: { orderBy: { order: "asc" } }, replacementDraft: { select: { id: true } } },
  });
  if (!source) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
  if (source.builderVersion === 2) return NextResponse.json({ siteId: source.id, alreadyV2: true });
  if (source.replacementDraft) return NextResponse.json({ siteId: source.replacementDraft.id, alreadyExists: true });

  const migrated = migrateLegacySiteDocument(source, source.sections);
  const draft = await prisma.site.create({ data: {
    userId: source.userId,
    businessName: source.businessName,
    businessType: source.businessType,
    goal: source.goal,
    location: source.location,
    phone: source.phone,
    email: source.email,
    language: source.language,
    publicSlug: `${source.publicSlug}-v2-${randomUUID().slice(0, 6)}`,
    status: "GENERATED",
    logoUrl: source.logoUrl,
    coverUrl: source.coverUrl,
    primaryColor: migrated.design.primary,
    secondaryColor: migrated.design.secondary,
    accentColor: migrated.design.accent,
    blueprintJson: source.blueprintJson ?? undefined,
    builderVersion: 2,
    templateId: migrated.templateId,
    contentJson: migrated.content as object,
    designJson: migrated.design as object,
    replacesSiteId: source.id,
    sections: { create: migrated.sections.map((section, order) => ({
      id: section.id, type: "canvas", title: section.key, order, isVisible: true,
      content: section as object, settingsJson: {},
    })) },
  } });
  return NextResponse.json({ siteId: draft.id, migratedFrom: source.id }, { status: 201 });
}
