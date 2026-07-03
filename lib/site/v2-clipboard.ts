import { normalizeWidgetV2, type WidgetV2 } from "@/lib/site/v2-schema";

export const V2_CLIPBOARD_KEY = "cluster:v2-clipboard";

export type V2Clipboard = {
  mode: "widget" | "style";
  widget: WidgetV2;
};

export function parseV2Clipboard(value: unknown): V2Clipboard | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (raw.mode !== "widget" && raw.mode !== "style") return null;
  const widget = normalizeWidgetV2(raw.widget);
  return widget ? { mode: raw.mode, widget } : null;
}

export function readV2Clipboard(storage: Pick<Storage, "getItem" | "removeItem">): V2Clipboard | null {
  const raw = storage.getItem(V2_CLIPBOARD_KEY);
  if (!raw) return null;
  try {
    const parsed = parseV2Clipboard(JSON.parse(raw));
    if (!parsed) storage.removeItem(V2_CLIPBOARD_KEY);
    return parsed;
  } catch {
    storage.removeItem(V2_CLIPBOARD_KEY);
    return null;
  }
}
