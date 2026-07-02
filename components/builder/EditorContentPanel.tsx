"use client";

import { ChevronDown, ChevronUp, Eye, EyeOff, Link2, Plus, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RenderSection } from "@/lib/site/section";
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
  sections: RenderSection[];
  openId: string | null;
  sectionMeta: Record<string, EditorSectionMeta>;
  defaultSectionMeta: EditorSectionMeta;
  onOpenChange: (id: string | null) => void;
  onMove: (id: string, direction: -1 | 1) => void;
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
] as const;

const fieldClass = "border-border bg-[#120c1d] text-foreground placeholder:text-muted-foreground focus:border-[#8b5cf6] focus:ring-0 transition-colors";

export function EditorContentPanel({
  sections,
  openId,
  sectionMeta,
  defaultSectionMeta,
  onOpenChange,
  onMove,
  onUpdate,
  onAdd,
  onDelete,
}: Props) {
  const movableSections = sections.filter((section) => section.type !== "footer");

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

    <div className="space-y-2">
      {sections.map((section) => {
        const open = openId === section.id;
        const meta = sectionMeta[section.type] ?? defaultSectionMeta;
        const SectionIcon = meta.icon;
        const movableIndex = movableSections.findIndex((item) => item.id === section.id);
        const isFooter = section.type === "footer";

        return <div key={section.id} className={cn(
          "overflow-hidden rounded-lg border transition-colors",
          open ? "border-[#8b5cf6] bg-[#1d1a23]" : "border-border bg-[#1d1a23] hover:border-[#8b5cf6]/40",
        )}>
          <div className="flex min-h-[3.25rem] items-center gap-1 px-2">
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
            {meta.fields.map((field) => <SectionField
              key={field.key}
              id={`section-${section.id}-${field.key}`}
              field={field}
              value={(section[field.key] as string | undefined) ?? ""}
              onChange={(value) => onUpdate(section.id, { [field.key]: value })}
            />)}
          </div>}
        </div>;
      })}
    </div>
  </>;
}

function SectionField({ id, field, value, onChange }: {
  id: string;
  field: EditorFieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  return <div className="space-y-1.5">
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-[#cbc3d7]">{field.label}</label>
      {field.hint && <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#5e546b]">
        {field.key === "ctaLink" && <Link2 className="h-3 w-3 shrink-0" />}{field.hint}
      </p>}
    </div>
    {field.type === "textarea"
      ? <Textarea id={id} value={value} rows={field.rows ?? 3} placeholder={field.placeholder} className={fieldClass} onChange={(event) => onChange(event.target.value)} />
      : <Input id={id} value={value} placeholder={field.placeholder} className={fieldClass} onChange={(event) => onChange(event.target.value)} />}
  </div>;
}

function IconButton({ children, onClick, disabled, title }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
}) {
  return <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    disabled={disabled}
    className="flex h-11 w-11 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-[#2c2832] hover:text-foreground disabled:pointer-events-none disabled:opacity-25"
  >{children}</button>;
}
