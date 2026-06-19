"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Rocket,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SitePreview } from "@/components/builder/SitePreview";
import type { SiteTheme } from "@/lib/site/blueprint";
import type { RenderSection } from "@/lib/site/section";
import type { NavPage } from "@/lib/site/structure";
import { cn } from "@/lib/utils";

export type EditorSite = {
  id: string;
  businessName: string;
  businessType: string;
  phone: string | null;
  email: string | null;
  location: string | null;
  domain: string | null;
  language: string | null;
  visualStyle: string | null;
  status: string;
  theme: SiteTheme;
};

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  services: "Servicios",
  about: "Nosotros",
  benefits: "Beneficios",
  testimonials: "Testimonios",
  gallery: "Galería",
  faq: "Preguntas frecuentes",
  contact: "Contacto",
  cta: "Llamado a la acción",
  trust_badges: "Sellos de confianza",
  process: "Proceso",
  pricing: "Precios",
  location: "Ubicación",
  footer: "Pie de página",
};

export function SiteEditorPanel({
  initialSite,
  initialSections,
  navPages = [],
}: {
  initialSite: EditorSite;
  initialSections: RenderSection[];
  navPages?: NavPage[];
}) {
  const isMultipage = navPages.length > 1;
  const [previewPage, setPreviewPage] = useState(
    navPages[0]?.slug ?? "home"
  );
  const [businessName, setBusinessName] = useState(initialSite.businessName);
  const [phone, setPhone] = useState(initialSite.phone ?? "");
  const [email, setEmail] = useState(initialSite.email ?? "");
  const [location, setLocation] = useState(initialSite.location ?? "");
  const [primary, setPrimary] = useState(initialSite.theme.primary);
  const [secondary, setSecondary] = useState(initialSite.theme.secondary);
  const [accent, setAccent] = useState(initialSite.theme.accent);
  const [sections, setSections] = useState<RenderSection[]>(
    [...initialSections].sort((a, b) => a.order - b.order)
  );
  const [openId, setOpenId] = useState<string | null>(
    initialSections[0]?.id ?? null
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewTheme: SiteTheme = useMemo(
    () => ({ ...initialSite.theme, primary, secondary, accent }),
    [initialSite.theme, primary, secondary, accent]
  );
  const fieldClass =
    "border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 focus-visible:ring-violet-500";

  const updateSection = (id: string, patch: Partial<RenderSection>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  // Reorder within the same page (swap order values with the adjacent sibling).
  const move = (id: string, dir: -1 | 1) => {
    setSections((prev) => {
      const cur = prev.find((s) => s.id === id);
      if (!cur) return prev;
      const siblings = prev
        .filter((s) => s.pageSlug === cur.pageSlug && s.type !== "footer")
        .sort((a, b) => a.order - b.order);
      const idx = siblings.findIndex((s) => s.id === id);
      const target = idx + dir;
      if (target < 0 || target >= siblings.length) return prev;
      const a = siblings[idx];
      const b = siblings[target];
      return prev.map((s) =>
        s.id === a.id
          ? { ...s, order: b.order }
          : s.id === b.id
          ? { ...s, order: a.order }
          : s
      );
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      // 1. Site-level data + colors.
      const siteRes = await fetch(`/api/sites/${initialSite.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          phone: phone || null,
          email: email || null,
          location: location || null,
          primaryColor: primary,
          secondaryColor: secondary,
          accentColor: accent,
        }),
      });
      if (!siteRes.ok) {
        const d = await siteRes.json().catch(() => null);
        throw new Error(d?.error ?? "No se pudieron guardar los datos del sitio.");
      }

      // 2. Each section (title, text fields, visibility, order).
      for (const s of sections) {
        const res = await fetch(
          `/api/sites/${initialSite.id}/sections/${s.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: s.title,
              subtitle: s.subtitle,
              body: s.body,
              ctaText: s.ctaText,
              ctaLink: s.ctaLink,
              isVisible: s.isVisible,
              order: s.order,
            }),
          }
        );
        if (!res.ok) {
          const d = await res.json().catch(() => null);
          throw new Error(d?.error ?? "No se pudo guardar una sección.");
        }
      }

      setMessage("Cambios guardados correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f6f8] text-slate-950">
      {/* Toolbar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1600px] flex-wrap items-center justify-between gap-3 px-3 py-2 sm:px-5">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-slate-500 hover:bg-violet-50 hover:text-violet-700">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" /> Dashboard
              </Link>
            </Button>
            <div>
              <p className="max-w-40 truncate text-sm font-semibold leading-tight text-slate-950 sm:max-w-none">
                {businessName}
              </p>
              <p className="text-xs text-slate-400">{initialSite.businessType}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button asChild variant="outline" size="sm" className="border-slate-200 bg-white text-slate-700 hover:bg-violet-50 hover:text-violet-700">
              <Link href={`/preview/${initialSite.id}`} target="_blank">
                <Eye className="h-4 w-4" /> Ver preview
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 bg-white text-slate-700 hover:bg-violet-50 hover:text-violet-700"
              onClick={() =>
                alert(
                  "La publicación real (dominio + hosting) llegará en una fase futura."
                )
              }
            >
              <Rocket className="h-4 w-4" /> Publicar
            </Button>
            <Button size="sm" className="bg-violet-700 text-white hover:bg-violet-800" onClick={save} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar cambios
            </Button>
          </div>
        </div>
        {(message || error) && (
          <div
            role="status"
            className={`px-4 py-2 text-center text-sm ${
              error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {error ?? message}
          </div>
        )}
      </header>

      <div className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-0 lg:grid-cols-[360px_1fr]">
        {/* Controls */}
        <aside className="border-b border-slate-200 bg-white p-4 lg:max-h-[calc(100dvh-65px)] lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <Section title="Datos del negocio">
            <Field label="Nombre">
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={fieldClass}
              />
            </Field>
            <Field label="Teléfono">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} />
            </Field>
            <Field label="Email">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
            </Field>
            <Field label="Ubicación">
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={fieldClass}
              />
            </Field>
          </Section>

          <Section title="Colores">
            <div className="grid gap-3">
              <ColorField label="Primario" value={primary} onChange={setPrimary} />
              <ColorField
                label="Secundario"
                value={secondary}
                onChange={setSecondary}
              />
              <ColorField label="Acento" value={accent} onChange={setAccent} />
            </div>
          </Section>

          <Section title={isMultipage ? "Páginas y secciones" : "Secciones"}>
            {isMultipage && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {navPages.map((p) => (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => setPreviewPage(p.slug)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      previewPage === p.slug
                        ? "bg-violet-700 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700"
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-2">
              {(() => {
                const listSections = sections
                  .filter((s) =>
                    isMultipage ? s.pageSlug === previewPage : true
                  )
                  .sort((a, b) => a.order - b.order);
                return listSections.map((s, i) => {
                const open = openId === s.id;
                const isLast = i === listSections.length - 1;
                return (
                  <div
                    key={s.id}
                    className="rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="flex items-center justify-between gap-2 p-3">
                      <button
                        type="button"
                        className="flex flex-1 items-center gap-2 text-left"
                        onClick={() => setOpenId(open ? null : s.id)}
                      >
                        <Badge
                          variant={s.isVisible ? "secondary" : "muted"}
                          className={
                            s.isVisible
                              ? "bg-violet-100 text-violet-700"
                              : "bg-slate-100 text-slate-500"
                          }
                        >
                          {SECTION_LABELS[s.type] ?? s.type}
                        </Badge>
                        {!s.isVisible && (
                          <span className="text-xs text-slate-400">oculta</span>
                        )}
                      </button>
                      <div className="flex items-center gap-1">
                        <IconBtn
                          title="Subir"
                          disabled={i === 0}
                          onClick={() => move(s.id, -1)}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn
                          title="Bajar"
                          disabled={isLast}
                          onClick={() => move(s.id, 1)}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn
                          title={s.isVisible ? "Ocultar" : "Mostrar"}
                          onClick={() =>
                            updateSection(s.id, { isVisible: !s.isVisible })
                          }
                        >
                          {s.isVisible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </IconBtn>
                      </div>
                    </div>

                    {open && (
                      <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-3">
                        <Field label="Título">
                          <Input
                            value={s.title}
                            className={fieldClass}
                            onChange={(e) =>
                              updateSection(s.id, { title: e.target.value })
                            }
                          />
                        </Field>
                        <Field label="Subtítulo">
                          <Input
                            value={s.subtitle}
                            className={fieldClass}
                            onChange={(e) =>
                              updateSection(s.id, { subtitle: e.target.value })
                            }
                          />
                        </Field>
                        <Field label="Texto">
                          <Textarea
                            value={s.body}
                            rows={4}
                            className={fieldClass}
                            onChange={(e) =>
                              updateSection(s.id, { body: e.target.value })
                            }
                          />
                        </Field>
                        {(s.type === "hero" ||
                          s.type === "cta" ||
                          s.type === "contact") && (
                          <Field label="Texto del botón (CTA)">
                            <Input
                              value={s.ctaText}
                              className={fieldClass}
                              onChange={(e) =>
                                updateSection(s.id, { ctaText: e.target.value })
                              }
                            />
                          </Field>
                        )}
                      </div>
                    )}
                  </div>
                );
                });
              })()}
            </div>
          </Section>
        </aside>

        {/* Live preview */}
        <main className="soft-grid bg-[#f5f6f8] p-3 sm:p-5 lg:max-h-[calc(100dvh-65px)] lg:overflow-y-auto">
          <div className="mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/60">
            <SitePreview
              businessName={businessName}
              businessType={initialSite.businessType}
              phone={phone}
              email={email}
              location={location}
              theme={previewTheme}
              visualStyle={initialSite.visualStyle}
              sections={sections}
              navPages={navPages}
              currentPageSlug={previewPage}
              onSelectPage={setPreviewPage}
              editable
            />
          </div>
        </main>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-violet-700">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-600">{label}</Label>
      {children}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-600">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 border-slate-200 bg-white px-2 text-xs text-slate-700 focus-visible:ring-violet-500"
        />
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-violet-50 hover:text-violet-700 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
