"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { renderSiteV2 } from "@/lib/site/v2-render";
import { getAllTemplatesV2, instantiateTemplateV2 } from "@/lib/site/v2-templates";
import type { SiteContentV2, V2TemplateId } from "@/lib/site/v2-schema";

export function TemplatePickerV2({ siteId, content, initialTemplate }: { siteId: string; content: SiteContentV2; initialTemplate: V2TemplateId }) {
  const router = useRouter();
  const templates = useMemo(() => getAllTemplatesV2().map((template) => {
    const document = instantiateTemplateV2(template.id, content);
    return { ...template, preview: renderSiteV2({ content, design: template.theme, sections: document.sections, leadEndpoint: "#" }).html };
  }), [content]);
  const [selected, setSelected] = useState<V2TemplateId>(initialTemplate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const apply = async () => {
    setSaving(true); setError("");
    const response = await fetch(`/api/sites/${siteId}/template`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateId: selected }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error || "No se pudo aplicar la plantilla."); setSaving(false); return; }
    router.push(`/builder/${siteId}`); router.refresh();
  };
  return <>
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{templates.map((template) => <article key={template.id} className={`overflow-hidden rounded-xl border bg-card ${selected === template.id ? "border-violet-500 ring-2 ring-violet-500/25" : "border-border"}`}>
      <div className="aspect-[4/3] overflow-hidden bg-white"><iframe title={`Vista previa ${template.name}`} srcDoc={template.preview} className="pointer-events-none h-[400%] w-[400%] origin-top-left scale-[.25] border-0" /></div>
      <div className="p-5"><h2 className="text-lg font-semibold">{template.name}</h2><p className="mt-1 min-h-12 text-sm text-muted-foreground">{template.description}</p><button className={`mt-4 min-h-11 w-full rounded-lg border px-4 text-sm font-semibold ${selected === template.id ? "border-violet-500 bg-violet-600 text-white" : "border-border"}`} onClick={() => setSelected(template.id)}>{selected === template.id ? "Seleccionada" : "Elegir"}</button></div>
    </article>)}</div>
    <div className="sticky bottom-0 mt-8 flex items-center justify-end gap-4 border-t border-border bg-background/95 py-4 backdrop-blur">{error && <p className="text-sm text-red-400">{error}</p>}<button disabled={saving} onClick={apply} className="min-h-12 rounded-lg bg-violet-600 px-6 font-semibold text-white disabled:opacity-60">{saving ? "Aplicando…" : "Usar esta plantilla"}</button></div>
  </>;
}
