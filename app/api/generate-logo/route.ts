import { NextRequest, NextResponse } from "next/server";
import { openrouterChatComplete } from "@/lib/openrouter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FALLBACK_COLORS = ["#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

function buildSvg(initials: string, color: string): string {
  const safe = initials.replace(/[<>&"']/g, "").slice(0, 2).toUpperCase();
  const fontSize = safe.length === 1 ? 90 : 68;
  const textY = safe.length === 1 ? 125 : 118;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">` +
    `<rect width="200" height="200" rx="40" ry="40" fill="${color}"/>` +
    `<text x="100" y="${textY}" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="${fontSize}" font-weight="700" fill="white">${safe}</text>` +
    `</svg>`
  );
}

function isValidHex(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

export async function POST(req: NextRequest) {
  let prompt: string;
  try {
    const body = await req.json();
    prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  } catch {
    return NextResponse.json({ error: "prompt requerido" }, { status: 400 });
  }

  if (!prompt) return NextResponse.json({ error: "prompt requerido" }, { status: 400 });

  let initials = "C";
  let color = FALLBACK_COLORS[0];

  try {
    const raw = await openrouterChatComplete(
      [
        {
          role: "system",
          content:
            'Eres un asistente que extrae el nombre del negocio de un prompt de sitio web. ' +
            'Responde SOLO con JSON válido en este formato exacto: {"name":"Nombre","initials":"NM","color":"#7c3aed"}. ' +
            'Las iniciales deben ser 1 o 2 letras en mayúsculas del nombre. ' +
            'El color debe ser un hex profesional acorde al tipo de negocio.',
        },
        { role: "user", content: prompt },
      ],
      { temperature: 0.2, maxTokens: 80 }
    );

    const match = raw.match(/\{[\s\S]*?\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as { name?: string; initials?: string; color?: string };
      if (typeof parsed.initials === "string" && parsed.initials.length >= 1) {
        initials = parsed.initials;
      } else if (typeof parsed.name === "string") {
        initials = parsed.name
          .split(/\s+/)
          .map((w) => w[0] ?? "")
          .join("")
          .slice(0, 2);
      }
      if (typeof parsed.color === "string" && isValidHex(parsed.color)) {
        color = parsed.color;
      }
    }
  } catch {
    // Fall back to first letter of prompt
    initials = prompt[0]?.toUpperCase() ?? "C";
    color = FALLBACK_COLORS[Math.floor(Math.random() * FALLBACK_COLORS.length)];
  }

  const svg = buildSvg(initials || "C", color);
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return NextResponse.json({ dataUrl });
}
