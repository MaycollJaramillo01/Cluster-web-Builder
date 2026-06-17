"use client";

import Link from "next/link";
import { Eye, Pencil, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type DashboardSite = {
  id: string;
  businessName: string;
  businessType: string;
  status: string;
  createdAt: string;
};

const STATUS_LABEL: Record<string, { label: string; variant: "success" | "secondary" | "muted" }> = {
  GENERATED: { label: "Generado", variant: "success" },
  DRAFT: { label: "Borrador", variant: "muted" },
  PUBLISHED: { label: "Publicado", variant: "secondary" },
};

export function DashboardSiteCard({ site }: { site: DashboardSite }) {
  const status = STATUS_LABEL[site.status] ?? STATUS_LABEL.DRAFT;
  const date = new Date(site.createdAt).toLocaleDateString("es", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{site.businessName}</CardTitle>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="text-sm text-slate-500">{site.businessType}</p>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-xs text-slate-400">Creado el {date}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="default">
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
            onClick={() =>
              alert(
                "La publicación real (dominio + hosting) llegará en una fase futura."
              )
            }
          >
            <Rocket className="h-3.5 w-3.5" /> Publicar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
