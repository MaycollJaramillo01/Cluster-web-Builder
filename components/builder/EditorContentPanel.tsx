"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, Link2, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";

import { SortableItem, SortableList } from "@/components/builder/dnd";
import { EditorMediaField } from "@/components/builder/EditorMediaField";
import { EditorStylePanel } from "@/components/builder/EditorStylePanel";
import { fieldClass, IconButton } from "@/components/builder/editor-ui";
import { FreeformEditor } from "@/components/builder/FreeformEditor";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RenderSection } from "@/lib/site/section";
import { normalizeSectionLayout } from "@/lib/site/section-layout";
import { cn } from "@/lib/utils";

export type EditorFieldDef = {
  key: "title" | "subtitle" | "body" | "ctaText" | "ctaLink" | "imagePrompt" | "mediaUrl" | "altText";
  label: string;
  type: "input" | "textarea";
  placeholder?: string;
  hint?: string;
  rows?: number;
};

export type EditorSectionMeta = {
  icon: React.ElementType;
  label: string;
  fields: EditorFieldDef[];
};

type Props = {
  siteId: string;
  sections: RenderSection[];
  openId: string | null;
  sectionMeta: Record<string, EditorSectionMeta>;
  defaultSectionMeta: EditorSectionMeta;
  onOpenChange: (id: string | null) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onReorder: (activeId: string, overId: string) => void;
  onUpdate: (id: string, patch: Partial<RenderSection>) => void;
  onAdd: (type: string) => void;
  onDelete: (id: string) => void;
};

const ADDABLE_BLOCKS = [
  ["text", "Texto"],
  ["image", "Imagen"],
  ["video", "Video"],
  ["about_us", "Nosotros"],
  ["cta", "Llamado a la acción"],
  ["services", "Servicios"],
  ["testimonials", "Reseñas"],
  ["faq", "Preguntas frecuentes"],
  ["gallery", "Galería"],
  ["pricing", "Precios"],
  ["process", "Proceso"],
  ["benefits", "Beneficios"],
  ["location", "Ubicación"],
  ["contact", "Contacto"],
  ["freeform", "Sección libre (widgets)"],
] as const;

/* ------------------------------------------------------------------ */
/* Editor generico de listas (settings.items)                           */
/* ------------------------------------------------------------------ */

type ItemFieldDef = { key: string; label: string; type: "input" | "textarea"; placeholder?: string };
type ItemMeta = { itemLabel: string; fields: ItemFieldDef[] };

const MAX_ITEMS = 12;

const ITEM_META: Record<string, ItemMeta> = {
  services: {
    itemLabel: "Servicio",
    fields: [
      { key: "name", label: "Nombre", type: "input", placeholder: "Ej: Corte de cabello" },
      { key: "price", label: "Precio", type: "input", placeholder: "Ej: $25 o Cotización" },
      { key: "description", label: "Descripción", type: "textarea", placeholder: "Qué incluye este servicio" },
    ],
  },
  testimonials: {
    itemLabel: "Reseña",
    fields: [
      { key: "name", label: "Cliente", type: "input", placeholder: "Nombre del cliente" },
      { key: "role", label: "Detalle", type: "input", placeholder: "Ej: Cliente desde 2022" },
      { key: "quote", label: "Reseña", type: "textarea", placeholder: "Lo que dijo el cliente" },
      { key: "rating", label: "Estrellas (1-5)", type: "input", placeholder: "5" },
      { key: "source", label: "Plataforma", type: "input", placeholder: "Ej: Google (opcional)" },
    ],
  },
  faq: {
    itemLabel: "Pregunta",
    fields: [
      { key: "question", label: "Pregunta", type: "input", placeholder: "¿Qué preguntan tus clientes?" },
      { key: "answer", label: "Respuesta", type: "textarea", placeholder: "Respuesta clara y directa" },
    ],
  },
  benefits: {
    itemLabel: "Beneficio",
    fields: [
      { key: "title", label: "Título", type: "input", placeholder: "Ej: Garantía escrita" },
      { key: "description", label: "Descripción", type: "textarea", placeholder: "Por qué importa a tu cliente" },
    ],
  },
  process: {
    itemLabel: "Paso",
    fields: [
      { key: "title", label: "Título del paso", type: "input", placeholder: "Ej: Primera llamada" },
      { key: "description", label: "Descripción", type: "textarea", placeholder: "Qué ocurre en este paso" },
    ],
  },
  pricing: {
    itemLabel: "Plan",
    fields: [
      { key: "name", label: "Nombre del plan", type: "input", placeholder: "Ej: Plan básico" },
      { key: "price", label: "Precio", type: "input", placeholder: "Ej: $99/mes" },
      { key: "description", label: "Descripción", type: "textarea", placeholder: "Qué incluye este plan" },
    ],
  },
  gallery: {
    itemLabel: "Elemento",
    fields: [
      { key: "name", label: "Etiqueta", type: "input", placeholder: "Ej: Proyecto destacado" },
      { key: "description", label: "Detalle", type: "input", placeholder: "Texto pequeño de apoyo" },
    ],
  },
};

export function EditorContentPanel({
  siteId,
  sections,
  openId,
  sectionMeta,
  defaultSectionMeta,
  onOpenChange,
  onMove,
  onReorder,
  onUpdate,
  onAdd,
  onDelete,
}: Props) {
  const movableSections = sections.filter((section) => section.type !== "footer");
  const [improving, setImproving] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [mediaUsage, setMediaUsage] = useState<{ usedBytes: number; quotaBytes: number; files: number } | null>(null);

  const refreshUsage = useCallback(() => {
    void fetch(`/api/sites/${siteId}/media`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => data && setMediaUsage(data))
      .catch(() => null);
  }, [siteId]);

  useEffect(refreshUsage, [refreshUsage]);

  const improve = async (section: RenderSection, field: EditorFieldDef) => {
    const key = `${section.id}:${field.key}`;
    setImproving(key);
    setAiError(null);
    try {
      const response = await fetch(`/api/sites/${siteId}/sections/${section.id}/improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: field.key, currentValue: section[field.key] ?? "" }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.value) throw new Error(data?.error ?? "No se pudo mejorar el texto.");
      onUpdate(section.id, { [field.key]: data.value });
    } catch (reason) {
      setAiError(reason instanceof Error ? reason.message : "No se pudo mejorar el texto.");
    } finally {
      setImproving(null);
    }
  };

  return <>
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#a078ff]">Secciones</h2>
      <span className="text-xs text-muted-foreground">
        {sections.filter((section) => section.isVisible).length} de {sections.length} visibles
      </span>
    </div>

    <label className="mb-4 block">
      <span className="sr-only">Agregar bloque</span>
      <span className="flex min-h-11 items-center gap-2 rounded-lg border border-dashed border-[#6d5b83] bg-[#1d1a23] px-3 text-sm text-[#d8c8f8] focus-within:border-[#8b5cf6]">
        <Plus className="h-4 w-4" aria-hidden="true" />
        <select
          value=""
          onChange={(event) => event.target.value && onAdd(event.target.value)}
          className="min-h-10 flex-1 cursor-pointer bg-transparent outline-none"
        >
          <option value="" className="bg-[#1d1a23]">Agregar bloque…</option>
          {ADDABLE_BLOCKS.map(([value, label]) => <option key={value} value={value} className="bg-[#1d1a23]">{label}</option>)}
        </select>
      </span>
    </label>

    <SortableList ids={movableSections.map((section) => section.id)} onReorder={onReorder}>
    <div className="space-y-2">
      {sections.map((section) => {
        const open = openId === section.id;
        const meta = sectionMeta[section.type] ?? defaultSectionMeta;
        const SectionIcon = meta.icon;
        const movableIndex = movableSections.findIndex((item) => item.id === section.id);
        const isFooter = section.type === "footer";

        return <SortableItem key={section.id} id={section.id} disabled={isFooter} className={cn(
          "overflow-hidden rounded-lg border transition-colors",
          open ? "border-[#8b5cf6] bg-[#1d1a23]" : "border-border bg-[#1d1a23] hover:border-[#8b5cf6]/40",
        )}>
          {(handle) => <>
          <div className="flex min-h-[3.25rem] items-center gap-1 px-2">
            {handle}
            <button
              type="button"
              aria-expanded={open}
              onClick={() => onOpenChange(open ? null : section.id)}
              className="flex min-h-11 min-w-0 flex-1 items-center gap-3 px-2 text-left"
            >
              <span className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
                open ? "bg-[#2c2141] text-[#c4b5fd]" : "bg-[#2c2832] text-[#7a6d87]",
              )}>
                <SectionIcon className="h-3.5 w-3.5" />
              </span>
              <span className={cn(
                "min-w-0 truncate text-sm font-medium",
                !section.isVisible ? "text-muted-foreground line-through" : open ? "text-[#e9ddff]" : "text-foreground",
              )}>{meta.label}</span>
              {!section.isVisible && <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6b6079]">Oculta</span>}
            </button>

            {!isFooter && <>
              <IconButton title="Mover arriba" disabled={movableIndex === 0} onClick={() => onMove(section.id, -1)}><ChevronUp className="h-4 w-4" /></IconButton>
              <IconButton title="Mover abajo" disabled={movableIndex === movableSections.length - 1} onClick={() => onMove(section.id, 1)}><ChevronDown className="h-4 w-4" /></IconButton>
            </>}
            <IconButton
              title={section.isVisible ? "Ocultar sección" : "Mostrar sección"}
              onClick={() => onUpdate(section.id, { isVisible: !section.isVisible })}
            >
              {section.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </IconButton>
            {!isFooter && section.type !== "hero" && (
              <IconButton
                title="Eliminar bloque"
                onClick={() => window.confirm("¿Eliminar este bloque?") && onDelete(section.id)}
              >
                <Trash2 className="h-4 w-4" />
              </IconButton>
            )}
          </div>

          {open && <div className="space-y-5 border-t border-[#2c2832] bg-[#120c1d] px-4 py-5">
            {mediaUsage && (section.type === "image" || section.type === "video") && <p className="rounded-md bg-[#1d1a23] px-3 py-2 text-[11px] text-[#958ea0]">
              Almacenamiento: {(mediaUsage.usedBytes / 1024 / 1024).toFixed(1)} de {(mediaUsage.quotaBytes / 1024 / 1024).toFixed(0)} MB · {mediaUsage.files} archivos
            </p>}
            {meta.fields.map((field) => field.key === "mediaUrl" && (section.type === "image" || section.type === "video")
              ? <EditorMediaField
                  key={field.key}
                  siteId={siteId}
                  kind={section.type}
                  value={section.mediaUrl ?? ""}
                  onChange={(value) => onUpdate(section.id, { mediaUrl: value })}
                  onUsageChange={refreshUsage}
                />
              : <SectionField
                  key={field.key}
                  id={`section-${section.id}-${field.key}`}
                  field={field}
                  value={(section[field.key] as string | undefined) ?? ""}
                  improving={improving === `${section.id}:${field.key}`}
                  onImprove={!section.id.startsWith("new-") && ["title", "subtitle", "body", "ctaText"].includes(field.key) ? () => void improve(section, field) : undefined}
                  onChange={(value) => onUpdate(section.id, { [field.key]: value })}
                />)}
            {section.type === "freeform" && <FreeformEditor section={section} onUpdate={onUpdate} />}
            {section.type !== "footer" && <LayoutControls section={section} onUpdate={onUpdate} />}
            {section.type !== "footer" && <EditorStylePanel section={section} fieldKeys={meta.fields.map((field) => field.key)} onUpdate={onUpdate} />}
            {aiError && <p role="alert" className="text-xs text-[#ffb4ab]">{aiError}</p>}
            {ITEM_META[section.type] && <SectionItemsEditor
              section={section}
              meta={ITEM_META[section.type]}
              onUpdate={onUpdate}
            />}
          </div>}
          </>}
        </SortableItem>;
      })}
    </div>
    </SortableList>
  </>;
}

/** Edita los elementos de settings.items: agregar, eliminar, reordenar y editar campos. */
function SectionItemsEditor({ section, meta, onUpdate }: {
  section: RenderSection;
  meta: ItemMeta;
  onUpdate: (id: string, patch: Partial<RenderSection>) => void;
}) {
  const items = (Array.isArray(section.settings.items) ? section.settings.items : [])
    .map((item) => (typeof item === "object" && item ? (item as Record<string, unknown>) : {}));

  const commit = (next: Record<string, unknown>[]) => {
    onUpdate(section.id, { settings: { ...section.settings, items: next } });
  };
  const updateItem = (index: number, key: string, value: string) => {
    commit(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };
  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };
  const removeItem = (index: number) => commit(items.filter((_, i) => i !== index));
  const addItem = () => {
    if (items.length >= MAX_ITEMS) return;
    commit([...items, Object.fromEntries(meta.fields.map((field) => [field.key, ""]))]);
  };

  return <div className="space-y-3 border-t border-[#2c2832] pt-4">
    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a078ff]">
      {meta.itemLabel}s ({items.length})
    </p>
    {items.map((item, index) => (
      <div key={index} className="rounded-lg border border-[#2c2832] bg-[#1d1a23] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#cbc3d7]">{meta.itemLabel} {index + 1}</span>
          <span className="flex items-center">
            <IconButton title="Subir elemento" disabled={index === 0} onClick={() => moveItem(index, -1)}><ChevronUp className="h-3.5 w-3.5" /></IconButton>
            <IconButton title="Bajar elemento" disabled={index === items.length - 1} onClick={() => moveItem(index, 1)}><ChevronDown className="h-3.5 w-3.5" /></IconButton>
            <IconButton title="Eliminar elemento" onClick={() => removeItem(index)}><Trash2 className="h-3.5 w-3.5" /></IconButton>
          </span>
        </div>
        <div className="space-y-3">
          {meta.fields.map((field) => {
            const id = `item-${section.id}-${index}-${field.key}`;
            const value = item[field.key] == null ? "" : String(item[field.key]);
            return <div key={field.key} className="space-y-1">
              <label htmlFor={id} className="block text-[11px] font-medium text-[#9b8ab4]">{field.label}</label>
              {field.type === "textarea"
                ? <Textarea id={id} value={value} rows={2} placeholder={field.placeholder} className={fieldClass} onChange={(event) => updateItem(index, field.key, event.target.value)} />
                : <Input id={id} value={value} placeholder={field.placeholder} className={fieldClass} onChange={(event) => updateItem(index, field.key, event.target.value)} />}
            </div>;
          })}
        </div>
      </div>
    ))}
    <button
      type="button"
      onClick={addItem}
      disabled={items.length >= MAX_ITEMS}
      className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#6d5b83] text-xs text-[#d8c8f8] transition-colors hover:border-[#8b5cf6] disabled:opacity-40"
    >
      <Plus className="h-3.5 w-3.5" />
      {items.length >= MAX_ITEMS ? `Máximo ${MAX_ITEMS} elementos` : `Agregar ${meta.itemLabel.toLowerCase()}`}
    </button>
  </div>;
}

function SectionField({ id, field, value, onChange, onImprove, improving }: {
  id: string;
  field: EditorFieldDef;
  value: string;
  onChange: (value: string) => void;
  onImprove?: () => void;
  improving?: boolean;
}) {
  return <div className="space-y-1.5">
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="block text-xs font-medium text-[#cbc3d7]">{field.label}</label>
        {onImprove && <button type="button" onClick={onImprove} disabled={improving} className="flex min-h-8 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-[#c4b5fd] hover:bg-[#2c2141] disabled:opacity-60">
          {improving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Mejorar con IA
        </button>}
      </div>
      {field.hint && <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#5e546b]">
        {field.key === "ctaLink" && <Link2 className="h-3 w-3 shrink-0" />}{field.hint}
      </p>}
    </div>
    {field.type === "textarea"
      ? <Textarea id={id} value={value} rows={field.rows ?? 3} placeholder={field.placeholder} className={fieldClass} onChange={(event) => onChange(event.target.value)} />
      : <Input id={id} value={value} placeholder={field.placeholder} className={fieldClass} onChange={(event) => onChange(event.target.value)} />}
  </div>;
}

function LayoutControls({ section, onUpdate }: { section: RenderSection; onUpdate: Props["onUpdate"] }) {
  const current = normalizeSectionLayout(section.settings.layout);
  const update = (key: string, value: string) => onUpdate(section.id, {
    settings: { ...section.settings, layout: { ...current, [key]: value } },
  });
  return <fieldset className="space-y-3 rounded-lg border border-[#3d3549] bg-[#1d1a23] p-3">
    <legend className="px-1 text-xs font-semibold text-[#cbc3d7]">Composición</legend>
    <LayoutSelect label="Ancho" value={current.width ?? "standard"} onChange={(value) => update("width", value)} options={[["narrow", "Estrecho"], ["standard", "Normal"], ["wide", "Amplio"]]} />
    <LayoutSelect label="Alineación" value={current.align ?? "left"} onChange={(value) => update("align", value)} options={[["left", "Izquierda"], ["center", "Centro"]]} />
    <LayoutSelect label="Fondo" value={current.background ?? "plain"} onChange={(value) => update("background", value)} options={[["plain", "Plano"], ["tonal", "Tonal"]]} />
    <LayoutSelect label="Espaciado" value={current.spacing ?? "normal"} onChange={(value) => update("spacing", value)} options={[["compact", "Compacto"], ["normal", "Normal"], ["spacious", "Amplio"]]} />
  </fieldset>;
}

function LayoutSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly (readonly [string, string])[] }) {
  return <label className="grid grid-cols-[6rem_1fr] items-center gap-3 text-xs text-[#958ea0]">
    {label}
    <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-10 rounded-md border border-[#494454] bg-[#120c1d] px-2 text-xs text-[#e9ddff] outline-none focus:border-[#8b5cf6]">
      {options.map(([option, text]) => <option key={option} value={option}>{text}</option>)}
    </select>
  </label>;
}

