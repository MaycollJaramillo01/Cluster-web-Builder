import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { BrandMark } from "@/components/brand/BrandMark";

import { TemplatePicker } from "@/components/builder/TemplatePicker";
import { getCurrentUser, GUEST_COOKIE, hashGuestToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTemplateCandidates } from "@/lib/site/template-selection";
import { TemplatePickerV2 } from "@/components/builder/TemplatePickerV2";
import { normalizeSiteContentV2, V2_TEMPLATE_IDS } from "@/lib/site/v2-schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "Elige un diseño | Cluster Web Builder", robots: { index: false, follow: false } };

export default async function TemplatesPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const user = await getCurrentUser();
  const guestTokenHash = hashGuestToken((await cookies()).get(GUEST_COOKIE)?.value);
  if (!user && !guestTokenHash) redirect(`/login?from=/builder/${siteId}/templates`);

  const site = await prisma.site.findFirst({
    where: {
      id: siteId,
      ...(user?.role === "ADMIN" ? {} : { OR: [
        ...(user ? [{ userId: user.id }] : []),
        ...(guestTokenHash ? [{ userId: null, guestTokenHash, guestExpiresAt: { gt: new Date() } }] : []),
      ] }),
    },
    select: { id: true, businessName: true, businessType: true, visualStyle: true, builderVersion: true, templateId: true, contentJson: true },
  });
  if (!site) notFound();

  const candidates = getTemplateCandidates(site.visualStyle, { siteId: site.id, businessType: site.businessType });
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-[#0f0d15]">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 py-2 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold"><BrandMark /><span className="hidden sm:inline">Cluster</span></Link>
          <Link href={`/builder/${site.id}`} className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Ir al editor</Link>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a078ff]">Paso 3 de 3 · Diseño</p>
          <h1 className="mt-3 font-[var(--font-outfit)] text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">Elige cómo se verá {site.businessName}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">El contenido y tu paleta se mantienen. Solo cambia la composición, la tipografía y el estilo visual.</p>
        </div>
        {site.builderVersion === 2
          ? <TemplatePickerV2
              siteId={site.id}
              content={normalizeSiteContentV2(site.contentJson)}
              initialTemplate={(V2_TEMPLATE_IDS as readonly string[]).includes(String(site.templateId)) ? site.templateId as (typeof V2_TEMPLATE_IDS)[number] : "conversion"}
            />
          : <TemplatePicker siteId={site.id} candidates={candidates} initialStyle={site.visualStyle} />}
      </section>
    </main>
  );
}
