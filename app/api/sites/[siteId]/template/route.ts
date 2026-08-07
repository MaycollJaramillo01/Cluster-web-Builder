import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { assertSiteAccess, siteAccessErrorResponse } from "@/lib/site/access";
import { isDesignStyle } from "@/lib/site/template-selection";
import { orderSectionsForTemplate } from "@/lib/site/template-layout";
import { instantiateTemplateV2 } from "@/lib/site/v2-templates";
import { normalizeCanvasSectionsV2, V2_TEMPLATE_IDS } from "@/lib/site/v2-schema";

const schema = z.object({ visualStyle: z.string().refine(isDesignStyle, "Plantilla no válida.") });
const v2Schema = z.object({ templateId: z.enum(V2_TEMPLATE_IDS) });

export async function PUT(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  try {
    const { site } = await assertSiteAccess({
      siteId,
      request,
      include: { sections: { orderBy: { order: "asc" } } },
    });
    const siteSections = (site.sections ?? []) as Array<{
      id: string;
      type: string;
      order: number;
      content: unknown;
    }>;

    const body = await request.json().catch(() => null);

    if (site.builderVersion === 2) {
      const parsedV2 = v2Schema.safeParse(body);
      if (!parsedV2.success) return NextResponse.json({ error: "Plantilla V2 no válida." }, { status: 400 });
      const currentSections = normalizeCanvasSectionsV2(siteSections.map((section) => section.content));
      const next = instantiateTemplateV2(parsedV2.data.templateId, site.contentJson, currentSections);
      const snapshot = JSON.parse(JSON.stringify({
        site: { templateId: site.templateId, contentJson: site.contentJson, designJson: site.designJson },
        sections: siteSections.map((section) => section.content),
      }));

      const revision = await prisma.$transaction(async (tx) => {
        const created = await tx.siteRevision.create({ data: { siteId: site.id, reason: "template-change", snapshotJson: snapshot } });
        await tx.site.update({ where: { id: site.id }, data: { templateId: next.template.id, designJson: next.template.theme as object } });
        await tx.siteSection.deleteMany({ where: { siteId: site.id } });
        await tx.siteSection.createMany({ data: next.sections.map((section, order) => ({
          id: section.id, siteId: site.id, type: "canvas", title: section.key, order, isVisible: true,
          content: section as object, settingsJson: {},
        })) });
        return created;
      });
      return NextResponse.json({ ok: true, builderVersion: 2, templateId: next.template.id, design: next.template.theme, sections: next.sections, revisionId: revision.id });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message || "Plantilla no válida." }, { status: 400 });

    const orderedSections = orderSectionsForTemplate(siteSections, parsed.data.visualStyle);
    await prisma.$transaction([
      prisma.site.update({ where: { id: site.id }, data: { visualStyle: parsed.data.visualStyle } }),
      ...orderedSections.map((section, order) => prisma.siteSection.update({
        where: { id: section.id },
        data: { order },
      })),
    ]);
    return NextResponse.json({ ok: true, visualStyle: parsed.data.visualStyle });
  } catch (error) {
    return siteAccessErrorResponse(error) ?? NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
  }
}
