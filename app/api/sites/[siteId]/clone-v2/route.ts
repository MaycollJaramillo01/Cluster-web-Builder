import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { assertSiteAccess, siteAccessErrorResponse } from "@/lib/site/access";
import { migrateLegacySiteDocument } from "@/lib/site/v2-migrate";

export async function POST(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  try {
    const { site: source } = await assertSiteAccess({
      siteId,
      request,
      requireUser: true,
      include: {
        sections: { orderBy: { order: "asc" } },
        replacementDraft: { select: { id: true } },
      },
    });

    if (source.builderVersion === 2) return NextResponse.json({ siteId: source.id, alreadyV2: true });
    const replacementDraft = (source as { replacementDraft?: { id: string } | null }).replacementDraft;
    if (replacementDraft) return NextResponse.json({ siteId: replacementDraft.id, alreadyExists: true });

    const sections = source.sections ?? [];
    const migrated = migrateLegacySiteDocument(source as Parameters<typeof migrateLegacySiteDocument>[0], sections as Parameters<typeof migrateLegacySiteDocument>[1]);
    const draft = await prisma.site.create({ data: {
      userId: typeof source.userId === "string" ? source.userId : null,
      businessName: String(source.businessName ?? "Negocio"),
      businessType: String(source.businessType ?? "Servicios"),
      goal: String(source.goal ?? "contacts"),
      location: source.location ?? null,
      phone: source.phone ?? null,
      email: source.email ?? null,
      language: String(source.language ?? "es"),
      publicSlug: `${String(source.publicSlug ?? siteId)}-v2-${randomUUID().slice(0, 6)}`,
      status: "GENERATED",
      logoUrl: typeof source.logoUrl === "string" ? source.logoUrl : null,
      coverUrl: typeof source.coverUrl === "string" ? source.coverUrl : null,
      primaryColor: migrated.design.primary,
      secondaryColor: migrated.design.secondary,
      accentColor: migrated.design.accent,
      blueprintJson: (source.blueprintJson as object | undefined) ?? undefined,
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
  } catch (error) {
    return siteAccessErrorResponse(error) ?? NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
  }
}
