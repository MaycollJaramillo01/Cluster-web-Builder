"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { EditorMediaField } from "@/components/builder/EditorMediaField";
import {
  resolveContentSlot, setContentSlot, V2_CONTENT_SLOTS,
  type SiteContentV2, type V2ContentSlot, type V2Faq, type V2Item, type V2Media, type V2Review, type WidgetV2,
} from "@/lib/site/v2-schema";

type Props = {
  siteId: string;
  widget: WidgetV2;
  content: SiteContentV2;
  setContent: (value: SiteContentV2) => void;
  updateWidget: (patch: Partial<WidgetV2>) => void;
};

const BUTTON_TARGETS = [
  { value: "#contact", label: "Formulario de contacto" },
  { value: "#services", label: "Sección Servicios" },
  { value: "#about", label: "Sección Nosotros" },
  { value: "custom", label: "URL personalizada" },
];

const SOCIAL_NETWORKS = ["instagram", "facebook", "whatsapp", "tiktok", "youtube", "linkedin", "x"] as const;

export function V2WidgetSettings({ siteId, widget, content, setContent, updateWidget }: Props) {
  const slotValue = widget.slot ? resolveContentSlot(content, widget.slot) : undefined;

  const writeSlot = (slot: V2ContentSlot, value: unknown) => setContent(setContentSlot(content, slot, value));
  const writeData = (patch: Record<string, unknown>) => updateWidget({ data: { ...widget.data, ...patch } });

  const readText = () => typeof slotValue === "string" ? slotValue : String(widget.data?.text ?? "");
  const writeText = (value: string) => widget.slot ? writeSlot(widget.slot, value) : writeData({ text: value });

  const readMedia = () => typeof slotValue === "string" ? slotValue : String(widget.data?.src ?? "");
  const writeMedia = (value: string) => widget.slot ? writeSlot(widget.slot, value) : writeData({ src: value });

  const readItems = <T,>(): T[] => Array.isArray(slotValue) ? slotValue as T[] : Array.isArray(widget.data?.value) ? widget.data.value as T[] : [];
  const writeItems = (items: unknown[]) => widget.slot ? writeSlot(widget.slot, items) : writeData({ value: items });

  const slotFrom = (key: string, fallback: V2ContentSlot): V2ContentSlot => {
    const raw = widget.data?.[key];
    return typeof raw === "string" && (V2_CONTENT_SLOTS as readonly string[]).includes(raw) ? raw as V2ContentSlot : fallback;
  };

  switch (widget.type) {
    case "heading": return <>
      <TextControl label="Texto del título" value={readText()} onChange={writeText} textarea />
      {widget.slot && <ImproveButton siteId={siteId} slot={widget.slot} value={readText()} onImproved={writeText} />}
      <SelectControl label="Nivel" value={widget.variant || "h2"} onChange={(value) => updateWidget({ variant: value })}
        options={[["h1", "Título principal (H1)"], ["h2", "Título de sección (H2)"], ["h3", "Subtítulo (H3)"]]} />
      <StyleControls widget={widget} updateWidget={updateWidget} />
    </>;

    case "text": return <>
      <TextControl label="Texto" value={readText()} onChange={writeText} textarea rows={6} />
      {widget.slot && <ImproveButton siteId={siteId} slot={widget.slot} value={readText()} onImproved={writeText} />}
      <StyleControls widget={widget} updateWidget={updateWidget} />
    </>;

    case "button": {
      const linkSlot = widget.data?.linkSlot;
      const boundSlot = typeof linkSlot === "string" && (V2_CONTENT_SLOTS as readonly string[]).includes(linkSlot) ? linkSlot as V2ContentSlot : null;
      const link = boundSlot ? String(resolveContentSlot(content, boundSlot) ?? "") : String(widget.data?.link ?? "");
      const writeLink = (value: string) => boundSlot ? writeSlot(boundSlot, value) : writeData({ link: value });
      const preset = BUTTON_TARGETS.some((target) => target.value === link) ? link : "custom";
      return <>
        <TextControl label="Texto del botón" value={readText()} onChange={writeText} placeholder="Ej: Contáctanos" />
        <SelectControl label="Al hacer clic lleva a" value={preset} onChange={(value) => writeLink(value === "custom" ? "" : value)}
          options={BUTTON_TARGETS.map((target) => [target.value, target.label])} />
        {preset === "custom" && <TextControl label="URL" value={link} onChange={writeLink} placeholder="https://... o tel:+52..." hint="Acepta enlaces web, tel: y mailto:" />}
        <SelectControl label="Estilo del botón" value={widget.variant || "solid"} onChange={(value) => updateWidget({ variant: value })}
          options={[["solid", "Sólido (color de acento)"], ["outline", "Contorno"]]} />
        <StyleControls widget={widget} updateWidget={updateWidget} />
      </>;
    }

    case "image": return <>
      <EditorMediaField tone="light" siteId={siteId} kind="image" value={readMedia()} onChange={writeMedia} onUsageChange={() => undefined} />
      <TextControl label="Descripción de la imagen" value={String(widget.data?.alt ?? "")} onChange={(value) => writeData({ alt: value })}
        placeholder="Qué se ve en la imagen" hint="Ayuda a la accesibilidad y al SEO" />
      <SelectControl label="Estilo" value={widget.variant || "cover"} onChange={(value) => updateWidget({ variant: value })}
        options={[["cover", "Normal"], ["portrait", "Vertical (retrato)"], ["monochrome", "Blanco y negro"]]} />
      <StyleControls widget={widget} updateWidget={updateWidget} />
    </>;

    case "video": return <>
      <EditorMediaField tone="light" siteId={siteId} kind="video" value={readMedia()} onChange={writeMedia} onUsageChange={() => undefined} />
      <TextControl label="O pega una URL" value={readMedia()} onChange={writeMedia}
        placeholder="YouTube, Vimeo o archivo MP4" hint="Los enlaces de YouTube se insertan automáticamente" />
    </>;

    case "nav": {
      const items = (Array.isArray(widget.data?.items) ? widget.data.items : []) as { label?: string; href?: string }[];
      const write = (next: typeof items) => writeData({ items: next });
      return <>
        <p className="mb-3 text-xs text-zinc-500">Enlaces del menú de navegación.</p>
        <ItemList items={items} onChange={write} addLabel="Agregar enlace" create={() => ({ label: "Nuevo enlace", href: "#contact" })} max={8}
          render={(item, patch) => <>
            <TextControl label="Texto" value={String(item.label ?? "")} onChange={(value) => patch({ label: value })} compact />
            <TextControl label="Lleva a" value={String(item.href ?? "")} onChange={(value) => patch({ href: value })} placeholder="#services o https://..." compact />
          </>} />
      </>;
    }

    case "brand": return <>
      <TextControl label="Nombre del negocio" value={content.business.name} onChange={(value) => writeSlot("business.name", value)} hint="Se usa en todo el sitio" />
      <p className="v2-settings-sublabel">Logo</p>
      <EditorMediaField tone="light" siteId={siteId} kind="image" value={content.business.logo} onChange={(src) => writeSlot("business.logo", src)} onUsageChange={() => undefined} />
    </>;

    case "business_info": return <>
      <p className="mb-3 text-xs text-zinc-500">Estos datos se comparten en todo el sitio (pie de página, contacto, mapa).</p>
      <TextControl label="Nombre del negocio" value={content.business.name} onChange={(value) => writeSlot("business.name", value)} />
      <TextControl label="Teléfono" value={content.business.phone} onChange={(value) => writeSlot("business.phone", value)} placeholder="+52 55 1234 5678" />
      <TextControl label="Email" value={content.business.email} onChange={(value) => writeSlot("business.email", value)} placeholder="hola@tunegocio.com" />
      <TextControl label="Ubicación" value={content.business.location} onChange={(value) => writeSlot("business.location", value)} placeholder="Ciudad, país" />
    </>;

    case "list": {
      const items = readItems<V2Item>();
      return <>
        <SelectControl label="Presentación" value={widget.variant || "cards"} onChange={(value) => updateWidget({ variant: value })}
          options={[["cards", "Tarjetas"], ["minimal", "Lista simple"], ["editorial", "Editorial"], ["metrics", "Métricas / cifras"]]} />
        <ItemList items={items} onChange={writeItems} addLabel="Agregar elemento" max={24}
          create={() => ({ title: "Nuevo elemento", description: "Describe este elemento.", meta: "", image: "" })}
          render={(item, patch) => <>
            <TextControl label="Título" value={item.title} onChange={(value) => patch({ title: value })} compact />
            <TextControl label="Descripción" value={item.description} onChange={(value) => patch({ description: value })} textarea rows={2} compact />
            <TextControl label="Dato extra" value={item.meta ?? ""} onChange={(value) => patch({ meta: value })} placeholder="Precio, cifra o etiqueta" compact />
            <TextControl label="Imagen (URL)" value={item.image ?? ""} onChange={(value) => patch({ image: value })} placeholder="https://... (opcional)" compact />
          </>} />
        <StyleControls widget={widget} updateWidget={updateWidget} />
      </>;
    }

    case "gallery": {
      const items = readItems<V2Media>();
      return <>
        <SelectControl label="Presentación" value={widget.variant || "grid"} onChange={(value) => updateWidget({ variant: value })}
          options={[["grid", "Cuadrícula"], ["mosaic", "Mosaico (primera grande)"], ["filmstrip", "Tira horizontal"]]} />
        <ItemList items={items} onChange={writeItems} addLabel="Agregar imagen" max={36}
          create={() => ({ url: "", alt: "" })}
          render={(item, patch) => <>
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura del panel con URLs arbitrarias del usuario; next/image exigiría permitir cualquier dominio remoto */}
            {item.url ? <img src={item.url} alt="" className="mb-1 h-20 w-full rounded object-cover" /> : null}
            <TextControl label="URL de la imagen" value={item.url} onChange={(value) => patch({ url: value })} placeholder="https://..." compact />
            <TextControl label="Descripción" value={item.alt} onChange={(value) => patch({ alt: value })} placeholder="Qué se ve (opcional)" compact />
          </>} />
      </>;
    }

    case "testimonials": {
      const items = readItems<V2Review>();
      return <>
        <SelectControl label="Presentación" value={widget.variant || "cards"} onChange={(value) => updateWidget({ variant: value })}
          options={[["cards", "Tarjetas"], ["quotes", "Solo citas"]]} />
        <ItemList items={items} onChange={writeItems} addLabel="Agregar reseña" max={20}
          create={() => ({ name: "Nombre del cliente", role: "", quote: "Escribe aquí la reseña.", rating: 5, source: "" })}
          render={(item, patch) => <>
            <TextControl label="Reseña" value={item.quote} onChange={(value) => patch({ quote: value })} textarea rows={3} compact />
            <TextControl label="Nombre" value={item.name} onChange={(value) => patch({ name: value })} compact />
            <TextControl label="Rol o empresa" value={item.role} onChange={(value) => patch({ role: value })} placeholder="Opcional" compact />
            <SelectControl label="Estrellas" value={String(item.rating)} onChange={(value) => patch({ rating: Number(value) })} compact
              options={[["5", "5 estrellas"], ["4", "4 estrellas"], ["3", "3 estrellas"], ["2", "2 estrellas"], ["1", "1 estrella"]]} />
          </>} />
      </>;
    }

    case "accordion": {
      const items = readItems<V2Faq>();
      return <>
        <p className="mb-3 text-xs text-zinc-500">Preguntas que se abren y cierran al hacer clic.</p>
        <ItemList items={items} onChange={writeItems} addLabel="Agregar pregunta" max={24}
          create={() => ({ question: "¿Nueva pregunta?", answer: "Escribe la respuesta." })}
          render={(item, patch) => <>
            <TextControl label="Pregunta" value={item.question} onChange={(value) => patch({ question: value })} compact />
            <TextControl label="Respuesta" value={item.answer} onChange={(value) => patch({ answer: value })} textarea rows={3} compact />
          </>} />
      </>;
    }

    case "form": {
      const titleSlot = slotFrom("titleSlot", "contact.title");
      const bodySlot = slotFrom("bodySlot", "contact.body");
      const buttonSlot = slotFrom("buttonSlot", "contact.ctaText");
      return <>
        <p className="mb-3 text-xs text-zinc-500">Los mensajes enviados llegan a tu bandeja de contactos.</p>
        <TextControl label="Título del formulario" value={String(resolveContentSlot(content, titleSlot) ?? "")} onChange={(value) => writeSlot(titleSlot, value)} />
        <TextControl label="Mensaje de apoyo" value={String(resolveContentSlot(content, bodySlot) ?? "")} onChange={(value) => writeSlot(bodySlot, value)} textarea rows={2} />
        <TextControl label="Texto del botón de envío" value={String(resolveContentSlot(content, buttonSlot) ?? "")} onChange={(value) => writeSlot(buttonSlot, value)} placeholder="Enviar mensaje" />
      </>;
    }

    case "social": {
      const current = slotValue && typeof slotValue === "object" && !Array.isArray(slotValue) ? slotValue as Record<string, string> : content.social;
      const write = (network: string, url: string) => {
        const next = { ...current };
        if (url.trim()) next[network] = url.trim(); else delete next[network];
        writeSlot(widget.slot || "social", next);
      };
      return <>
        <p className="mb-3 text-xs text-zinc-500">Pega el enlace completo de cada red. Las vacías no se muestran.</p>
        {SOCIAL_NETWORKS.map((network) => (
          <TextControl key={network} label={network === "x" ? "X (Twitter)" : network.charAt(0).toUpperCase() + network.slice(1)}
            value={current[network] || ""} onChange={(value) => write(network, value)} placeholder={`https://${network === "x" ? "x" : network}.com/...`} compact />
        ))}
      </>;
    }

    case "map": return <>
      <TextControl label="Dirección en el mapa" value={typeof slotValue === "string" ? slotValue : String(widget.data?.value ?? "")}
        onChange={(value) => widget.slot ? writeSlot(widget.slot, value) : writeData({ value })}
        placeholder="Calle, número, ciudad" hint="Si lo dejas vacío se usa la ubicación del negocio" />
    </>;

    case "spacer": return <>
      <SelectControl label="Tamaño del espacio" value={String(widget.data?.size || "md")} onChange={(value) => writeData({ size: value })}
        options={[["sm", "Pequeño"], ["md", "Medio"], ["lg", "Grande"]]} />
    </>;

    case "divider": return <p className="text-xs text-zinc-500">Una línea separadora. No tiene opciones adicionales.</p>;

    case "embed": return <>
      <label className="mb-3 block text-xs font-medium">Código HTML
        <textarea className="v2-field mt-1 min-h-40 font-mono text-xs" value={String(widget.data?.html ?? "")} maxLength={8000}
          onChange={(event) => writeData({ html: event.target.value })}
          placeholder={'<iframe src="..."></iframe> o cualquier código de inserción'} />
      </label>
      <TextControl label="Alto (píxeles)" value={String(widget.data?.height ?? 300)} onChange={(value) => writeData({ height: Number(value) || 300 })} placeholder="300" />
      <p className="rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">El código corre aislado del resto del sitio por seguridad. Pega solo código de servicios en los que confíes (YouTube, Google Maps, Calendly, etc.).</p>
    </>;

    default: return <StyleControls widget={widget} updateWidget={updateWidget} />;
  }
}

/* ------------------------- controles compartidos ------------------------- */

function TextControl({ label, value, onChange, placeholder, hint, textarea, rows = 4, compact }: {
  label: string; value: string; onChange: (value: string) => void;
  placeholder?: string; hint?: string; textarea?: boolean; rows?: number; compact?: boolean;
}) {
  return <label className={`block text-xs font-medium ${compact ? "mb-2" : "mb-3"}`}>{label}
    {textarea
      ? <textarea className="v2-field mt-1" rows={rows} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      : <input className="v2-field mt-1" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />}
    {hint && <span className="mt-1 block font-normal text-zinc-400">{hint}</span>}
  </label>;
}

function SelectControl({ label, value, onChange, options, compact }: {
  label: string; value: string; onChange: (value: string) => void; options: [string, string][]; compact?: boolean;
}) {
  return <label className={`block text-xs font-medium ${compact ? "mb-2" : "mb-3"}`}>{label}
    <select className="v2-field mt-1" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
    </select>
  </label>;
}

function StyleControls({ widget, updateWidget }: { widget: WidgetV2; updateWidget: (patch: Partial<WidgetV2>) => void }) {
  return <>
    <h3 className="v2-label mt-5">Estilo</h3>
    <SelectControl label="Alineación" value={widget.style?.desktop?.align || "left"}
      onChange={(value) => updateWidget({ style: { ...widget.style, desktop: { ...widget.style?.desktop, align: value as "left" | "center" | "right" } } })}
      options={[["left", "Izquierda"], ["center", "Centrada"], ["right", "Derecha"]]} />
    <SelectControl label="Espaciado" value={widget.style?.desktop?.padding || "none"}
      onChange={(value) => updateWidget({ style: { ...widget.style, desktop: { ...widget.style?.desktop, padding: value as "none" | "sm" | "md" | "lg" | "xl" } } })}
      options={[["none", "Sin espacio"], ["sm", "Pequeño"], ["md", "Medio"], ["lg", "Grande"], ["xl", "Extra grande"]]} />
  </>;
}

function ImproveButton({ siteId, slot, value, onImproved }: { siteId: string; slot: V2ContentSlot; value: string; onImproved: (value: string) => void }) {
  const [improving, setImproving] = useState(false);
  const [error, setError] = useState("");
  const improve = async () => {
    setImproving(true); setError("");
    const response = await fetch(`/api/sites/${siteId}/improve-content`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot, currentValue: value }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.value) onImproved(data.value);
    else setError(data.error || "No se pudo mejorar el texto.");
    setImproving(false);
  };
  return <div className="mb-3">
    <button type="button" disabled={improving} onClick={improve} className="min-h-10 rounded-md border border-violet-600 px-3 text-xs font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-60">
      {improving ? "Mejorando…" : "Mejorar con IA"}
    </button>
    {error && <span className="mt-2 block text-xs text-red-600">{error}</span>}
  </div>;
}

function ItemList<T extends Record<string, unknown>>({ items, onChange, render, create, addLabel, max }: {
  items: T[]; onChange: (items: T[]) => void;
  render: (item: T, patch: (patch: Partial<T>) => void, index: number) => React.ReactNode;
  create: () => T; addLabel: string; max: number;
}) {
  const patchAt = (index: number) => (patch: Partial<T>) => onChange(items.map((item, i) => i === index ? { ...item, ...patch } : item));
  const removeAt = (index: number) => onChange(items.filter((_, i) => i !== index));
  const moveAt = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChange(next);
  };
  return <div className="grid gap-2">
    {items.map((item, index) => (
      <div key={index} className="rounded-lg border border-zinc-200 p-2">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-zinc-400">{index + 1} de {items.length}</span>
          <span className="flex items-center">
            <button type="button" aria-label="Subir" className="p-1 text-zinc-400 hover:text-zinc-700 disabled:opacity-30" disabled={index === 0} onClick={() => moveAt(index, -1)}><ChevronUp className="h-3.5 w-3.5" /></button>
            <button type="button" aria-label="Bajar" className="p-1 text-zinc-400 hover:text-zinc-700 disabled:opacity-30" disabled={index === items.length - 1} onClick={() => moveAt(index, 1)}><ChevronDown className="h-3.5 w-3.5" /></button>
            <button type="button" aria-label="Eliminar" className="p-1 text-zinc-400 hover:text-red-600" onClick={() => removeAt(index)}><Trash2 className="h-3.5 w-3.5" /></button>
          </span>
        </div>
        {render(item, patchAt(index), index)}
      </div>
    ))}
    {items.length < max && (
      <button type="button" className="v2-add justify-center" onClick={() => onChange([...items, create()])}>
        <Plus className="h-4 w-4 text-violet-600" />{addLabel}
      </button>
    )}
  </div>;
}
