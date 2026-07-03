"use client";
/* eslint-disable react-hooks/refs -- dnd-kit exposes callback refs and reactive transforms as hook results. */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useDroppable, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft, ChevronDown, ChevronLeft, ChevronUp, ExternalLink, GripVertical, Layers, LayoutTemplate,
  Monitor, Palette, Plus, Redo2, Save, Smartphone, Trash2,
} from "lucide-react";

import { V2WidgetSettings } from "@/components/builder/V2WidgetSettings";
import { renderSiteV2 } from "@/lib/site/v2-render";
import {
  V2_WIDGET_TYPES,
  type CanvasColumnV2, type CanvasRowV2, type CanvasSectionV2, type SiteContentV2,
  type ThemeTokensV2, type V2TemplateId, type V2WidgetType, type WidgetV2,
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
type PanelTab = "add" | "structure" | "design";

const WIDGET_LABELS: Record<V2WidgetType, string> = {
  brand: "Marca", nav: "Navegación", heading: "Título", text: "Texto", image: "Imagen", video: "Video",
  button: "Botón", business_info: "Datos del negocio", list: "Lista", gallery: "Galería", testimonials: "Reseñas",
  accordion: "Acordeón", form: "Formulario", social: "Redes", map: "Mapa", divider: "Divisor", spacer: "Espacio",
  embed: "Código insertado",
};

const REGION_LABELS: Record<CanvasSectionV2["region"], string> = {
  header: "Encabezado", main: "Contenido", footer: "Pie de página",
};

const COLOR_LABELS: Record<keyof Pick<ThemeTokensV2, "primary" | "secondary" | "accent" | "background" | "text" | "muted">, string> = {
  primary: "Color principal", secondary: "Color secundario", accent: "Color de acento",
  background: "Fondo", text: "Texto", muted: "Texto suave",
};

const ROW_LAYOUTS: { layout: number[]; label: string }[] = [
  { layout: [12], label: "1 columna" },
  { layout: [6, 6], label: "2 columnas" },
  { layout: [4, 4, 4], label: "3 columnas" },
  { layout: [8, 4], label: "Ancha + angosta" },
];

export function SiteEditorV2({ initialSite }: { initialSite: EditorSiteV2 }) {
  const [content, setContent] = useState(initialSite.content);
  const [design, setDesign] = useState(initialSite.design);
  const [sections, setSections] = useState(initialSite.sections);
  const [templateId, setTemplateId] = useState(initialSite.templateId);
  const [region, setRegion] = useState<CanvasSectionV2["region"]>("main");
  const [selection, setSelection] = useState<Selection>(null);
  const [tab, setTab] = useState<PanelTab>("add");
  const [pane, setPane] = useState<"edit" | "preview">("preview");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [undoRevision, setUndoRevision] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const selectionFromCanvasRef = useRef(false);
  const selectionRef = useRef<Selection>(null);
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

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  // Clics dentro del lienzo (iframe): seleccionan el elemento y abren sus ajustes en el panel.
  useEffect(() => {
    const onCanvasMessage = (event: MessageEvent) => {
      const data = event.data as { source?: string; kind?: string; id?: string } | null;
      if (!data || data.source !== "cluster-canvas") return;
      if (data.kind === "ready") {
        const active = selectionRef.current;
        iframeRef.current?.contentWindow?.postMessage({ source: "cluster-editor", type: "select", id: active?.id || null, scroll: false }, "*");
        return;
      }
      if (!data.id || (data.kind !== "widget" && data.kind !== "column" && data.kind !== "section")) return;
      selectionFromCanvasRef.current = true;
      setSelection({ kind: data.kind, id: data.id });
      setPane("edit");
    };
    window.addEventListener("message", onCanvasMessage);
    return () => window.removeEventListener("message", onCanvasMessage);
  }, []);

  // Selección hecha desde el panel: se refleja en el lienzo (contorno + scroll hasta el elemento).
  useEffect(() => {
    selectionRef.current = selection;
    const fromCanvas = selectionFromCanvasRef.current;
    selectionFromCanvasRef.current = false;
    iframeRef.current?.contentWindow?.postMessage({ source: "cluster-editor", type: "select", id: selection?.id || null, scroll: !fromCanvas }, "*");
  }, [selection]);

  const rendered = useMemo(() => renderSiteV2({
    content, design, sections, leadEndpoint: `/api/public/sites/${initialSite.publicSlug}/leads`, editable: true,
  }), [content, design, sections, initialSite.publicSlug]);
  const regionSections = sections.filter((item) => item.region === region);
  const selectedWidget = findWidget(sections, selection?.kind === "widget" ? selection.id : "");
  const selectedColumn = findColumn(sections, selection?.kind === "column" ? selection.id : selectedWidget?.column.id || "");
  const selectedSection = selection?.kind === "section" ? sections.find((item) => item.id === selection.id) || null : null;
  const selectedRow = selection?.kind === "row" ? findRow(sections, selection.id) : null;

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
    copy.region = "main";
    mutateSections((draft) => {
      const footer = draft.findIndex((item) => item.region === "footer");
      draft.splice(footer >= 0 ? footer : draft.length, 0, copy);
      return draft;
    });
    setRegion("main");
    setSelection({ kind: "section", id: copy.id });
    setMessage(`Sección "${seed.name}" agregada.`);
  };

  const addRow = (sectionId: string, layout: number[]) => mutateSections((draft) => draft.map((section) => section.id === sectionId ? {
    ...section, rows: [...section.rows, { id: crypto.randomUUID(), columns: layout.map((span) => ({ id: crypto.randomUUID(), span: { desktop: span as CanvasColumnV2["span"]["desktop"], tablet: span > 6 ? 12 : span as CanvasColumnV2["span"]["tablet"], mobile: 12 }, widgets: [] })) }],
  } : section));

  const addWidget = (type: V2WidgetType) => {
    const target = selectedColumn || firstColumn(sections, region);
    if (!target) return setMessage("Haz clic en una columna del sitio antes de agregar un widget.");
    const widget: WidgetV2 = { id: crypto.randomUUID(), type, data: defaultWidgetData(type) };
    mutateSections((draft) => updateColumn(draft, target.column.id, (column) => ({ ...column, widgets: [...column.widgets, widget] })));
    setSelection({ kind: "widget", id: widget.id });
  };

  const deleteSelection = () => {
    if (!selection) return;
    const { kind, id } = selection;
    if (kind === "section") mutateSections((draft) => draft.filter((item) => item.id !== id));
    if (kind === "row") mutateSections((draft) => draft.map((section) => ({ ...section, rows: section.rows.filter((row) => row.id !== id) })));
    if (kind === "widget") mutateSections((draft) => draft.map((section) => ({ ...section, rows: section.rows.map((row) => ({ ...row, columns: row.columns.map((column) => ({ ...column, widgets: column.widgets.filter((widget) => widget.id !== id) })) })) })));
    setSelection(null);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = active.data.current as DragData | undefined;
    const to = over.data.current as DropData | undefined;
    if (!from || !to || from.kind !== to.kind && !(from.kind === "widget" && to.kind === "column")) return;
    mutateSections((draft) => reorderCanvas(draft, from, to));
  };

  const panelTabs: { id: PanelTab; label: string; icon: typeof Plus }[] = [
    { id: "add", label: "Agregar", icon: Plus },
    { id: "structure", label: "Estructura", icon: Layers },
    { id: "design", label: "Diseño", icon: Palette },
  ];

  const selectionTitle = selection?.kind === "widget" && selectedWidget ? WIDGET_LABELS[selectedWidget.widget.type]
    : selection?.kind === "column" ? "Columna"
    : selection?.kind === "row" ? "Fila"
    : selectedSection ? selectedSection.name
    : "";

  return <main className="flex h-dvh flex-col bg-zinc-100 text-zinc-900">
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/dashboard" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" aria-label="Volver al panel">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{content.business.name || "Mi sitio"}</p>
          <p className="text-xs leading-tight text-zinc-500">{dirty ? "Cambios sin guardar" : "Todo guardado"}</p>
        </div>
      </div>
      <div className="flex lg:hidden items-center rounded-lg bg-zinc-100 p-1" role="tablist" aria-label="Vista del editor">
        {([["edit", "Panel"], ["preview", "Sitio"]] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={pane === id} onClick={() => setPane(id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${pane === id ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {undoRevision && <button className="v2-btn" onClick={undoTemplate}><Redo2 className="h-4 w-4" /><span className="hidden sm:inline">Deshacer plantilla</span></button>}
        {initialSite.status === "PUBLISHED" && initialSite.publicUrl && (
          <a href={initialSite.publicUrl} target="_blank" rel="noreferrer" className="v2-btn"><ExternalLink className="h-4 w-4" /><span className="hidden sm:inline">Ver sitio</span></a>
        )}
        <button className="v2-btn border-violet-600 bg-violet-600 text-white hover:bg-violet-700" disabled={saving} onClick={save}>
          <Save className="h-4 w-4" />{saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </header>

    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)]">

        <aside className={`${pane === "edit" ? "flex" : "hidden"} min-h-0 flex-col border-r border-zinc-200 bg-white lg:flex`}>
          {selection ? (
            <>
              <div className="flex shrink-0 items-center gap-1 border-b border-zinc-200 px-2 py-2">
                <button className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" aria-label="Volver" onClick={() => setSelection(null)}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">{selectionTitle}</p>
                {(selection.kind === "widget" || selection.kind === "row" || (selectedSection && selectedSection.region === "main")) && (
                  <button className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-600" aria-label="Eliminar" title="Eliminar" onClick={deleteSelection}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <SelectionPanel
                  siteId={initialSite.id} content={content} setContent={(next) => { setContent(next); setDirty(true); }}
                  selection={selection} selectedWidget={selectedWidget} selectedColumn={selectedColumn}
                  selectedSection={selectedSection} selectedRow={selectedRow}
                  addRow={addRow} mutate={mutateSections}
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid shrink-0 grid-cols-3 border-b border-zinc-200" role="tablist" aria-label="Herramientas">
                {panelTabs.map(({ id, label, icon: Icon }) => (
                  <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                    className={`flex min-h-12 flex-col items-center justify-center gap-0.5 text-xs font-medium ${tab === id ? "border-b-2 border-violet-600 text-violet-700" : "text-zinc-500 hover:text-zinc-800"}`}>
                    <Icon className="h-4 w-4" />{label}
                  </button>
                ))}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {tab === "add" && <>
                  <p className="mb-4 rounded-lg bg-violet-50 p-3 text-xs leading-relaxed text-violet-900">Haz clic en cualquier parte del sitio a la derecha para editarla. Desde aquí puedes agregar secciones nuevas.</p>
                  <h2 className="v2-label">Secciones listas para usar</h2>
                  <div className="mb-6 mt-2 grid gap-2">
                    {SECTION_LIBRARY_V2.map((section) => (
                      <button key={section.key} className="v2-add" onClick={() => addLibrarySection(section)}>
                        <Plus className="h-4 w-4 shrink-0 text-violet-600" />{section.name}
                      </button>
                    ))}
                  </div>
                  <h2 className="v2-label">Widgets</h2>
                  <p className="mb-3 text-xs text-zinc-500">Elementos sueltos. Haz clic primero en una columna del sitio y luego en el widget.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {V2_WIDGET_TYPES.map((type) => (
                      <button key={type} className="v2-add" onClick={() => addWidget(type)}>
                        <Plus className="h-3.5 w-3.5 shrink-0 text-violet-600" />{WIDGET_LABELS[type]}
                      </button>
                    ))}
                  </div>
                </>}

                {tab === "structure" && <>
                  <h2 className="v2-label">Parte de la página</h2>
                  <div className="mb-4 mt-2 grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1">
                    {(["header", "main", "footer"] as const).map((item) => (
                      <button key={item} onClick={() => setRegion(item)}
                        className={`min-h-9 rounded-md px-1 text-xs font-medium ${region === item ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}>
                        {REGION_LABELS[item]}
                      </button>
                    ))}
                  </div>
                  <p className="mb-3 text-xs text-zinc-500">Arrastra para reordenar. Haz clic en un elemento para editarlo.</p>
                  {regionSections.length === 0 && (
                    <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-xs text-zinc-500">
                      Aún no hay secciones aquí. Ve a la pestaña Agregar para sumar una.
                    </p>
                  )}
                  <SortableContext items={regionSections.map((section) => `section:${section.id}`)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">{regionSections.map((section) => <SectionTree key={section.id} section={section} selection={selection} setSelection={setSelection} mutate={mutateSections} />)}</div>
                  </SortableContext>
                </>}

                {tab === "design" && <>
                  <h2 className="v2-label">Plantilla</h2>
                  <p className="mb-3 text-xs text-zinc-500">Cambia la composición completa. Tu contenido se conserva.</p>
                  <div className="mb-6 grid gap-2">
                    {getAllTemplatesV2().map((template) => (
                      <button key={template.id} onClick={() => applyTemplate(template.id)}
                        className={`rounded-lg border p-3 text-left text-xs leading-relaxed ${templateId === template.id ? "border-violet-600 bg-violet-50 text-zinc-900" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"}`}>
                        <span className="mb-0.5 flex items-center gap-1.5 text-sm font-semibold text-zinc-900"><LayoutTemplate className="h-3.5 w-3.5 text-violet-600" />{template.name}</span>
                        {template.description}
                      </button>
                    ))}
                  </div>
                  <h2 className="v2-label">Colores del sitio</h2>
                  <p className="mb-3 text-xs text-zinc-500">Se aplican a todo el sitio publicado.</p>
                  <div className="grid gap-2">
                    {(Object.keys(COLOR_LABELS) as (keyof typeof COLOR_LABELS)[]).map((key) => (
                      <label key={key} className="flex min-h-11 cursor-pointer items-center justify-between rounded-lg border border-zinc-200 px-3 text-xs font-medium">
                        {COLOR_LABELS[key]}
                        <span className="flex items-center gap-2 text-zinc-500">
                          {design[key]}
                          <input type="color" className="h-7 w-9 cursor-pointer rounded border border-zinc-200" value={design[key]} onChange={(event) => { setDesign({ ...design, [key]: event.target.value }); setDirty(true); }} />
                        </span>
                      </label>
                    ))}
                  </div>
                </>}
              </div>
            </>
          )}
        </aside>

        <section className={`${pane === "preview" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col lg:flex`}>
          <div className="flex h-11 shrink-0 items-center justify-center gap-1 border-b border-zinc-200 bg-white/60">
            {([["desktop", Monitor, "Escritorio"], ["mobile", Smartphone, "Móvil"]] as const).map(([id, Icon, label]) => (
              <button key={id} onClick={() => setDevice(id)} aria-label={`Vista previa en ${label.toLowerCase()}`} aria-pressed={device === id}
                className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium ${device === id ? "bg-zinc-200 text-zinc-900" : "text-zinc-500 hover:text-zinc-800"}`}>
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-6">
            <div className={`mx-auto h-full overflow-hidden rounded-xl border border-zinc-300 bg-white shadow-lg transition-[max-width] ${device === "mobile" ? "max-w-[400px]" : "max-w-[1440px]"}`}>
              <iframe ref={iframeRef} title="Vista previa del sitio, haz clic para editar" className="h-full w-full" srcDoc={rendered.html} />
            </div>
          </div>
        </section>
      </div>
    </DndContext>

    {message && (
      <p role="status" className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
        {message}
      </p>
    )}

    <style jsx global>{`
      .v2-label{display:block;margin-bottom:.35rem;font-size:.8rem;font-weight:700;color:#18181b}
      .v2-btn{display:flex;min-height:2.25rem;align-items:center;justify-content:center;gap:.4rem;border:1px solid #e4e4e7;border-radius:.5rem;padding:.4rem .75rem;font-size:.75rem;font-weight:500;color:#3f3f46;background:#fff}
      .v2-btn:hover{background:#fafafa}
      .v2-btn:disabled{opacity:.6}
      .v2-add{display:flex;min-height:2.5rem;align-items:center;gap:.5rem;border:1px solid #e4e4e7;border-radius:.5rem;padding:.5rem .75rem;font-size:.75rem;font-weight:500;text-align:left;color:#3f3f46;background:#fff}
      .v2-add:hover{border-color:#c4b5fd;background:#f5f3ff}
      .v2-field{width:100%;min-height:2.75rem;border:1px solid #d4d4d8;border-radius:.5rem;background:#fff;padding:.65rem;color:#18181b;font-size:.85rem}
      .v2-field:focus{outline:2px solid #7c3aed;outline-offset:1px}
    `}</style>
  </main>;
}

function SelectionPanel({ siteId, content, setContent, selection, selectedWidget, selectedColumn, selectedSection, selectedRow, addRow, mutate }: {
  siteId: string; content: SiteContentV2; setContent: (value: SiteContentV2) => void;
  selection: NonNullable<Selection>;
  selectedWidget: ReturnType<typeof findWidget>; selectedColumn: ReturnType<typeof findColumn>;
  selectedSection: CanvasSectionV2 | null; selectedRow: ReturnType<typeof findRow>;
  addRow: (id: string, layout: number[]) => void;
  mutate: (fn: (draft: CanvasSectionV2[]) => CanvasSectionV2[]) => void;
}) {
  if (selection.kind === "section" && selectedSection) return <>
    <p className="mb-4 text-xs leading-relaxed text-zinc-500">Haz clic en un texto, imagen o botón dentro de la sección para editarlo directamente.</p>
    <h3 className="v2-label">Agregar fila a esta sección</h3>
    <div className="mt-2 grid gap-2">
      {ROW_LAYOUTS.map(({ layout, label }) => (
        <button key={label} className="v2-add" onClick={() => addRow(selectedSection.id, layout)}><Plus className="h-4 w-4 shrink-0 text-violet-600" />{label}</button>
      ))}
    </div>
    <p className="mt-4 text-xs text-zinc-500">Para mover la sección, usa la pestaña Estructura y arrástrala.</p>
  </>;

  if (selection.kind === "row" && selectedRow) return <>
    <p className="mb-4 text-xs leading-relaxed text-zinc-500">Una fila agrupa columnas. Haz clic en una columna del sitio para ajustar su ancho o agregarle widgets.</p>
    <p className="text-xs text-zinc-500">Esta fila tiene {selectedRow.row.columns.length} {selectedRow.row.columns.length === 1 ? "columna" : "columnas"}.</p>
  </>;

  if (selection.kind === "column" && selectedColumn) return <>
    <p className="mb-3 text-xs leading-relaxed text-zinc-500">Define cuánto espacio ocupa la columna (de 12 partes disponibles).</p>
    {(["desktop", "tablet"] as const).map((breakpoint) => <label key={breakpoint} className="mb-3 block text-xs font-medium">
      Ancho en {breakpoint === "desktop" ? "escritorio" : "tablet"}
      <select className="v2-field mt-1" value={selectedColumn.column.span[breakpoint]} onChange={(event) => mutate((draft) => updateColumn(draft, selectedColumn.column.id, (item) => ({ ...item, span: { ...item.span, [breakpoint]: Number(event.target.value) } as CanvasColumnV2["span"] })))}>
        {[1,2,3,4,5,6,7,8,9,12].map((value) => <option key={value} value={value}>{value} de 12</option>)}
      </select>
    </label>)}
    <p className="mt-2 text-xs text-zinc-500">Para agregarle contenido, ve a la pestaña Agregar y elige un widget.</p>
  </>;

  if (selection.kind !== "widget" || !selectedWidget) return null;
  const widget = selectedWidget.widget;
  const updateWidget = (patch: Partial<WidgetV2>) => mutate((draft) => updateWidgetById(draft, widget.id, (item) => ({ ...item, ...patch })));
  return <V2WidgetSettings siteId={siteId} widget={widget} content={content} setContent={setContent} updateWidget={updateWidget} />;
}

function SectionTree({ section, selection, setSelection, mutate }: {
  section: CanvasSectionV2; selection: Selection; setSelection: (value: Selection) => void;
  mutate: (fn: (draft: CanvasSectionV2[]) => CanvasSectionV2[]) => void;
}) {
  const sortable = useSortable({ id: `section:${section.id}`, data: { kind: "section", sectionId: section.id, id: section.id } satisfies DragData });
  const selected = selection?.id === section.id;
  return <div ref={sortable.setNodeRef} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
    className={`rounded-lg border bg-white p-2 ${selected ? "border-violet-600" : "border-zinc-200"}`}>
    <div className="flex items-center gap-1">
      <button {...sortable.attributes} {...sortable.listeners} className="cursor-grab p-2 text-zinc-400 hover:text-zinc-600" aria-label="Arrastrar sección"><GripVertical className="h-4 w-4" /></button>
      <button className={`min-w-0 flex-1 truncate text-left text-sm font-medium ${selected ? "text-violet-700" : "text-zinc-800"}`} onClick={() => setSelection({ kind: "section", id: section.id })}>{section.name}</button>
      {section.region === "main" && <button title="Eliminar sección" aria-label="Eliminar sección" className="p-2 text-zinc-400 hover:text-red-600" onClick={() => mutate((draft) => draft.filter((item) => item.id !== section.id))}><Trash2 className="h-4 w-4" /></button>}
    </div>
    <SortableContext items={section.rows.map((row) => `row:${row.id}`)} strategy={verticalListSortingStrategy}>
      <div className="space-y-2 pl-3">{section.rows.map((row) => <RowTree key={row.id} sectionId={section.id} row={row} selection={selection} setSelection={setSelection} mutate={mutate} />)}</div>
    </SortableContext>
  </div>;
}

function RowTree({ sectionId, row, selection, setSelection, mutate }: { sectionId: string; row: CanvasRowV2; selection: Selection; setSelection: (value: Selection) => void; mutate: (fn: (draft: CanvasSectionV2[]) => CanvasSectionV2[]) => void }) {
  const sortable = useSortable({ id: `row:${row.id}`, data: { kind: "row", sectionId, rowId: row.id, id: row.id } satisfies DragData });
  return <div ref={sortable.setNodeRef} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }} className="rounded-md border border-zinc-200 bg-zinc-50 p-1.5">
    <div className="mb-1 flex items-center text-[11px] text-zinc-500">
      <button {...sortable.attributes} {...sortable.listeners} className="cursor-grab p-1" aria-label="Arrastrar fila"><GripVertical className="h-3 w-3" /></button>
      <button className={selection?.id === row.id ? "font-semibold text-violet-700" : ""} onClick={() => setSelection({ kind: "row", id: row.id })}>Fila</button>
      <button className="ml-auto p-1 hover:text-red-600" aria-label="Eliminar fila" onClick={() => mutate((draft) => draft.map((section) => section.id === sectionId ? { ...section, rows: section.rows.filter((item) => item.id !== row.id) } : section))}><Trash2 className="h-3 w-3" /></button>
    </div>
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${row.columns.length},minmax(0,1fr))` }}>{row.columns.map((column) => <ColumnTree key={column.id} sectionId={sectionId} rowId={row.id} column={column} selection={selection} setSelection={setSelection} mutate={mutate} />)}</div>
  </div>;
}

function ColumnTree({ sectionId, rowId, column, selection, setSelection, mutate }: { sectionId: string; rowId: string; column: CanvasColumnV2; selection: Selection; setSelection: (value: Selection) => void; mutate: (fn: (draft: CanvasSectionV2[]) => CanvasSectionV2[]) => void }) {
  const drop = useDroppable({ id: `column:${column.id}`, data: { kind: "column", sectionId, rowId, columnId: column.id, id: column.id } });
  return <div ref={drop.setNodeRef} className={`min-w-0 rounded border bg-white p-1 ${selection?.id === column.id ? "border-violet-600" : drop.isOver ? "border-violet-400 bg-violet-50" : "border-zinc-200"}`}>
    <button className="mb-1 block w-full text-left text-[10px] font-medium text-zinc-400 hover:text-violet-700" onClick={() => setSelection({ kind: "column", id: column.id })}>Columna</button>
    <SortableContext items={column.widgets.map((widget) => `widget:${widget.id}`)} strategy={verticalListSortingStrategy}>{column.widgets.map((widget, index) => <WidgetTree key={widget.id} widget={widget} index={index} sectionId={sectionId} rowId={rowId} columnId={column.id} selection={selection} setSelection={setSelection} mutate={mutate} />)}</SortableContext>
    {!column.widgets.length && <span className="block py-2 text-center text-[10px] text-zinc-400">Suelta un widget aquí</span>}
  </div>;
}

function WidgetTree({ widget, index, sectionId, rowId, columnId, selection, setSelection, mutate }: { widget: WidgetV2; index: number; sectionId: string; rowId: string; columnId: string; selection: Selection; setSelection: (value: Selection) => void; mutate: (fn: (draft: CanvasSectionV2[]) => CanvasSectionV2[]) => void }) {
  const sortable = useSortable({ id: `widget:${widget.id}`, data: { kind: "widget", sectionId, rowId, columnId, id: widget.id } satisfies DragData });
  const move = (direction: -1 | 1) => mutate((draft) => updateColumn(draft, columnId, (column) => ({ ...column, widgets: moveAt(column.widgets, index, index + direction) })));
  return <div ref={sortable.setNodeRef} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
    className={`mb-1 flex items-center rounded border text-[11px] ${selection?.id === widget.id ? "border-violet-600 bg-violet-50 text-violet-800" : "border-zinc-200 bg-zinc-50 text-zinc-600"}`}>
    <button {...sortable.attributes} {...sortable.listeners} className="cursor-grab p-1" aria-label="Arrastrar widget"><GripVertical className="h-3 w-3" /></button>
    <button className="min-w-0 flex-1 truncate text-left" onClick={() => setSelection({ kind: "widget", id: widget.id })}>{WIDGET_LABELS[widget.type]}</button>
    <button aria-label="Subir" className="p-1 disabled:opacity-30" disabled={index === 0} onClick={() => move(-1)}><ChevronUp className="h-3 w-3" /></button>
    <button aria-label="Bajar" className="p-1" onClick={() => move(1)}><ChevronDown className="h-3 w-3" /></button>
    <button aria-label="Eliminar" className="p-1 hover:text-red-600" onClick={() => mutate((draft) => updateColumn(draft, columnId, (column) => ({ ...column, widgets: column.widgets.filter((item) => item.id !== widget.id) })))}><Trash2 className="h-3 w-3" /></button>
  </div>;
}

function cloneSection(seed: Omit<CanvasSectionV2, "id">): CanvasSectionV2 {
  const section = structuredClone(seed) as CanvasSectionV2; section.id = crypto.randomUUID();
  section.rows = section.rows.map((row) => ({ ...row, id: crypto.randomUUID(), columns: row.columns.map((column) => ({ ...column, id: crypto.randomUUID(), widgets: column.widgets.map((widget) => ({ ...widget, id: crypto.randomUUID() })) })) }));
  return section;
}
function defaultWidgetData(type: V2WidgetType): Record<string, unknown> {
  if (type === "image" || type === "video") return { src: "", alt: "" };
  if (type === "nav") return { items: [] };
  if (type === "embed") return { html: "", height: 300 };
  if (type === "spacer") return { size: "md" };
  if (type === "list") return { value: [{ title: "Nuevo elemento", description: "Describe este elemento.", meta: "", image: "" }] };
  if (type === "gallery") return { value: [] };
  if (type === "testimonials") return { value: [{ name: "Nombre del cliente", role: "", quote: "Escribe aquí la reseña.", rating: 5, source: "" }] };
  if (type === "accordion") return { value: [{ question: "¿Nueva pregunta?", answer: "Escribe la respuesta." }] };
  return { text: WIDGET_LABELS[type] };
}
function firstColumn(sections: CanvasSectionV2[], region: CanvasSectionV2["region"]) { const section = sections.find((item) => item.region === region); const column = section?.rows[0]?.columns[0]; return section && column ? { section, row: section.rows[0], column } : null; }
function findWidget(sections: CanvasSectionV2[], id: string) { for (const section of sections) for (const row of section.rows) for (const column of row.columns) { const widget = column.widgets.find((item) => item.id === id); if (widget) return { section, row, column, widget }; } return null; }
function findColumn(sections: CanvasSectionV2[], id: string) { for (const section of sections) for (const row of section.rows) { const column = row.columns.find((item) => item.id === id); if (column) return { section, row, column }; } return null; }
function findRow(sections: CanvasSectionV2[], id: string) { for (const section of sections) { const row = section.rows.find((item) => item.id === id); if (row) return { section, row }; } return null; }
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
