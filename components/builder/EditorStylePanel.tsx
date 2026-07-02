"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RenderSection } from "@/lib/site/section";
import { normalizeElementStyle, TEXT_STYLE_COVERED_TYPES, type ElementStyle, type StyleRole } from "@/lib/site/element-style";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<StyleRole, string> = {
  section: "Sección",
  title: "Título",
  subtitle: "Subtítulo",
  body: "Texto",
  ctaText: "Botón",
};

const TEXT_ROLE_ORDER: Exclude<StyleRole, "section">[] = ["title", "subtitle", "body", "ctaText"];

type Props = {
  section: RenderSection;
  /** Field keys declared for this section type (EditorSectionMeta.fields), used to know which text roles apply. */
  fieldKeys: string[];
  onUpdate: (id: string, patch: Partial<RenderSection>) => void;
};

const fieldClass = "border-border bg-[#120c1d] text-foreground placeholder:text-muted-foreground focus:border-[#8b5cf6] focus:ring-0 transition-colors";
const selectClass = "min-h-10 flex-1 rounded-md border border-[#494454] bg-[#120c1d] px-2 text-xs text-[#e9ddff] outline-none focus:border-[#8b5cf6]";

export function EditorStylePanel({ section, fieldKeys, onUpdate }: Props) {
  const textRoles = TEXT_STYLE_COVERED_TYPES.has(section.type)
    ? TEXT_ROLE_ORDER.filter((role) => fieldKeys.includes(role))
    : [];
  const roles: StyleRole[] = [...textRoles, "section"];
  const [active, setActive] = useState<StyleRole>(roles[0]);
  const role = roles.includes(active) ? active : roles[0];

  const overrides = normalizeOverridesMap(section.settings.styleOverrides);
  const current = overrides[role] ?? {};
  const hasOverride = Object.keys(current).length > 0;

  const update = (patch: Partial<ElementStyle>) => {
    const next = normalizeElementStyle({ ...current, ...patch });
    const nextOverrides = { ...overrides, [role]: next };
    if (!Object.keys(next).length) delete nextOverrides[role];
    onUpdate(section.id, { settings: { ...section.settings, styleOverrides: nextOverrides } });
  };
  const reset = () => {
    const nextOverrides = { ...overrides };
    delete nextOverrides[role];
    onUpdate(section.id, { settings: { ...section.settings, styleOverrides: nextOverrides } });
  };

  const isText = role !== "section";
  const isBox = role === "section" || role === "ctaText";
  const showAlign = role === "title" || role === "subtitle" || role === "body";

  return <fieldset className="space-y-3 rounded-lg border border-[#3d3549] bg-[#1d1a23] p-3">
    <legend className="px-1 text-xs font-semibold text-[#cbc3d7]">Estilo</legend>

    <div className="flex flex-wrap items-center gap-1.5">
      {roles.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => setActive(r)}
          className={cn(
            "flex min-h-8 items-center gap-1 rounded-md px-2.5 text-[11px] font-semibold transition-colors",
            r === role ? "bg-[#2c2141] text-[#c4b5fd]" : "bg-[#120c1d] text-[#958ea0] hover:text-[#cbc3d7]"
          )}
        >
          {ROLE_LABEL[r]}
          {Object.keys(overrides[r] ?? {}).length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6]" aria-hidden="true" />}
        </button>
      ))}
      {hasOverride && (
        <button type="button" onClick={reset} className="ml-auto flex min-h-8 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-[#958ea0] hover:text-[#cbc3d7]">
          <RotateCcw className="h-3 w-3" /> Restablecer
        </button>
      )}
    </div>

    {isText && (
      <ColorRow label="Color de texto" value={current.color} onChange={(value) => update({ color: value })} />
    )}
    {isBox && (
      <ColorRow label="Fondo" value={current.background} onChange={(value) => update({ background: value })} />
    )}

    {isText && (
      <div className="flex gap-2">
        <SelectRow label="Tamaño" value={current.fontSize ?? "md"} onChange={(value) => update({ fontSize: value as ElementStyle["fontSize"] })}
          options={[["sm", "Pequeño"], ["md", "Normal"], ["lg", "Grande"], ["xl", "Extra grande"], ["2xl", "Enorme"]]} />
        <SelectRow label="Peso" value={current.fontWeight ?? "normal"} onChange={(value) => update({ fontWeight: value as ElementStyle["fontWeight"] })}
          options={[["normal", "Normal"], ["medium", "Medio"], ["semibold", "Semi-negrita"], ["bold", "Negrita"], ["black", "Extra negrita"]]} />
      </div>
    )}

    {showAlign && (
      <SelectRow label="Alineación" value={current.align ?? "left"} onChange={(value) => update({ align: value as ElementStyle["align"] })}
        options={[["left", "Izquierda"], ["center", "Centro"], ["right", "Derecha"]]} />
    )}

    <SelectRow label="Espaciado" value={current.spacing ?? "normal"} onChange={(value) => update({ spacing: value as ElementStyle["spacing"] })}
      options={[["tight", "Compacto"], ["normal", "Normal"], ["loose", "Amplio"]]} />

    {isBox && <>
      <div className="flex gap-2">
        <SelectRow label="Borde" value={current.borderWidth ?? "none"} onChange={(value) => update({ borderWidth: value as ElementStyle["borderWidth"] })}
          options={[["none", "Sin borde"], ["thin", "Delgado"], ["thick", "Grueso"]]} />
        <SelectRow label="Radio" value={current.borderRadius ?? "md"} onChange={(value) => update({ borderRadius: value as ElementStyle["borderRadius"] })}
          options={[["none", "Recto"], ["sm", "Sutil"], ["md", "Normal"], ["lg", "Redondeado"], ["full", "Píldora"]]} />
      </div>
      {current.borderWidth && current.borderWidth !== "none" && (
        <ColorRow label="Color de borde" value={current.borderColor} onChange={(value) => update({ borderColor: value })} />
      )}
      <SelectRow label="Sombra" value={current.shadow ?? "none"} onChange={(value) => update({ shadow: value as ElementStyle["shadow"] })}
        options={[["none", "Sin sombra"], ["sm", "Sutil"], ["md", "Normal"], ["lg", "Pronunciada"]]} />
    </>}
  </fieldset>;
}

function normalizeOverridesMap(value: unknown): Partial<Record<StyleRole, ElementStyle>> {
  const raw = typeof value === "object" && value ? (value as Record<string, unknown>) : {};
  const result: Partial<Record<StyleRole, ElementStyle>> = {};
  for (const role of [...TEXT_ROLE_ORDER, "section"] as StyleRole[]) {
    const normalized = normalizeElementStyle(raw[role]);
    if (Object.keys(normalized).length) result[role] = normalized;
  }
  return result;
}

function ColorRow({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  const current = value ?? "#000000";
  return <div className="flex items-center gap-2">
    <Label className="w-24 shrink-0 text-xs text-[#958ea0]">{label}</Label>
    <input type="color" aria-label={`${label} — selector visual`} value={current} onChange={(event) => onChange(event.target.value)} className="h-10 w-10 shrink-0 cursor-pointer rounded border border-border bg-[#1d1a23] p-1" />
    <Input value={value ?? ""} placeholder="Heredado" aria-label={`${label} — valor hexadecimal`} onChange={(event) => onChange(event.target.value)} className={cn(fieldClass, "h-10 font-mono text-xs")} />
  </div>;
}

function SelectRow({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  return <label className="flex flex-1 items-center gap-2 text-xs text-[#958ea0]">
    <span className="w-24 shrink-0">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
      {options.map(([option, text]) => <option key={option} value={option}>{text}</option>)}
    </select>
  </label>;
}
