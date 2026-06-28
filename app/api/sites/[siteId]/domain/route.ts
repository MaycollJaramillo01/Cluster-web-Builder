import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getUserBySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addProjectDomain, removeProjectDomain, verifyProjectDomain } from "@/lib/vercel-domains";

const schema = z.object({ domain: z.string().trim().toLowerCase().max(253).regex(/^(?=.{4,253}$)(?!-)(?:[a-z0-9-]+\.)+[a-z]{2,63}$/) });

async function owner(request: NextRequest, siteId: string) {
  const user = await getUserBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return null;
  const site = await prisma.site.findFirst({ where: { id: siteId, userId: user.id }, select: { id: true, customDomain: true, domainVerifiedAt: true } });
  return site ? { user, site } : null;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const access = await owner(request, siteId);
  if (!access) return NextResponse.json({ error: "Sitio no encontrado." }, { status: 404 });
  if (access.user.planStatus !== "ACTIVE") return NextResponse.json({ error: "El dominio personalizado requiere Cluster Pro." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Escribe un dominio válido, sin https ni rutas." }, { status: 400 });

  try {
    const result = await addProjectDomain(parsed.data.domain);
    await prisma.site.update({ where: { id: siteId }, data: { customDomain: parsed.data.domain, domainVerifiedAt: result?.verified ? new Date() : null } });
    return NextResponse.json({ domain: parsed.data.domain, verified: Boolean(result?.verified), verification: result?.verification || [], providerConfigured: Boolean(result) });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "No se pudo agregar el dominio." }, { status: 502 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const access = await owner(request, siteId);
  if (!access?.site.customDomain) return NextResponse.json({ error: "Dominio no configurado." }, { status: 404 });
  if (access.user.planStatus !== "ACTIVE") return NextResponse.json({ error: "El dominio personalizado requiere Cluster Pro." }, { status: 403 });
  try {
    const result = await verifyProjectDomain(access.site.customDomain);
    const verified = Boolean(result?.verified);
    await prisma.site.update({ where: { id: siteId }, data: { domainVerifiedAt: verified ? new Date() : null } });
    return NextResponse.json({ domain: access.site.customDomain, verified, verification: result?.verification || [], providerConfigured: Boolean(result) });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "No se pudo verificar el dominio." }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const access = await owner(request, siteId);
  if (!access) return NextResponse.json({ error: "Sitio no encontrado." }, { status: 404 });
  if (access.site.customDomain) {
    const removal = removeProjectDomain(access.site.customDomain);
    if (removal) await removal.catch(() => null);
  }
  await prisma.site.update({ where: { id: siteId }, data: { customDomain: null, domainVerifiedAt: null } });
  return NextResponse.json({ ok: true });
}
