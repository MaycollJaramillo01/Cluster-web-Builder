"use client";

import Link from "next/link";
import { Eye, Pencil } from "lucide-react";

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
  { label: string; dot: string; text: string; border: string }
> = {
  GENERATED: {
    label: "Generado",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  DRAFT: {
    label: "Borrador",
    dot: "bg-slate-400",
    text: "text-slate-600",
    border: "border-slate-200",
  },
  PUBLISHED: {
    label: "Publicado",
    dot: "bg-blue-500",
    text: "text-violet-700",
    border: "border-violet-200",
  },
};

export function DashboardSiteCard({ site }: { site: DashboardSite }) {
  const status = STATUS_LABEL[site.status] ?? STATUS_LABEL.DRAFT;
  const date = new Date(site.createdAt).toLocaleDateString("es", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-950">
            {site.businessName}
          </h3>
          <p className="mt-1 truncate text-sm text-slate-500">
            {site.businessType}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 text-xs font-medium",
            status.border,
            status.text
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
          {status.label}
        </span>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-400">Creado el {date}</p>
        <div className="flex items-center gap-1.5" aria-label="Paleta del sitio">
          {[site.primaryColor, site.secondaryColor, site.accentColor].map((color) => (
            <span
              key={color}
              className="h-4 w-4 rounded-full border border-white shadow-sm ring-1 ring-slate-200"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button asChild size="sm" className="bg-violet-700 text-white hover:bg-violet-800">
          <Link href={`/builder/${site.id}`}>
            <Pencil className="h-3.5 w-3.5" /> Editar
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-violet-50 hover:text-violet-800">
          <Link href={`/preview/${site.id}`} target="_blank">
            <Eye className="h-3.5 w-3.5" /> Preview
          </Link>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled
          className="col-span-2 justify-center text-slate-400"
          title="Publicar proximamente"
        >
          Publicar proximamente
        </Button>
      </div>
    </article>
  );
}
