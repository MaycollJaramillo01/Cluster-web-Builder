"use client";
/* eslint-disable react-hooks/refs -- dnd-kit exposes callback refs and reactive transforms as hook results. */

import { useEffect, useMemo, useState } from "react";
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useDroppable, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical, Plus, Redo2, Save, Trash2 } from "lucide-react";

import { EditorMediaField } from "@/components/builder/EditorMediaField";
import { renderSiteV2 } from "@/lib/site/v2-render";
import {
  resolveContentSlot, setContentSlot, V2_WIDGET_TYPES,
  type CanvasColumnV2, type CanvasRowV2, type CanvasSectionV2, type SiteContentV2,
  type ThemeTokensV2, type V2ContentSlot, type V2TemplateId, type V2WidgetType, type WidgetV2,
} from "@/lib/site/v2-schema";
import { getAllTemplatesV2, SECTION_LIBRARY_V2 } from "@/lib/site/v2-templates";

type EditorSiteV2 = {
  id: string;
  templateId: V2TemplateId;
  content: SiteContentV2;
  design: ThemeTokensV2;
  sections: CanvasSectionV2[];
  status: string;
  publicSlug: string;
  publicUrl: string;
};

type Selection = { kind: "section" | "row" | "column" | "widget"; id: string } | null;
type DragData = { kind: "section" | "row" | "widget"; sectionId: string; rowId?: string; columnId?: string; id: string };
type DropData = Omit<DragData, "kind"> & { kind: DragData["kind"] | "column" };

const WIDGET_LABELS: Record<V2WidgetType, string> = {
  brand: "Marca", nav: "Navegación", heading: "Título", text: "Texto", image: "Imagen", video: "Video",
  button: "Botón", business_info: "Datos del negocio", list: "Lista", gallery: "Galería", testimonials: "Reseñas",
  accordion: "Acordeón", form: "Formulario", social: "Redes", map: "Mapa", divider: "Divisor", spacer: "Espacio",
};

export function SiteEditorV2({ initialSite }: { initialSite: EditorSiteV2 }) {
  const [content, setContent] = useState(initialSite.content);
  const [design, setDesign] = useState(initialSite.design);
  const [sections, setSections] = useState(initialSite.sections);
  const [templateId, setTemplateId] = useState(initialSite.templateId);
  const [region, setRegion] = useState<CanvasSectionV2["region"]>("main");
  const [selection, setSelection] = useState<Selection>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [undoRevision, setUndoRevision] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const draftKey = `cluster:v2-draft:${initialSite.id}`;

  useEffect(() => {
    const raw = localStorage.getItem(draftKey);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (draft.content && draft.design && Array.isArray(draft.sections)) queueMicrotask(() => {
        setContent(draft.content); setDesign(draft.design); setSections(draft.sections); setTemplateId(draft.templateId || initialSite.templateId);
        setDirty(true); setMessage("Recuperamos cambios sin guardar.");
      });
    } catch { localStorage.removeItem(draftKey); }
  }, [draftKey, initialSite.templateId]);

  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => localStorage.setItem(draftKey, JSON.stringify({ content, design, sections, templateId })), 3500);
    return () => clearTimeout(timer);
  }, [content, design, sections, templateId, dirty, draftKey]);

  const rendered = useMemo(() => renderSiteV2({
    content, design, sections, leadEndpoint: `/api/public/sites/${initialSite.publicSlug}/leads`,
  }), [content, design, sections, initialSite.publicSlug]);
  const regionSections = sections.filter((item) => item.region === region);
  const selectedWidget = findWidget(sections, selection?.kind === "widget" ? selection.id : "");
  const selectedColumn = findColumn(sections, selection?.kind === "column" ? selection.id : selectedWidget?.column.id || "");

  const mutateSections = (mutator: (draft: CanvasSectionV2[]) => CanvasSectionV2[]) => {
    setSections((current) => mutator(structuredClone(current)));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true); setMessage("");
    try {
      const response = await fetch(`/api/sites/${initialSite.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          builderVersion: 2, templateId, content, design, sections,
          site: { businessName: content.business.name, phone: content.business.phone || null, email: content.business.email || null, location: content.business.location || null },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo guardar.");
      setSections(data.sections); setDirty(false); localStorage.removeItem(draftKey); setMessage("Cambios guardados.");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "No se pudo guardar."); }
    finally { setSaving(false); }
  };

  const applyTemplate = async (nextId: V2TemplateId) => {
    if (nextId === templateId || !window.confirm("Verás una nueva composición. El contenido y los bloques personalizados se conservarán. ¿Continuar?")) return;
    const response = await fetch(`/api/sites/${initialSite.id}/template`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateId: nextId }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.error || "No se pudo cambiar la plantilla.");
    setTemplateId(data.templateId); setDesign(data.design); setSections(data.sections); setUndoRevision(data.revisionId); setSelection(null); setDirty(false);
    setMessage("Plantilla aplicada. Puedes deshacer este cambio.");
  };

  const undoTemplate = async () => {
    if (!undoRevision) return;
    const response = await fetch(`/api/sites/${initialSite.id}/revisions/${undoRevision}/restore`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.error || "No se pudo restaurar.");
    setTemplateId(data.templateId); setContent(data.content); setDesign(data.design); setSections(data.sections); setUndoRevision(data.revisionId); setDirty(false);
  };

  const addLibrarySection = (seed: Omit<CanvasSectionV2, "id">) => {
    const copy = cloneSection(seed);
    copy.region = region;
    mutateSections((draft) => {
      const footer = draft.findIndex((item) => item.region === "footer");
      draft.splice(region === "main" && footer >= 0 ? footer : draft.length, 0, copy);
      return draft;
    });
    setSelection({ kind: "section", id: copy.id });
  };

  const addRow = (sectionId: string, layout: number[]) => mutateSections((draft) => draft.map((section) => section.id === sectionId ? {
    ...section, rows: [...section.rows, { id: crypto.randomUUID(), columns: layout.map((span) => ({ id: crypto.randomUUID(), span: { desktop: span as CanvasColumnV2["span"]["desktop"], tablet: span > 6 ? 12 : span as CanvasColumnV2["span"]["tablet"], mobile: 12 }, widgets: [] })) }],
  } : section));

  const addWidget = (type: V2WidgetType) => {
    const target = selectedColumn || firstColumn(sections, region);
    if (!target) return setMessage("Selecciona una columna antes de agregar un widget.");
    const widget: WidgetV2 = { id: crypto.randomUUID(), type, data: defaultWidgetData(type) };
    mutateSections((draft) => updateColumn(draft, target.column.id, (column) => ({ ...column, widgets: [...column.widgets, widget] })));
    setSelection({ kind: "widget", id: widget.id });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = active.data.current as DragData | undefined;
    const to = over.data.current as DropData | undefined;
    if (!from || !to || from.kind !== to.kind && !(from.kind === "widget" && to.kind === "column")) return;
    mutateSections((draft) => reorderCanvas(draft, from, to));
  };

  return <main className="min-h-dvh bg-[#0d0a12] text-white">
    <header className="flex min-h-16 items-center justify-between border-b border-[#31283e] px-4">
      <div><b>Editor V2</b><span className="ml-3 text-xs text-[#a99db7]">{dirty ? "Cambios pendientes" : "Guardado"}</span></div>
      <div className="flex gap-2">
        {undoRevision && <button className="v2-editor-button" onClick={undoTemplate}><Redo2 className="h-4 w-4" /> Deshacer plantilla</button>}
        <button className="v2-editor-button bg-violet-600" disabled={saving} onClick={save}><Save className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar"}</button>
      </div>
    </header>
    {message && <p role="status" className="border-b border-[#31283e] bg-[#17111f] px-4 py-2 text-sm text-[#d7c9e8]">{message}</p>}
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className="grid min-h-[calc(100dvh-4rem)] grid-cols-1 xl:grid-cols-[330px_minmax(0,1fr)_330px]">
        <aside className="border-r border-[#31283e] bg-[#120e18] p-4">
          <div className="mb-5 grid grid-cols-3 gap-1 rounded-lg bg-[#21192b] p-1">
            {(["header", "main", "footer"] as const).map((item) => <button key={item} onClick={() => setRegion(item)} className={`min-h-10 rounded-md text-xs capitalize ${region === item ? "bg-violet-600" : "text-[#b8adc5]"}`}>{item}</button>)}
          </div>
          <h2 className="v2-editor-label">Plantillas completas</h2>
          <div className="mb-6 grid grid-cols-2 gap-2">{getAllTemplatesV2().map((template) => <button key={template.id} onClick={() => applyTemplate(template.id)} className={`rounded-lg border p-3 text-left text-xs ${templateId === template.id ? "border-violet-500 bg-violet-500/10" : "border-[#3b3048]"}`}><b className="block text-sm">{template.name}</b>{template.description}</button>)}</div>
          {region === "main" && <><h2 className="v2-editor-label">Biblioteca de secciones</h2><div className="mb-6 grid gap-2">{SECTION_LIBRARY_V2.map((section) => <button key={section.key} className="v2-editor-add" onClick={() => addLibrarySection(section)}><Plus className="h-4 w-4" />{section.name}</button>)}</div></>}
          <h2 className="v2-editor-label">Estructura</h2>
          <SortableContext items={regionSections.map((section) => `section:${section.id}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">{regionSections.map((section) => <SectionTree key={section.id} section={section} selection={selection} setSelection={setSelection} addRow={addRow} mutate={mutateSections} />)}</div>
          </SortableContext>
          <h2 className="v2-editor-label mt-6">Widgets</h2>
          <div className="grid grid-cols-2 gap-2">{V2_WIDGET_TYPES.map((type) => <button key={type} className="v2-editor-add" onClick={() => addWidget(type)}><Plus className="h-3.5 w-3.5" />{WIDGET_LABELS[type]}</button>)}</div>
        </aside>

        <section className="min-w-0 bg-[#201927] p-3 sm:p-6">
          <div className="mx-auto h-[calc(100dvh-8rem)] max-w-[1440px] overflow-hidden rounded-xl border border-[#453653] bg-white shadow-2xl">
            <iframe title="Vista previa real del sitio" className="h-full w-full" srcDoc={rendered.html} />
          </div>
        </section>

        <aside className="border-l border-[#31283e] bg-[#120e18] p-4">
          <Inspector
            siteId={initialSite.id} content={content} setContent={(next) => { setContent(next); setDirty(true); }}
            design={design} setDesign={(next) => { setDesign(next); setDirty(true); }}
            selected={selectedWidget} column={selectedColumn}
            mutate={mutateSections}
          />
        </aside>
      </div>
    </DndContext>
    <style jsx global>{`
      .v2-editor-label{display:block;margin-bottom:.6rem;font-size:.7rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#a78bfa}
      .v2-editor-button,.v2-editor-add{display:flex;min-height:2.5rem;align-items:center;justify-content:center;gap:.4rem;border:1px solid #443650;border-radius:.5rem;padding:.5rem .75rem;font-size:.75rem}
      .v2-editor-add{justify-content:flex-start;text-align:left;color:#d9cee4;background:#1b1522}
      .v2-field{width:100%;min-height:2.75rem;border:1px solid #443650;border-radius:.5rem;background:#1b1522;padding:.65rem;color:white;font-size:.85rem}
    `}</style>
  </main>;
}

function SectionTree({ section, selection, setSelection, addRow, mutate }: {
  section: CanvasSectionV2; selection: Selection; setSelection: (value: Selection) => void;
  addRow: (id: string, layout: number[]) => void; mutate: (fn: (draft: CanvasSectionV2[]) => CanvasSectionV2[]) => void;
}) {
  const sortable = useSortable({ id: `section:${section.id}`, data: { kind: "section", sectionId: section.id, id: section.id } satisfies DragData });
  return <div ref={sortable.setNodeRef} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }} className="rounded-lg border border-[#3a2e46] bg-[#19131f] p-2">
    <div className="flex items-center gap-1">
      <button {...sortable.attributes} {...sortable.listeners} className="p-2 text-[#8f819e]" aria-label="Arrastrar sección"><GripVertical className="h-4 w-4" /></button>
      <button className={`flex-1 text-left text-sm ${selection?.id === section.id ? "text-violet-300" : ""}`} onClick={() => setSelection({ kind: "section", id: section.id })}>{section.name}</button>
      {section.region === "main" && <button title="Eliminar sección" className="p-2" onClick={() => mutate((draft) => draft.filter((item) => item.id !== section.id))}><Trash2 className="h-4 w-4" /></button>}
    </div>
    <SortableContext items={section.rows.map((row) => `row:${row.id}`)} strategy={verticalListSortingStrategy}>
      <div className="space-y-2 pl-4">{section.rows.map((row) => <RowTree key={row.id} sectionId={section.id} row={row} selection={selection} setSelection={setSelection} mutate={mutate} />)}</div>
    </SortableContext>
    <div className="mt-2 flex gap-1 pl-4">{[[12], [6, 6], [4, 4, 4], [8, 4]].map((layout) => <button key={layout.join("-")} className="rounded border border-[#40344a] px-2 py-1 text-[10px]" onClick={() => addRow(section.id, layout)}>{layout.join("+")}</button>)}</div>
  </div>;
}

function RowTree({ sectionId, row, selection, setSelection, mutate }: { sectionId: string; row: CanvasRowV2; selection: Selection; setSelection: (value: Selection) => void; mutate: (fn: (draft: CanvasSectionV2[]) => CanvasSectionV2[]) => void }) {
  const sortable = useSortable({ id: `row:${row.id}`, data: { kind: "row", sectionId, rowId: row.id, id: row.id } satisfies DragData });
  return <div ref={sortable.setNodeRef} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }} className="rounded border border-[#33283d] p-1.5">
    <div className="mb-1 flex items-center text-[11px] text-[#9d91aa]"><button {...sortable.attributes} {...sortable.listeners} className="p-1"><GripVertical className="h-3 w-3" /></button><button onClick={() => setSelection({ kind: "row", id: row.id })}>Fila</button><button className="ml-auto p-1" onClick={() => mutate((draft) => draft.map((section) => section.id === sectionId ? { ...section, rows: section.rows.filter((item) => item.id !== row.id) } : section))}><Trash2 className="h-3 w-3" /></button></div>
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${row.columns.length},minmax(0,1fr))` }}>{row.columns.map((column) => <ColumnTree key={column.id} sectionId={sectionId} rowId={row.id} column={column} selection={selection} setSelection={setSelection} mutate={mutate} />)}</div>
  </div>;
}

function ColumnTree({ sectionId, rowId, column, selection, setSelection, mutate }: { sectionId: string; rowId: string; column: CanvasColumnV2; selection: Selection; setSelection: (value: Selection) => void; mutate: (fn: (draft: CanvasSectionV2[]) => CanvasSectionV2[]) => void }) {
  const drop = useDroppable({ id: `column:${column.id}`, data: { kind: "column", sectionId, rowId, columnId: column.id, id: column.id } });
  return <div ref={drop.setNodeRef} className={`min-w-0 rounded border p-1 ${selection?.id === column.id ? "border-violet-500" : drop.isOver ? "border-violet-400 bg-violet-500/10" : "border-[#42344e]"}`}>
    <button className="mb-1 block w-full text-left text-[9px] text-[#81758d]" onClick={() => setSelection({ kind: "column", id: column.id })}>{column.span.desktop}/12</button>
    <SortableContext items={column.widgets.map((widget) => `widget:${widget.id}`)} strategy={verticalListSortingStrategy}>{column.widgets.map((widget, index) => <WidgetTree key={widget.id} widget={widget} index={index} sectionId={sectionId} rowId={rowId} columnId={column.id} selection={selection} setSelection={setSelection} mutate={mutate} />)}</SortableContext>
    {!column.widgets.length && <span className="block py-2 text-center text-[9px] text-[#6e6279]">Soltar aquí</span>}
  </div>;
}

function WidgetTree({ widget, index, sectionId, rowId, columnId, selection, setSelection, mutate }: { widget: WidgetV2; index: number; sectionId: string; rowId: string; columnId: string; selection: Selection; setSelection: (value: Selection) => void; mutate: (fn: (draft: CanvasSectionV2[]) => CanvasSectionV2[]) => void }) {
  const sortable = useSortable({ id: `widget:${widget.id}`, data: { kind: "widget", sectionId, rowId, columnId, id: widget.id } satisfies DragData });
  const move = (direction: -1 | 1) => mutate((draft) => updateColumn(draft, columnId, (column) => ({ ...column, widgets: moveAt(column.widgets, index, index + direction) })));
  return <div ref={sortable.setNodeRef} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }} className={`mb-1 flex items-center rounded bg-[#241b2c] text-[10px] ${selection?.id === widget.id ? "ring-1 ring-violet-500" : ""}`}>
    <button {...sortable.attributes} {...sortable.listeners} className="p-1"><GripVertical className="h-3 w-3" /></button><button className="min-w-0 flex-1 truncate text-left" onClick={() => setSelection({ kind: "widget", id: widget.id })}>{WIDGET_LABELS[widget.type]}</button>
    <button aria-label="Subir" className="p-1" disabled={index === 0} onClick={() => move(-1)}><ChevronUp className="h-3 w-3" /></button><button aria-label="Bajar" className="p-1" onClick={() => move(1)}><ChevronDown className="h-3 w-3" /></button>
    <button aria-label="Eliminar" className="p-1" onClick={() => mutate((draft) => updateColumn(draft, columnId, (column) => ({ ...column, widgets: column.widgets.filter((item) => item.id !== widget.id) })))}><Trash2 className="h-3 w-3" /></button>
  </div>;
}

function Inspector({ siteId, content, setContent, design, setDesign, selected, column, mutate }: { siteId: string; content: SiteContentV2; setContent: (value: SiteContentV2) => void; design: ThemeTokensV2; setDesign: (value: ThemeTokensV2) => void; selected: ReturnType<typeof findWidget>; column: ReturnType<typeof findColumn>; mutate: (fn: (draft: CanvasSectionV2[]) => CanvasSectionV2[]) => void }) {
  const [improving, setImproving] = useState(false);
  const [aiError, setAiError] = useState("");
  if (!selected && !column) return <><h2 className="v2-editor-label">Diseño global</h2>{(["primary", "secondary", "accent", "background", "text", "muted"] as const).map((key) => <label key={key} className="mb-3 flex items-center justify-between text-xs capitalize">{key}<input type="color" value={design[key]} onChange={(event) => setDesign({ ...design, [key]: event.target.value })} /></label>)}</>;
  if (!selected && column) return <><h2 className="v2-editor-label">Columna</h2>{(["desktop", "tablet"] as const).map((breakpoint) => <label key={breakpoint} className="mb-3 block text-xs capitalize">Ancho {breakpoint}<select className="v2-field mt-1" value={column.column.span[breakpoint]} onChange={(event) => mutate((draft) => updateColumn(draft, column.column.id, (item) => ({ ...item, span: { ...item.span, [breakpoint]: Number(event.target.value) } as CanvasColumnV2["span"] })))}>{[1,2,3,4,5,6,7,8,9,12].map((value) => <option key={value} value={value}>{value}/12</option>)}</select></label>)}</>;
  if (!selected) return null;
  const widget = selected.widget;
  const value = widget.slot ? resolveContentSlot(content, widget.slot) : widget.data?.text || widget.data?.src || "";
  const updateWidget = (patch: Partial<WidgetV2>) => mutate((draft) => updateWidgetById(draft, widget.id, (item) => ({ ...item, ...patch })));
  const stringValue = typeof value === "string" ? value : "";
  const improve = async () => {
    if (!widget.slot || typeof value !== "string") return;
    setImproving(true); setAiError("");
    const response = await fetch(`/api/sites/${siteId}/improve-content`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slot: widget.slot, currentValue: value }) });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.value) setContent(setContentSlot(content, widget.slot, data.value));
    else setAiError(data.error || "No se pudo mejorar el texto.");
    setImproving(false);
  };
  return <>
    <h2 className="v2-editor-label">{WIDGET_LABELS[widget.type]}</h2>
    {widget.slot && typeof value === "string" && <label className="mb-4 block text-xs">Contenido<textarea className="v2-field mt-1 min-h-28" value={stringValue} onChange={(event) => setContent(setContentSlot(content, widget.slot as V2ContentSlot, event.target.value))} /><button type="button" disabled={improving} onClick={improve} className="mt-2 min-h-10 rounded-md border border-violet-500 px-3 text-xs text-violet-200">{improving ? "Mejorando…" : "Mejorar con IA"}</button>{aiError && <span className="mt-2 block text-red-300">{aiError}</span>}</label>}
    {!widget.slot && ["heading", "text", "button"].includes(widget.type) && <label className="mb-4 block text-xs">Contenido<textarea className="v2-field mt-1" value={stringValue} onChange={(event) => updateWidget({ data: { ...widget.data, text: event.target.value } })} /></label>}
    {(widget.type === "image" || widget.type === "video") && !widget.slot && <EditorMediaField siteId={siteId} kind={widget.type} value={String(widget.data?.src || "")} onChange={(src) => updateWidget({ data: { ...widget.data, src } })} onUsageChange={() => undefined} />}
    <label className="mb-4 block text-xs">Variante<input className="v2-field mt-1" value={widget.variant || ""} onChange={(event) => updateWidget({ variant: event.target.value.slice(0, 40) })} /></label>
    <h3 className="v2-editor-label mt-5">Estilo cerrado</h3>
    <label className="mb-3 block text-xs">Alineación<select className="v2-field mt-1" value={widget.style?.desktop?.align || "left"} onChange={(event) => updateWidget({ style: { ...widget.style, desktop: { ...widget.style?.desktop, align: event.target.value as "left" | "center" | "right" } } })}><option>left</option><option>center</option><option>right</option></select></label>
    <label className="mb-3 block text-xs">Espaciado<select className="v2-field mt-1" value={widget.style?.desktop?.padding || "none"} onChange={(event) => updateWidget({ style: { ...widget.style, desktop: { ...widget.style?.desktop, padding: event.target.value as "none" | "sm" | "md" | "lg" | "xl" } } })}><option>none</option><option>sm</option><option>md</option><option>lg</option><option>xl</option></select></label>
  </>;
}

function cloneSection(seed: Omit<CanvasSectionV2, "id">): CanvasSectionV2 {
  const section = structuredClone(seed) as CanvasSectionV2; section.id = crypto.randomUUID();
  section.rows = section.rows.map((row) => ({ ...row, id: crypto.randomUUID(), columns: row.columns.map((column) => ({ ...column, id: crypto.randomUUID(), widgets: column.widgets.map((widget) => ({ ...widget, id: crypto.randomUUID() })) })) }));
  return section;
}
function defaultWidgetData(type: V2WidgetType): Record<string, unknown> { return type === "image" || type === "video" ? { src: "", alt: "" } : type === "nav" ? { items: [] } : { text: WIDGET_LABELS[type] }; }
function firstColumn(sections: CanvasSectionV2[], region: CanvasSectionV2["region"]) { const section = sections.find((item) => item.region === region); const column = section?.rows[0]?.columns[0]; return section && column ? { section, row: section.rows[0], column } : null; }
function findWidget(sections: CanvasSectionV2[], id: string) { for (const section of sections) for (const row of section.rows) for (const column of row.columns) { const widget = column.widgets.find((item) => item.id === id); if (widget) return { section, row, column, widget }; } return null; }
function findColumn(sections: CanvasSectionV2[], id: string) { for (const section of sections) for (const row of section.rows) { const column = row.columns.find((item) => item.id === id); if (column) return { section, row, column }; } return null; }
function updateColumn(sections: CanvasSectionV2[], id: string, update: (column: CanvasColumnV2) => CanvasColumnV2) { return sections.map((section) => ({ ...section, rows: section.rows.map((row) => ({ ...row, columns: row.columns.map((column) => column.id === id ? update(column) : column) })) })); }
function updateWidgetById(sections: CanvasSectionV2[], id: string, update: (widget: WidgetV2) => WidgetV2) { return sections.map((section) => ({ ...section, rows: section.rows.map((row) => ({ ...row, columns: row.columns.map((column) => ({ ...column, widgets: column.widgets.map((widget) => widget.id === id ? update(widget) : widget) })) })) })); }
function moveAt<T>(items: T[], from: number, to: number) { if (to < 0 || to >= items.length) return items; const next = [...items]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next; }
function reorderCanvas(sections: CanvasSectionV2[], from: DragData, to: DropData) {
  if (from.kind === "section" && to.kind === "section") { const a = sections.findIndex((item) => item.id === from.id); const b = sections.findIndex((item) => item.id === to.id); return a >= 0 && b >= 0 && sections[a].region === sections[b].region ? moveAt(sections, a, b) : sections; }
  if (from.kind === "row" && to.kind === "row" && from.sectionId === to.sectionId) return sections.map((section) => section.id !== from.sectionId ? section : { ...section, rows: moveAt(section.rows, section.rows.findIndex((item) => item.id === from.id), section.rows.findIndex((item) => item.id === to.id)) });
  if (from.kind === "widget") {
    const source = findWidget(sections, from.id); if (!source) return sections;
    const destination = to.kind === "column" ? findColumn(sections, to.id) : findWidget(sections, to.id); if (!destination) return sections;
    const targetColumn = destination.column; const targetIndex = to.kind === "column" ? targetColumn.widgets.length : targetColumn.widgets.findIndex((item) => item.id === to.id);
    let next = updateColumn(sections, source.column.id, (column) => ({ ...column, widgets: column.widgets.filter((item) => item.id !== from.id) }));
    next = updateColumn(next, targetColumn.id, (column) => { const widgets = [...column.widgets]; widgets.splice(Math.max(0, targetIndex), 0, source.widget); return { ...column, widgets }; });
    return next;
  }
  return sections;
}
