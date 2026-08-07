import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { assertSiteAccess, siteAccessErrorResponse } from "@/lib/site/access";
import { openrouterChatStream, parseChatStream } from "@/lib/openrouter";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getStyleCopyVoice, type LandingDesignStyle } from "@/lib/site/landing-design-brief";

export const runtime = "nodejs";

const requestSchema = z.object({
  field: z.enum(["title", "subtitle", "body", "ctaText"]),
  currentValue: z.string().max(4000).default(""),
});
const limits = { title: 200, subtitle: 400, body: 4000, ctaText: 120 } as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string; sectionId: string }> }
) {
  const { siteId, sectionId } = await params;
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Campo inválido." }, { status: 400 });

  let site;
  try {
    ({ site } = await assertSiteAccess({
      siteId,
      request,
      include: { sections: { where: { id: sectionId }, take: 1 } },
    }));
  } catch (error) {
    return siteAccessErrorResponse(error) ?? NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
  }

  const section = ((site.sections ?? [])[0] ?? null) as {
    title?: string;
    type?: string;
    content?: Record<string, unknown> | null;
  } | null;
  if (!section) return NextResponse.json({ error: "Bloque no encontrado." }, { status: 404 });
  if (!(await consumeRateLimit("block-ai", siteId, 30, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Alcanzaste el límite temporal de mejoras con IA." }, { status: 429 });
  }

  const facts = [
    `Nombre: ${site.businessName}`,
    `Actividad: ${site.businessType}`,
    site.location && `Ubicación: ${site.location}`,
    site.goal && `Objetivo: ${site.goal}`,
    site.phone && `Teléfono: ${site.phone}`,
    site.email && `Correo: ${site.email}`,
  ].filter(Boolean).join("\n");
  const voice = getStyleCopyVoice((site.visualStyle || "Modern") as LandingDesignStyle);
  const currentContent = (section.content ?? {}) as Record<string, unknown>;
  const context = [section.title, currentContent.subtitle, currentContent.body].filter((value) => typeof value === "string" && value).join(" | ");

  try {
    const response = await openrouterChatStream([
      {
        role: "system",
        content: `Eres un editor comercial riguroso. Reescribe un único campo de un sitio web en español. Voz: ${voice}. Usa exclusivamente los HECHOS proporcionados; no inventes cifras, premios, clientes, ubicaciones ni promesas. Devuelve solo el texto final, sin comillas, etiquetas ni explicación.`,
      },
      {
        role: "user",
        content: `HECHOS:\n${facts}\n\nBLOQUE: ${section.type}\nCONTEXTO: ${context || "Sin contenido adicional"}\nCAMPO: ${parsed.data.field}\nTEXTO ACTUAL: ${parsed.data.currentValue || "Vacío"}\nLÍMITE: ${limits[parsed.data.field]} caracteres.`,
      },
    ], { temperature: 0.35 });
    let value = "";
    for await (const delta of parseChatStream(response.body!)) value += delta;
    value = value.trim().replace(/^['"]|['"]$/g, "").slice(0, limits[parsed.data.field]);
    if (!value) throw new Error("La IA no devolvió texto.");
    return NextResponse.json({ value });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "No se pudo mejorar el texto." }, { status: 502 });
  }
}
