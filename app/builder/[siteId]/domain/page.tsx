import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DomainForm } from "@/components/builder/DomainForm";
import { hasProAccess } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export default async function DomainPage({ params }: { params: Promise<{ siteId: string }> }) {
  const user = await getCurrentUser();
  const { siteId } = await params;
  if (!user) redirect(`/login?from=/builder/${siteId}/domain`);
  const site = await prisma.site.findFirst({ where: { id: siteId, ...(user.role === "ADMIN" ? {} : { userId: user.id }) }, select: { businessName: true, customDomain: true, domainVerifiedAt: true } });
  if (!site) notFound();
  return <main className="min-h-dvh bg-zinc-50 px-5 py-10 text-zinc-950"><div className="mx-auto max-w-3xl">
    <Link href={`/builder/${siteId}`} className="text-sm font-medium text-zinc-600 hover:text-zinc-950">← Volver al editor</Link>
    <div className="mt-8 max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-violet-700">Dirección del sitio</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Usa tu propio dominio</h1>
      <p className="mt-3 leading-relaxed text-zinc-600">Conecta la dirección que tus clientes ya conocen. {site.businessName} seguirá alojado en Cluster y el certificado de seguridad se activará automáticamente.</p>
    </div>
    <DomainForm siteId={siteId} initialDomain={site.customDomain || ""} verified={Boolean(site.domainVerifiedAt)} proAccess={hasProAccess(user)} />
  </div></main>;
}
