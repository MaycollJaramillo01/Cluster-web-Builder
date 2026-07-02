"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Columns3, Plus, Trash2 } from "lucide-react";

import { SortableItem, SortableList } from "@/components/builder/dnd";
import { fieldClass, IconButton } from "@/components/builder/editor-ui";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_ROWS,
  MAX_WIDGETS_PER_SECTION,
  normalizeFreeformLayout,
  WIDGET_TYPES,
  type FreeformColumn,
  type FreeformLayout,
  type FreeformRow,
  type FreeformWidget,
  type FreeformWidgetType,
} from "@/lib/site/freeform";
import type { RenderSection } from "@/lib/site/section";
import { cn } from "@/lib/utils";

const WIDGET_LABEL: Record<FreeformWidgetType, string> = {
  heading: "Título",
  text: "Texto",
  image: "Imagen",
  button: "Botón",
  spacer: "Espaciador",
  divider: "Divisor",
};

const COLUMN_LAYOUTS: Array<{ label: string; widths: (1 | 2 | 3)[] }> = [
  { label: "1 columna", widths: [1] },
  { label: "2 columnas iguales", widths: [1, 1] },
  { label: "2 columnas (30/70)", widths: [1, 3] },
  { label: "3 columnas iguales", widths: [1, 1, 1] },
];

function newId() {
  return crypto.randomUUID();
}

function countWidgets(layout: FreeformLayout): number {
  return layout.rows.reduce((total, row) => total + row.columns.reduce((sum, col) => sum + col.widgets.length, 0), 0);
}

export function FreeformEditor({ section, onUpdate }: { section: RenderSection; onUpdate: (id: string, patch: Partial<RenderSection>) => void }) {
  const layout = normalizeFreeformLayout(section.settings.freeform);
  const [selected, setSelected] = useState<string | null>(null);
  const widgetCount = countWidgets(layout);

  const commit = (rows: FreeformRow[]) => {
    onUpdate(section.id, { settings: { ...section.settings, freeform: { rows } } });
  };

  const addRow = () => {
    if (layout.rows.length >= MAX_ROWS) return;
    commit([...layout.rows, { id: newId(), columns: [{ id: newId(), width: 1, widgets: [] }] }]);
  };
  const removeRow = (rowId: string) => commit(layout.rows.filter((row) => row.id !== rowId));
  const moveRow = (rowId: string, direction: -1 | 1) => {
    const index = layout.rows.findIndex((row) => row.id === rowId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= layout.rows.length) return;
    const next = [...layout.rows];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };
  // Reordena por arrastre: inserta la fila activa en la posicion de la fila destino.
  const reorderRows = (activeId: string, overId: string) => {
    const from = layout.rows.findIndex((row) => row.id === activeId);
    const to = layout.rows.findIndex((row) => row.id === overId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...layout.rows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commit(next);
  };
  const setRowColumns = (rowId: string, widths: (1 | 2 | 3)[]) => {
    commit(layout.rows.map((row) => {
      if (row.id !== rowId) return row;
      const columns: FreeformColumn[] = widths.map((width, i) => row.columns[i] ? { ...row.columns[i], width } : { id: newId(), width, widgets: [] });
      return { ...row, columns };
    }));
  };

  const mapColumn = (rowId: string, columnId: string, fn: (column: FreeformColumn) => FreeformColumn) => {
    commit(layout.rows.map((row) => row.id !== rowId ? row : { ...row, columns: row.columns.map((column) => column.id === columnId ? fn(column) : column) }));
  };

  const addWidget = (rowId: string, columnId: string, type: FreeformWidgetType) => {
    if (widgetCount >= MAX_WIDGETS_PER_SECTION) return;
    const widget: FreeformWidget = { id: newId(), type, content: defaultContent(type) };
    mapColumn(rowId, columnId, (column) => ({ ...column, widgets: [...column.widgets, widget] }));
    setSelected(widget.id);
  };
  const removeWidget = (rowId: string, columnId: string, widgetId: string) => {
    mapColumn(rowId, columnId, (column) => ({ ...column, widgets: column.widgets.filter((widget) => widget.id !== widgetId) }));
    if (selected === widgetId) setSelected(null);
  };
  const moveWidget = (rowId: string, columnId: string, widgetId: string, direction: -1 | 1) => {
    mapColumn(rowId, columnId, (column) => {
      const index = column.widgets.findIndex((widget) => widget.id === widgetId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= column.widgets.length) return column;
      const widgets = [...column.widgets];
      [widgets[index], widgets[target]] = [widgets[target], widgets[index]];
      return { ...column, widgets };
    });
  };
  const reorderWidgets = (rowId: string, columnId: string, activeId: string, overId: string) => {
    mapColumn(rowId, columnId, (column) => {
      const from = column.widgets.findIndex((widget) => widget.id === activeId);
      const to = column.widgets.findIndex((widget) => widget.id === overId);
      if (from < 0 || to < 0 || from === to) return column;
      const widgets = [...column.widgets];
      const [moved] = widgets.splice(from, 1);
      widgets.splice(to, 0, moved);
      return { ...column, widgets };
    });
  };
  const updateWidget = (rowId: string, columnId: string, widgetId: string, patch: Partial<FreeformWidget>) => {
    mapColumn(rowId, columnId, (column) => ({
      ...column,
      widgets: column.widgets.map((widget) => widget.id === widgetId ? { ...widget, ...patch } : widget),
    }));
  };

  const selectedWidget = layout.rows.flatMap((row) => row.columns.flatMap((column) => column.widgets.map((widget) => ({ row, column, widget }))))
    .find((entry) => entry.widget.id === selected);

  return <div className="space-y-4 rounded-lg border border-[#3d3549] bg-[#1d1a23] p-3">
    <div className="flex items-center justify-between">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a078ff]">Filas y widgets</p>
      <span className="text-[11px] text-[#6b6079]">{widgetCount}/{MAX_WIDGETS_PER_SECTION} widgets</span>
    </div>

    {layout.rows.length === 0 && <p className="text-xs text-[#6b6079]">Esta sección está vacía. Agrega una fila para empezar.</p>}

    <SortableList ids={layout.rows.map((row) => row.id)} onReorder={reorderRows}>
    {layout.rows.map((row, rowIndex) => (
      <SortableItem key={row.id} id={row.id} className="space-y-3 rounded-lg border border-[#2c2832] bg-[#120c1d] p-3">
        {(rowHandle) => <>
        <div className="flex items-center gap-1">
          {rowHandle}
          <Columns3 className="h-3.5 w-3.5 shrink-0 text-[#6b6079]" aria-hidden="true" />
          <select
            value={row.columns.map((c) => c.width).join(",")}
            onChange={(event) => setRowColumns(row.id, event.target.value.split(",").map(Number) as (1 | 2 | 3)[])}
            className="min-h-9 flex-1 rounded-md border border-[#494454] bg-[#1d1a23] px-2 text-xs text-[#e9ddff] outline-none focus:border-[#8b5cf6]"
          >
            {COLUMN_LAYOUTS.map((option) => <option key={option.label} value={option.widths.join(",")}>{option.label}</option>)}
          </select>
          <IconButton title="Subir fila" disabled={rowIndex === 0} onClick={() => moveRow(row.id, -1)}><ChevronUp className="h-3.5 w-3.5" /></IconButton>
          <IconButton title="Bajar fila" disabled={rowIndex === layout.rows.length - 1} onClick={() => moveRow(row.id, 1)}><ChevronDown className="h-3.5 w-3.5" /></IconButton>
          <IconButton title="Eliminar fila" onClick={() => removeRow(row.id)}><Trash2 className="h-3.5 w-3.5" /></IconButton>
        </div>

        <div className={cn("grid gap-2", row.columns.length > 1 ? "sm:grid-cols-2" : "")}>
          {row.columns.map((column) => (
            <div key={column.id} className="space-y-2 rounded-md border border-dashed border-[#3d3549] p-2">
              <SortableList ids={column.widgets.map((widget) => widget.id)} onReorder={(activeId, overId) => reorderWidgets(row.id, column.id, activeId, overId)}>
                {column.widgets.map((widget) => (
                  <SortableItem key={widget.id} id={widget.id}>
                    {(widgetHandle) => <span className="flex items-center gap-0.5">
                      {widgetHandle}
                      <button
                        type="button"
                        onClick={() => setSelected(widget.id === selected ? null : widget.id)}
                        className={cn(
                          "flex min-h-9 w-full min-w-0 flex-1 items-center justify-between rounded px-2 text-left text-xs",
                          widget.id === selected ? "bg-[#2c2141] text-[#c4b5fd]" : "bg-[#1d1a23] text-[#cbc3d7] hover:text-[#e9ddff]"
                        )}
                      >
                        <span className="truncate">{WIDGET_LABEL[widget.type]}{widget.content.text ? `: ${widget.content.text.slice(0, 24)}` : ""}</span>
                      </button>
                    </span>}
                  </SortableItem>
                ))}
              </SortableList>
              <label className="flex min-h-9 items-center gap-1.5 rounded-md border border-dashed border-[#4a4156] px-2 text-[11px] text-[#958ea0]">
                <Plus className="h-3 w-3 shrink-0" aria-hidden="true" />
                <select
                  value=""
                  onChange={(event) => event.target.value && addWidget(row.id, column.id, event.target.value as FreeformWidgetType)}
                  disabled={widgetCount >= MAX_WIDGETS_PER_SECTION}
                  className="min-h-8 flex-1 cursor-pointer bg-transparent outline-none disabled:cursor-not-allowed"
                >
                  <option value="">Agregar widget…</option>
                  {WIDGET_TYPES.map((type) => <option key={type} value={type}>{WIDGET_LABEL[type]}</option>)}
                </select>
              </label>
            </div>
          ))}
        </div>
        </>}
      </SortableItem>
    ))}
    </SortableList>

    <button
      type="button"
      onClick={addRow}
      disabled={layout.rows.length >= MAX_ROWS}
      className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#6d5b83] text-xs text-[#d8c8f8] transition-colors hover:border-[#8b5cf6] disabled:opacity-40"
    >
      <Plus className="h-3.5 w-3.5" />
      {layout.rows.length >= MAX_ROWS ? `Máximo ${MAX_ROWS} filas` : "Agregar fila"}
    </button>

    {selectedWidget && (
      <WidgetInspector
        key={selectedWidget.widget.id}
        widget={selectedWidget.widget}
        onChangeContent={(patch) => updateWidget(selectedWidget.row.id, selectedWidget.column.id, selectedWidget.widget.id, { content: { ...selectedWidget.widget.content, ...patch } })}
        onChangeStyle={(style) => updateWidget(selectedWidget.row.id, selectedWidget.column.id, selectedWidget.widget.id, { style })}
        onMove={(direction) => moveWidget(selectedWidget.row.id, selectedWidget.column.id, selectedWidget.widget.id, direction)}
        onDelete={() => removeWidget(selectedWidget.row.id, selectedWidget.column.id, selectedWidget.widget.id)}
      />
    )}
  </div>;
}

function defaultContent(type: FreeformWidgetType): Record<string, string> {
  switch (type) {
    case "heading": return { text: "Nuevo título" };
    case "text": return { text: "Escribe aquí el contenido." };
    case "image": return { url: "", alt: "" };
    case "button": return { text: "Click aquí", link: "#contact" };
    case "spacer": return { size: "md" };
    case "divider": return {};
  }
}

/** Campos de contenido + un control de color (M1: sin tamaño/peso/desktop-tablet-movil, eso llega con el panel de estilo por dispositivo). */
function WidgetInspector({ widget, onChangeContent, onChangeStyle, onMove, onDelete }: {
  widget: FreeformWidget;
  onChangeContent: (patch: Record<string, string>) => void;
  onChangeStyle: (style: FreeformWidget["style"]) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}) {
  const color = widget.style?.color;
  return <div className="space-y-3 rounded-lg border border-[#8b5cf6]/40 bg-[#120c1d] p-3">
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold text-[#cbc3d7]">{WIDGET_LABEL[widget.type]}</p>
      <span className="flex items-center">
        <IconButton title="Mover arriba" onClick={() => onMove(-1)}><ChevronUp className="h-3.5 w-3.5" /></IconButton>
        <IconButton title="Mover abajo" onClick={() => onMove(1)}><ChevronDown className="h-3.5 w-3.5" /></IconButton>
        <IconButton title="Eliminar widget" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></IconButton>
      </span>
    </div>

    {(widget.type === "heading" || widget.type === "text") && (
      widget.type === "heading"
        ? <Input value={widget.content.text ?? ""} placeholder="Texto del título" className={fieldClass} onChange={(event) => onChangeContent({ text: event.target.value })} />
        : <Textarea value={widget.content.text ?? ""} rows={4} placeholder="Texto" className={fieldClass} onChange={(event) => onChangeContent({ text: event.target.value })} />
    )}
    {widget.type === "image" && <>
      <Input value={widget.content.url ?? ""} placeholder="https://…" className={fieldClass} onChange={(event) => onChangeContent({ url: event.target.value })} />
      <Input value={widget.content.alt ?? ""} placeholder="Descripción accesible" className={fieldClass} onChange={(event) => onChangeContent({ alt: event.target.value })} />
    </>}
    {widget.type === "button" && <>
      <Input value={widget.content.text ?? ""} placeholder="Texto del botón" className={fieldClass} onChange={(event) => onChangeContent({ text: event.target.value })} />
      <Input value={widget.content.link ?? ""} placeholder="#contact o https://…" className={fieldClass} onChange={(event) => onChangeContent({ link: event.target.value })} />
    </>}
    {widget.type === "spacer" && (
      <select
        value={widget.content.size ?? "md"}
        onChange={(event) => onChangeContent({ size: event.target.value })}
        className="min-h-10 w-full rounded-md border border-[#494454] bg-[#1d1a23] px-2 text-xs text-[#e9ddff] outline-none focus:border-[#8b5cf6]"
      >
        <option value="sm">Pequeño</option>
        <option value="md">Normal</option>
        <option value="lg">Grande</option>
      </select>
    )}

    {widget.type !== "spacer" && widget.type !== "divider" && (
      <div className="flex items-center gap-2">
        <span className="w-20 shrink-0 text-xs text-[#958ea0]">Color</span>
        <input type="color" aria-label="Color — selector visual" value={color ?? "#000000"} onChange={(event) => onChangeStyle({ ...widget.style, color: event.target.value })} className="h-10 w-10 shrink-0 cursor-pointer rounded border border-border bg-[#1d1a23] p-1" />
        <Input value={color ?? ""} placeholder="Heredado" aria-label="Color — valor hexadecimal" className={cn(fieldClass, "h-10 font-mono text-xs")} onChange={(event) => onChangeStyle({ ...widget.style, color: event.target.value })} />
      </div>
    )}
  </div>;
}
