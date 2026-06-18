"use client";

import Link from "next/link";
import { Eye, Pencil, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DashboardSite = {
  id: string;
  businessName: string;
  businessType: string;
  status: string;
  createdAt: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

const STATUS_LABEL: Record<
  string,
  { label: string; dot: string; text: string }
> = {
  GENERATED: { label: "Generado", dot: "bg-emerald-500", text: "text-emerald-700" },
  DRAFT: { label: "Borrador", dot: "bg-slate-400", text: "text-slate-500" },
  PUBLISHED: { label: "Publicado", dot: "bg-blue-500", text: "text-blue-700" },
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function DashboardSiteCard({ site }: { site: DashboardSite }) {
  const status = STATUS_LABEL[site.status] ?? STATUS_LABEL.DRAFT;
  const date = new Date(site.createdAt).toLocaleDateString("es", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)]">
      {/* Palette banner with the site's real colors */}
      <div
        className="relative h-24"
        style={{
          background: `linear-gradient(135deg, ${site.primaryColor} 0%, ${site.secondaryColor} 100%)`,
        }}
      >
        <span
          className="absolute -bottom-6 left-5 flex h-12 w-12 items-center justify-center rounded-xl border-4 border-white text-sm font-bold text-white shadow-sm"
          style={{ backgroundColor: site.accentColor }}
        >
          {initials(site.businessName)}
        </span>
        <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
          <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
          <span className={status.text}>{status.label}</span>
        </span>
      </div>

      <div className="px-5 pb-5 pt-8">
        <h3 className="truncate font-semibold text-slate-900">
          {site.businessName}
        </h3>
        <p className="mt-0.5 truncate text-sm text-slate-500">
          {site.businessType}
        </p>
        <p className="mt-3 text-xs text-slate-400">Creado el {date}</p>

        <div className="mt-4 flex items-center gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/builder/${site.id}`}>
              <Pencil className="h-3.5 w-3.5" /> Editar
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/preview/${site.id}`} target="_blank">
              <Eye className="h-3.5 w-3.5" /> Preview
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            title="Publicar (próximamente)"
            onClick={() =>
              alert(
                "La publicación real (dominio + hosting) llegará en una fase futura."
              )
            }
          >
            <Rocket className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
