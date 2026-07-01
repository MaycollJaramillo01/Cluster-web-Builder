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
  const site = await prisma.site.findFirst({ where: { id: siteId, userId: user.id }, select: { businessName: true, customDomain: true, domainVerifiedAt: true } });
  if (!site) notFound();
  if (!hasProAccess(user)) redirect(`/billing?from=${encodeURIComponent(`/builder/${siteId}/domain`)}`);
  return <main className="min-h-dvh bg-background px-5 py-12 text-foreground"><div className="mx-auto max-w-2xl">
    <Link href={`/builder/${siteId}`} className="text-sm text-muted-foreground">← Volver al editor</Link>
    <h1 className="mt-8 text-3xl font-semibold">Dominio personalizado</h1>
    <p className="mt-2 text-muted-foreground">{site.businessName} seguirá alojado en Cluster; Vercel gestionará DNS y SSL.</p>
    <DomainForm siteId={siteId} initialDomain={site.customDomain || ""} verified={Boolean(site.domainVerifiedAt)} />
  </div></main>;
}
