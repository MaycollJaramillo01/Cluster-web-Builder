import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getUserBySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasProAccess } from "@/lib/entitlements";
import { trackProductEvent } from "@/lib/product-events";
import { dnsRecordsForDomain } from "@/lib/site/domain-dns";
import { addProjectDomain, getDomainConfiguration, removeProjectDomain, verifyProjectDomain } from "@/lib/vercel-domains";

const schema = z.object({ domain: z.string().trim().toLowerCase().max(253).regex(/^(?=.{4,253}$)(?!-)(?:[a-z0-9-]+\.)+[a-z]{2,63}$/) });

async function owner(request: NextRequest, siteId: string) {
  const user = await getUserBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return null;
  const site = await prisma.site.findFirst({ where: { id: siteId, ...(user.role === "ADMIN" ? {} : { userId: user.id }) }, select: { id: true, customDomain: true, domainVerifiedAt: true } });
  return site ? { user, site } : null;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const access = await owner(request, siteId);
  if (!access) return NextResponse.json({ error: "Sitio no encontrado." }, { status: 404 });
  if (!hasProAccess(access.user)) return NextResponse.json({ error: "El dominio personalizado requiere Cluster Pro.", upgradeRequired: true }, { status: 402 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Escribe un dominio válido, sin https ni rutas." }, { status: 400 });

  try {
    const result = await addProjectDomain(parsed.data.domain);
    const configuration = result ? await getDomainConfiguration(parsed.data.domain) : null;
    const verified = Boolean(result?.verified && configuration?.misconfigured === false);
    await prisma.site.update({ where: { id: siteId }, data: { customDomain: parsed.data.domain, domainVerifiedAt: verified ? new Date() : null } });
    if (access.site.customDomain && access.site.customDomain !== parsed.data.domain) {
      const removal = removeProjectDomain(access.site.customDomain);
      if (removal) await removal.catch(() => null);
    }
    await trackProductEvent("domain_connected", { userId: access.user.id, siteId, metadata: { verified } });
    return NextResponse.json({ domain: parsed.data.domain, verified, ownershipVerified: Boolean(result?.verified), records: dnsRecordsForDomain(parsed.data.domain, result?.verification), providerConfigured: Boolean(result), propagationHours: 48 });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "No se pudo agregar el dominio." }, { status: 502 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const access = await owner(request, siteId);
  if (!access?.site.customDomain) return NextResponse.json({ error: "Dominio no configurado." }, { status: 404 });
  if (!hasProAccess(access.user)) return NextResponse.json({ error: "El dominio personalizado requiere Cluster Pro.", upgradeRequired: true }, { status: 402 });
  try {
    const result = await verifyProjectDomain(access.site.customDomain);
    const configuration = result ? await getDomainConfiguration(access.site.customDomain) : null;
    const verified = Boolean(result?.verified && configuration?.misconfigured === false);
    await prisma.site.update({ where: { id: siteId }, data: { domainVerifiedAt: verified ? new Date() : null } });
    return NextResponse.json({ domain: access.site.customDomain, verified, ownershipVerified: Boolean(result?.verified), records: dnsRecordsForDomain(access.site.customDomain, result?.verification), providerConfigured: Boolean(result), propagationHours: 48 });
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
  await trackProductEvent("domain_removed", { userId: access.user.id, siteId });
  return NextResponse.json({ ok: true });
}
