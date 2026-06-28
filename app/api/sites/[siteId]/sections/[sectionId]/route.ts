import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getUserBySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toRenderSection } from "@/lib/site/section";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSectionSchema = z.object({
  title: z.string().max(200).optional(),
  subtitle: z.string().max(400).optional(),
  body: z.string().max(4000).optional(),
  ctaText: z.string().max(120).optional(),
  ctaLink: z.string().max(300).optional(),
  isVisible: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string; sectionId: string }> }
) {
  const { siteId, sectionId } = await params;
  const user = await getUserBySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

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

  // Ensure the section exists and belongs to the site.
  const existing = await prisma.siteSection.findFirst({
    where: { id: sectionId, siteId, site: { is: { userId: user.id } } },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Sección no encontrada." },
      { status: 404 }
    );
  }

  // Merge text fields into the JSON `content` blob.
  const currentContent = (existing.content ?? {}) as Record<string, unknown>;
  const nextContent = { ...currentContent };
  for (const key of ["subtitle", "body", "ctaText", "ctaLink"] as const) {
    if (data[key] !== undefined) nextContent[key] = data[key];
  }

  try {
    const updated = await prisma.siteSection.update({
      where: { id: sectionId },
      data: {
        title: data.title ?? existing.title,
        isVisible: data.isVisible ?? existing.isVisible,
        order: data.order ?? existing.order,
        content: nextContent as object,
      },
    });
    return NextResponse.json({ ok: true, section: toRenderSection(updated) });
  } catch {
    return NextResponse.json(
      { error: "No se pudo actualizar la sección." },
      { status: 500 }
    );
  }
}
