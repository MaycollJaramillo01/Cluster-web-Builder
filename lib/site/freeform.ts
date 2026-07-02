import { normalizeElementStyle, type ElementStyle } from "./element-style";
import { sanitizeLink } from "./links";

/**
 * Freeform widget layout for `type: "freeform"` sections ("Sección libre").
 * Lives entirely inside `section.settings.freeform` — additive, validated
 * the same way as `SectionLayout`/`ElementStyle`: closed unions, bounded
 * content, never throws. A section of any of the other 18 types never has
 * this key, so this module has zero effect on existing published sites.
 */

export type FreeformWidgetType = "heading" | "text" | "image" | "button" | "spacer" | "divider";

export type FreeformWidget = {
  id: string;
  type: FreeformWidgetType;
  /** Always string-valued so the whole tree stays assignable to Prisma's JSON input type. */
  content: Record<string, string>;
  style?: ElementStyle;
};

export type FreeformColumn = {
  id: string;
  /** Column width in fr units — a closed set keeps the export grid CSS small and predictable. */
  width: 1 | 2 | 3;
  widgets: FreeformWidget[];
};

export type FreeformRow = {
  id: string;
  columns: FreeformColumn[];
};

export type FreeformLayout = {
  rows: FreeformRow[];
};

export const EMPTY_FREEFORM_LAYOUT: FreeformLayout = { rows: [] };

export const MAX_ROWS = 6;
export const MAX_COLUMNS_PER_ROW = 4;
export const MAX_WIDGETS_PER_SECTION = 20;
export const WIDGET_TYPES: FreeformWidgetType[] = ["heading", "text", "image", "button", "spacer", "divider"];
const SPACER_SIZES = ["sm", "md", "lg"] as const;

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function normalizeWidgetContent(type: FreeformWidgetType, value: unknown): Record<string, string> {
  const raw = typeof value === "object" && value ? (value as Record<string, unknown>) : {};
  switch (type) {
    case "heading":
      return { text: str(raw.text, 200) };
    case "text":
      return { text: str(raw.text, 2000) };
    case "image":
      return { url: str(raw.url, 2000), alt: str(raw.alt, 300) };
    case "button":
      return { text: str(raw.text, 80), link: sanitizeLink(str(raw.link, 2000)) };
    case "spacer": {
      const size = String(raw.size ?? "");
      return { size: (SPACER_SIZES as readonly string[]).includes(size) ? size : "md" };
    }
    case "divider":
      return {};
  }
}

function normalizeWidget(value: unknown): FreeformWidget | null {
  if (typeof value !== "object" || !value) return null;
  const raw = value as Record<string, unknown>;
  const type = (WIDGET_TYPES as readonly string[]).includes(String(raw.type)) ? (raw.type as FreeformWidgetType) : null;
  const id = typeof raw.id === "string" && raw.id ? raw.id : null;
  if (!type || !id) return null;
  const style = normalizeElementStyle(raw.style);
  return {
    id,
    type,
    content: normalizeWidgetContent(type, raw.content),
    ...(Object.keys(style).length ? { style } : {}),
  };
}

function normalizeColumn(value: unknown, widgetsRemaining: { count: number }): FreeformColumn | null {
  if (typeof value !== "object" || !value) return null;
  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === "string" && raw.id ? raw.id : null;
  const width = [1, 2, 3].includes(Number(raw.width)) ? (Number(raw.width) as 1 | 2 | 3) : 1;
  if (!id) return null;
  const rawWidgets = Array.isArray(raw.widgets) ? raw.widgets : [];
  const widgets: FreeformWidget[] = [];
  for (const item of rawWidgets) {
    if (widgetsRemaining.count <= 0) break;
    const widget = normalizeWidget(item);
    if (!widget) continue;
    widgets.push(widget);
    widgetsRemaining.count -= 1;
  }
  return { id, width, widgets };
}

function normalizeRow(value: unknown, widgetsRemaining: { count: number }): FreeformRow | null {
  if (typeof value !== "object" || !value) return null;
  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === "string" && raw.id ? raw.id : null;
  if (!id) return null;
  const rawColumns = Array.isArray(raw.columns) ? raw.columns : [];
  const columns: FreeformColumn[] = [];
  for (const item of rawColumns.slice(0, MAX_COLUMNS_PER_ROW)) {
    const column = normalizeColumn(item, widgetsRemaining);
    if (column) columns.push(column);
  }
  if (!columns.length) return null;
  return { id, columns };
}

/** Validates a freeform layout end to end; drops anything malformed instead of throwing, caps counts. */
export function normalizeFreeformLayout(value: unknown): FreeformLayout {
  if (typeof value !== "object" || !value) return EMPTY_FREEFORM_LAYOUT;
  const raw = value as Record<string, unknown>;
  const rawRows = Array.isArray(raw.rows) ? raw.rows : [];
  const widgetsRemaining = { count: MAX_WIDGETS_PER_SECTION };
  const rows: FreeformRow[] = [];
  for (const item of rawRows.slice(0, MAX_ROWS)) {
    const row = normalizeRow(item, widgetsRemaining);
    if (row) rows.push(row);
  }
  return { rows };
}

export function createEmptyRow(id: string, columnId: string): FreeformRow {
  return { id, columns: [{ id: columnId, width: 1, widgets: [] }] };
}
