import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { assertSiteAccess, siteAccessErrorResponse } from "@/lib/site/access";
import { openrouterChatStream, parseChatStream } from "@/lib/openrouter";
import { consumeRateLimit } from "@/lib/rate-limit";
import { normalizeSiteContentV2, V2_CONTENT_SLOTS } from "@/lib/site/v2-schema";

const schema = z.object({
  slot: z.enum(V2_CONTENT_SLOTS),
  currentValue: z.string().max(4000),
  instruction: z.string().trim().min(3).max(300).default("Hazlo más claro, específico y breve."),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Campo de contenido inválido." }, { status: 400 });

  try {
    await assertSiteAccess({ siteId, request, requireUser: true, select: { id: true } });
    const site = await prisma.site.findFirst({
      where: { id: siteId, builderVersion: 2 },
      select: { id: true, contentJson: true },
    });
    if (!site) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
    if (!(await consumeRateLimit("block-ai-v2", siteId, 30, 60 * 60 * 1000))) {
      return NextResponse.json({ error: "Alcanzaste el límite temporal de mejoras." }, { status: 429 });
    }
    const content = normalizeSiteContentV2(site.contentJson);
    const facts = [
      `Nombre: ${content.business.name}`,
      `Actividad: ${content.business.type}`,
      content.business.location && `Ubicación: ${content.business.location}`,
      content.business.phone && `Teléfono: ${content.business.phone}`,
      content.business.email && `Correo: ${content.business.email}`,
    ].filter(Boolean).join("\n");
    const response = await openrouterChatStream([
      { role: "system", content: "Edita un único texto comercial en español. La instrucción solo puede cambiar redacción, tono o longitud. Usa únicamente los HECHOS. No inventes años, cifras, premios, clientes ni garantías. No uses guiones largos. Devuelve texto plano; nunca JSON, HTML, estilos o estructura." },
      { role: "user", content: `HECHOS:\n${facts}\n\nCAMPO: ${parsed.data.slot}\nINSTRUCCIÓN: ${parsed.data.instruction}\nTEXTO ACTUAL: ${parsed.data.currentValue || "Vacío"}\nMÁXIMO: 4000 caracteres.` },
    ], { temperature: 0.35 });
    let value = "";
    for await (const delta of parseChatStream(response.body!)) value += delta;
    value = value.trim().replace(/^['"]|['"]$/g, "").replace(/[—–]/g, "-").slice(0, 4000);
    if (!value || /<\/?[a-z]|\{\s*"/i.test(value)) throw new Error("La respuesta no fue texto seguro.");
    return NextResponse.json({ value });
  } catch (error) {
    const access = siteAccessErrorResponse(error);
    if (access) return access;
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo mejorar el texto." }, { status: 502 });
  }
}
