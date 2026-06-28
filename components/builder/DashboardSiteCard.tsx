"use client";

import Link from "next/link";
import { ArrowUpRight, Globe, Inbox, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DashboardSite = {
  id: string; businessName: string; businessType: string; status: string;
  publicSlug: string;
  customDomain: string | null; domainVerifiedAt: string | null;
  createdAt: string; updatedAt: string; primaryColor: string; secondaryColor: string; accentColor: string;
  downloadedAt: string | null;
};

const STATUS_LABEL: Record<string, { label: string; dot: string; text: string; border: string }> = {
  GENERATED: { label: "Generado", dot: "bg-emerald-400", text: "text-emerald-300", border: "border-emerald-800" },
  DRAFT: { label: "Borrador", dot: "bg-[#a078ff]", text: "text-[#d0bcff]", border: "border-[#573878]" },
  PUBLISHED: { label: "Publicado", dot: "bg-foreground", text: "text-foreground", border: "border-border" },
};

export function DashboardSiteCard({ site }: { site: DashboardSite }) {
  const status = STATUS_LABEL[site.status] ?? STATUS_LABEL.DRAFT;
  const viewUrl = site.status === "PUBLISHED"
    ? site.customDomain && site.domainVerifiedAt ? `https://${site.customDomain}` : `/s/${site.publicSlug}`
    : `/preview/${site.id}`;
  const date = new Date(site.updatedAt).toLocaleDateString("es", { year: "numeric", month: "short", day: "numeric" });
  return (
    <article className="group overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-200 hover:border-[#8b5cf6] hover:shadow-[var(--shadow-glow)]">
      <div className="border-b border-border bg-[#0f0d15] p-2.5">
        <div className="mb-2 flex items-center justify-between px-0.5">
          <div className="flex gap-1.5" aria-label="Paleta del sitio">
            {[site.primaryColor, site.secondaryColor, site.accentColor].map((color, index) => (
              <span key={`${color}-${index}`} className="h-2 w-2 rounded-full ring-1 ring-white/10" style={{ backgroundColor: color }} />
            ))}
          </div>
          <span className="max-w-40 truncate text-[10px] text-muted-foreground">{viewUrl}</span>
        </div>
        <div className="relative aspect-[16/10] overflow-hidden rounded border border-[#2d243d] bg-white">
          <iframe
            src={viewUrl}
            title={`Vista del sitio ${site.businessName}`}
            loading="lazy"
            tabIndex={-1}
            className="pointer-events-none h-[400%] w-[400%] origin-top-left scale-[.25] border-0"
          />
          <Link
            href={viewUrl}
            target="_blank"
            aria-label={`Abrir vista previa de ${site.businessName}`}
            className="absolute inset-0 flex items-center justify-center bg-[#0f0d15]/0 transition-colors duration-200 hover:bg-[#0f0d15]/55 focus-visible:bg-[#0f0d15]/55"
          >
            <span className="flex translate-y-2 items-center gap-2 rounded border border-white/15 bg-[#15121b]/95 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
              Ver sitio <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-[var(--font-outfit)] text-lg font-semibold">{site.businessName}</h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">{site.businessType}</p>
          </div>
          <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded border bg-[#211e27] px-2.5 py-1 text-xs font-semibold", status.border, status.text)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />{status.label}
          </span>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">Actualizado el {date}</p>
          <div className="flex gap-2">
            <Button asChild size="icon" variant="outline"><Link href={`/builder/${site.id}/leads`} aria-label={`Contactos de ${site.businessName}`}><Inbox /></Link></Button>
            <Button asChild size="icon" variant="outline"><Link href={`/builder/${site.id}/domain`} aria-label={`Dominio de ${site.businessName}`}><Globe /></Link></Button>
            <Button asChild size="sm"><Link href={`/builder/${site.id}`}><Pencil /> Editar</Link></Button>
          </div>
        </div>
      </div>
    </article>
  );
}
