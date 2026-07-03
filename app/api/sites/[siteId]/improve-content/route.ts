import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getUserBySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { openrouterChatStream, parseChatStream } from "@/lib/openrouter";
import { consumeRateLimit } from "@/lib/rate-limit";
import { normalizeSiteContentV2, V2_CONTENT_SLOTS } from "@/lib/site/v2-schema";

const schema = z.object({ slot: z.enum(V2_CONTENT_SLOTS), currentValue: z.string().max(4000) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const user = await getUserBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const { siteId } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Campo de contenido inválido." }, { status: 400 });
  const site = await prisma.site.findFirst({ where: { id: siteId, builderVersion: 2, ...(user.role === "ADMIN" ? {} : { userId: user.id }) } });
  if (!site) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
  if (!(await consumeRateLimit("block-ai-v2", siteId, 30, 60 * 60 * 1000))) return NextResponse.json({ error: "Alcanzaste el límite temporal de mejoras." }, { status: 429 });
  const content = normalizeSiteContentV2(site.contentJson);
  const facts = [`Nombre: ${content.business.name}`, `Actividad: ${content.business.type}`, content.business.location && `Ubicación: ${content.business.location}`, content.business.phone && `Teléfono: ${content.business.phone}`, content.business.email && `Correo: ${content.business.email}`].filter(Boolean).join("\n");
  try {
    const response = await openrouterChatStream([
      { role: "system", content: "Reescribe un único texto comercial en español. Usa solo los HECHOS. No inventes años, cifras, premios, clientes ni garantías. Devuelve únicamente texto plano; nunca JSON, HTML, estilos o estructura." },
      { role: "user", content: `HECHOS:\n${facts}\n\nCAMPO: ${parsed.data.slot}\nTEXTO ACTUAL: ${parsed.data.currentValue || "Vacío"}\nMÁXIMO: 4000 caracteres.` },
    ], { temperature: 0.35 });
    let value = "";
    for await (const delta of parseChatStream(response.body!)) value += delta;
    value = value.trim().replace(/^['"]|['"]$/g, "").slice(0, 4000);
    if (!value || /<\/?[a-z]|\{\s*"/i.test(value)) throw new Error("La respuesta no fue texto seguro.");
    return NextResponse.json({ value });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "No se pudo mejorar el texto." }, { status: 502 });
  }
}
