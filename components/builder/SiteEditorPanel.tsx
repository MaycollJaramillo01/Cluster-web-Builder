"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  CircleCheck,
  CheckSquare,
  ExternalLink,
  Download,
  Inbox,
  GitBranch,
  Globe,
  HelpCircle,
  Image,
  Layout,
  Layers3,
  Loader2,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Palette,
  Rocket,
  Save,
  Shield,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";

import { SitePreview } from "@/components/builder/SitePreview";
import { EditorContentPanel, type EditorSectionMeta } from "@/components/builder/EditorContentPanel";
import { EditorDesignPanel } from "@/components/builder/EditorDesignPanel";
import { Button } from "@/components/ui/button";
import type { SiteTheme } from "@/lib/site/blueprint";
import type { RenderSection } from "@/lib/site/section";
import type { SocialLinks } from "@/lib/site/social-links";
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
  publicSlug: string;
  publicUrl: string;
  logoUrl: string | null;
  coverUrl: string | null;
  theme: SiteTheme;
  socialLinks?: SocialLinks;
};

type SavePayload = {
  site: {
    businessName: string;
    phone: string | null;
    email: string | null;
    location: string | null;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  sections: RenderSection[];
};

/* ------------------------------------------------------------------ */
/* Section field configuration                                          */
/* ------------------------------------------------------------------ */

const SECTION_META: Record<string, EditorSectionMeta> = {
  hero: {
    icon: Sparkles,
    label: "Hero",
    fields: [
      {
        key: "title",
        label: "Titular principal",
        type: "input",
        placeholder: "El mensaje central de tu negocio",
        hint: "Heading H1 — lo primero que leerá el visitante",
      },
      {
        key: "subtitle",
        label: "Tagline",
        type: "input",
        placeholder: "Una línea que refuerza el mensaje",
      },
      {
        key: "body",
        label: "Descripción",
        type: "textarea",
        placeholder: "Texto de apoyo breve y concreto",
        rows: 3,
      },
      {
        key: "ctaText",
        label: "Texto del botón",
        type: "input",
        placeholder: "Ej: Contáctanos, Ver servicios",
      },
      {
        key: "ctaLink",
        label: "URL del botón",
        type: "input",
        placeholder: "#contact o https://...",
        hint: "Deja #contact para que lleve al formulario de contacto",
      },
    ],
  },
  services: {
    icon: Briefcase,
    label: "Servicios",
    fields: [
      {
        key: "title",
        label: "Título de sección",
        type: "input",
        placeholder: "Ej: Nuestros Servicios",
      },
      {
        key: "subtitle",
        label: "Kicker (texto pequeño encima del título)",
        type: "input",
        placeholder: "Ej: Lo que hacemos",
      },
      {
        key: "body",
        label: "Intro de sección",
        type: "textarea",
        placeholder: "Descripción breve opcional",
        rows: 2,
      },
    ],
  },
  about: {
    icon: Users,
    label: "Nosotros",
    fields: [
      {
        key: "title",
        label: "Título",
        type: "input",
        placeholder: "Ej: Quiénes somos",
      },
      {
        key: "subtitle",
        label: "Kicker",
        type: "input",
        placeholder: "Ej: Nuestra historia",
      },
      {
        key: "body",
        label: "Texto del negocio",
        type: "textarea",
        placeholder: "Quiénes son, qué los motiva, por qué importa",
        rows: 5,
      },
    ],
  },
  about_us: {
    icon: Users,
    label: "Nosotros",
    fields: [
      {
        key: "title",
        label: "Título",
        type: "input",
        placeholder: "Ej: Quiénes somos",
      },
      {
        key: "subtitle",
        label: "Kicker",
        type: "input",
        placeholder: "Ej: Nuestra historia",
      },
      {
        key: "body",
        label: "Texto del negocio",
        type: "textarea",
        placeholder: "Quiénes son, qué los motiva, por qué importa",
        rows: 5,
      },
    ],
  },
  benefits: {
    icon: CheckSquare,
    label: "Beneficios",
    fields: [
      {
        key: "title",
        label: "Título de sección",
        type: "input",
        placeholder: "Ej: ¿Por qué elegirnos?",
      },
      {
        key: "subtitle",
        label: "Kicker",
        type: "input",
        placeholder: "Ej: Ventajas clave",
      },
      {
        key: "body",
        label: "Descripción introductoria",
        type: "textarea",
        placeholder: "Contexto opcional sobre los beneficios",
        rows: 2,
      },
    ],
  },
  testimonials: {
    icon: MessageCircle,
    label: "Testimonios",
    fields: [
      {
        key: "title",
        label: "Título de sección",
        type: "input",
        placeholder: "Ej: Lo que dicen nuestros clientes",
      },
      {
        key: "subtitle",
        label: "Kicker",
        type: "input",
        placeholder: "Ej: Testimonios",
      },
    ],
  },
  faq: {
    icon: HelpCircle,
    label: "Preguntas frecuentes",
    fields: [
      {
        key: "title",
        label: "Título de sección",
        type: "input",
        placeholder: "Ej: Preguntas frecuentes",
      },
      {
        key: "subtitle",
        label: "Kicker",
        type: "input",
        placeholder: "Ej: FAQ",
      },
      {
        key: "body",
        label: "Texto introductorio",
        type: "textarea",
        placeholder: "Descripción opcional",
        rows: 2,
      },
    ],
  },
  process: {
    icon: GitBranch,
    label: "Proceso",
    fields: [
      {
        key: "title",
        label: "Título de sección",
        type: "input",
        placeholder: "Ej: Cómo trabajamos",
      },
      {
        key: "subtitle",
        label: "Kicker",
        type: "input",
        placeholder: "Ej: Nuestro proceso",
      },
      {
        key: "body",
        label: "Descripción introductoria",
        type: "textarea",
        placeholder: "Contexto breve sobre el proceso",
        rows: 2,
      },
    ],
  },
  contact: {
    icon: Mail,
    label: "Contacto",
    fields: [
      {
        key: "title",
        label: "Título de sección",
        type: "input",
        placeholder: "Ej: Contáctanos",
      },
      {
        key: "body",
        label: "Mensaje bajo el título",
        type: "textarea",
        placeholder: "Ej: Estamos listos para ayudarte",
        rows: 2,
      },
      {
        key: "ctaText",
        label: "Texto del botón de envío",
        type: "input",
        placeholder: "Ej: Enviar mensaje",
      },
    ],
  },
  cta: {
    icon: Megaphone,
    label: "Llamado a la acción",
    fields: [
      {
        key: "title",
        label: "Titular",
        type: "input",
        placeholder: "Ej: ¿Listo para empezar?",
      },
      {
        key: "subtitle",
        label: "Subtítulo de apoyo",
        type: "input",
        placeholder: "Ej: Sin compromisos, sin costos ocultos",
      },
      {
        key: "ctaText",
        label: "Texto del botón",
        type: "input",
        placeholder: "Ej: Agendar llamada",
      },
      {
        key: "ctaLink",
        label: "URL del botón",
        type: "input",
        placeholder: "#contact o https://...",
        hint: "Deja #contact para que lleve al formulario de contacto",
      },
    ],
  },
  trust_badges: {
    icon: Shield,
    label: "Sellos de confianza",
    fields: [
      {
        key: "title",
        label: "Título de sección",
        type: "input",
        placeholder: "Ej: Respaldados por",
      },
      {
        key: "subtitle",
        label: "Kicker",
        type: "input",
        placeholder: "Ej: Confianza",
      },
    ],
  },
  gallery: {
    icon: Image,
    label: "Galería",
    fields: [
      {
        key: "title",
        label: "Título de sección",
        type: "input",
        placeholder: "Ej: Galería de proyectos",
      },
      {
        key: "subtitle",
        label: "Kicker",
        type: "input",
        placeholder: "Ej: Nuestro trabajo",
      },
    ],
  },
  location: {
    icon: MapPin,
    label: "Ubicación",
    fields: [
      {
        key: "title",
        label: "Título de sección",
        type: "input",
        placeholder: "Ej: Dónde encontrarnos",
      },
      {
        key: "body",
        label: "Descripción o indicaciones",
        type: "textarea",
        placeholder: "Dirección, horarios u otras indicaciones",
        rows: 3,
      },
    ],
  },
  pricing: {
    icon: Tag,
    label: "Precios",
    fields: [
      {
        key: "title",
        label: "Título de sección",
        type: "input",
        placeholder: "Ej: Planes y precios",
      },
      {
        key: "subtitle",
        label: "Kicker",
        type: "input",
        placeholder: "Ej: Inversión",
      },
      {
        key: "body",
        label: "Descripción introductoria",
        type: "textarea",
        placeholder: "Contexto sobre los planes",
        rows: 2,
      },
    ],
  },
  footer: {
    icon: Layout,
    label: "Pie de página",
    fields: [
      {
        key: "title",
        label: "Nombre en el footer",
        type: "input",
        placeholder: "Deja vacío para usar el nombre del negocio",
        hint: "Se muestra como encabezado del footer",
      },
      {
        key: "subtitle",
        label: "Tagline del footer",
        type: "input",
        placeholder: "Ej: Tu aliado de confianza",
      },
    ],
  },
};

const DEFAULT_SECTION_META: EditorSectionMeta = {
  icon: Layers3,
  label: "Sección",
  fields: [
    { key: "title", label: "Título", type: "input", placeholder: "Título de la sección" },
    { key: "subtitle", label: "Subtítulo", type: "input", placeholder: "Subtítulo opcional" },
    { key: "body", label: "Texto", type: "textarea", placeholder: "Contenido de la sección", rows: 4 },
  ],
};

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export function SiteEditorPanel({
  initialSite,
  initialSections,
  isAuthenticated,
}: {
  initialSite: EditorSite;
  initialSections: RenderSection[];
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const publishStartedRef = useRef(false);
  const downloadStartedRef = useRef(false);
  const pendingSaveStartedRef = useRef(false);
  const pendingSaveKey = `cluster:pending-save:${initialSite.id}`;
  const [panel, setPanel] = useState<"content" | "design">("content");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
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
  const [openId, setOpenId] = useState<string | null>(initialSections[0]?.id ?? null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [published, setPublished] = useState(initialSite.status === "PUBLISHED");
  const [publicUrl, setPublicUrl] = useState(initialSite.publicUrl);
  const [error, setError] = useState<string | null>(null);

  const previewTheme: SiteTheme = useMemo(
    () => ({ ...initialSite.theme, primary, secondary, accent }),
    [initialSite.theme, primary, secondary, accent]
  );

  const visibleSections = [...sections].sort((a, b) => a.order - b.order);

  const updateSection = (id: string, patch: Partial<RenderSection>) => {
    setDirty(true);
    setSections((current) =>
      current.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const move = (id: string, direction: -1 | 1) => {
    setSections((current) => {
      const section = current.find((s) => s.id === id);
      if (!section || section.type === "footer") return current;
      const siblings = current
        .filter((s) => s.type !== "footer")
        .sort((a, b) => a.order - b.order);
      const index = siblings.findIndex((s) => s.id === id);
      const target = index + direction;
      if (target < 0 || target >= siblings.length) return current;
      setDirty(true);
      const adjacent = siblings[target];
      return current.map((s) =>
        s.id === section.id
          ? { ...s, order: adjacent.order }
          : s.id === adjacent.id
          ? { ...s, order: section.order }
          : s
      );
    });
  };

  const persistSave = useCallback(async (payload: SavePayload) => {
      const siteResponse = await fetch(`/api/sites/${initialSite.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.site),
      });
      if (!siteResponse.ok) {
        const data = await siteResponse.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudieron guardar los datos del sitio.");
      }

      for (const section of payload.sections) {
        const response = await fetch(
          `/api/sites/${initialSite.id}/sections/${section.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: section.title,
              subtitle: section.subtitle,
              body: section.body,
              ctaText: section.ctaText,
              ctaLink: section.ctaLink,
              isVisible: section.isVisible,
              order: section.order,
            }),
          }
        );
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error ?? "No se pudo guardar una sección.");
        }
      }
  }, [initialSite.id]);

  const save = async () => {
    const payload: SavePayload = {
      site: {
        businessName,
        phone: phone || null,
        email: email || null,
        location: location || null,
        primaryColor: primary,
        secondaryColor: secondary,
        accentColor: accent,
      },
      sections,
    };

    if (!isAuthenticated) {
      sessionStorage.setItem(pendingSaveKey, JSON.stringify(payload));
      router.push(`/login?from=${encodeURIComponent(`/builder/${initialSite.id}`)}`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await persistSave(payload);
      sessionStorage.removeItem(pendingSaveKey);
      setDirty(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || pendingSaveStartedRef.current) return;
    const stored = sessionStorage.getItem(pendingSaveKey);
    if (!stored) return;
    pendingSaveStartedRef.current = true;

    try {
      const payload = JSON.parse(stored) as SavePayload;
      void persistSave(payload)
        .then(() => {
          sessionStorage.removeItem(pendingSaveKey);
          window.location.replace(`/builder/${initialSite.id}`);
        })
        .catch((reason) => setError(reason instanceof Error ? reason.message : "Error al guardar."));
    } catch {
      sessionStorage.removeItem(pendingSaveKey);
    }
  }, [initialSite.id, isAuthenticated, pendingSaveKey, persistSave]);

  const publish = useCallback(async () => {
    setPublishing(true);
    setError(null);

    try {
      const response = await fetch(`/api/sites/${initialSite.id}/publish`, {
        method: "POST",
      });

      if (response.status === 401) {
        const returnTo = `/builder/${initialSite.id}?publish=1`;
        router.push(`/login?from=${encodeURIComponent(returnTo)}`);
        return;
      }

      const data = await response.json().catch(() => null);
      if (response.status === 402 || data?.upgradeRequired) {
        router.push(`/billing?from=${encodeURIComponent(`/builder/${initialSite.id}`)}`);
        return;
      }
      if (!response.ok) {
        throw new Error(data?.error ?? "No se pudo publicar el sitio.");
      }

      setPublished(true);
      setPublicUrl(data.site.publicUrl);
      router.replace(`/builder/${initialSite.id}`, { scroll: false });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Error al publicar.");
    } finally {
      setPublishing(false);
    }
  }, [initialSite.id, router]);

  useEffect(() => {
    if (searchParams.get("publish") !== "1" || publishStartedRef.current) return;
    publishStartedRef.current = true;
    void publish();
  }, [publish, searchParams]);

  const download = useCallback(async () => {
    setDownloading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sites/${initialSite.id}/download`);
      if (response.status === 401) {
        router.push(`/login?from=${encodeURIComponent(`/builder/${initialSite.id}?download=1`)}`);
        return;
      }
      if (response.status === 402) {
        router.push(`/billing?from=${encodeURIComponent(`/builder/${initialSite.id}`)}`);
        return;
      }
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "No se pudo descargar el sitio.");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(await response.blob());
      link.download = `${initialSite.publicSlug}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
      router.replace(`/builder/${initialSite.id}`, { scroll: false });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Error al descargar.");
    } finally {
      setDownloading(false);
    }
  }, [initialSite.id, initialSite.publicSlug, router]);

  useEffect(() => {
    if (searchParams.get("download") !== "1" || downloadStartedRef.current) return;
    downloadStartedRef.current = true;
    void download();
  }, [download, searchParams]);

  const change =
    (setter: (value: string) => void) =>
    (value: string) => {
      setter(value);
      setDirty(true);
    };

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-[#0f0d15]/95 backdrop-blur-xl">
        <div className="flex min-h-16 items-center justify-between gap-3 px-3 py-2 sm:px-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Button asChild variant="ghost" size="icon" className="h-11 w-11">
              <Link href={isAuthenticated ? "/dashboard" : "/"} aria-label={isAuthenticated ? "Volver al dashboard" : "Volver al inicio"}>
                <ArrowLeft />
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{businessName}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    dirty ? "bg-[#ffb869]" : "bg-emerald-400"
                  )}
                />
                {saving ? "Guardando…" : dirty ? "Cambios sin guardar" : isAuthenticated ? "Guardado" : "Borrador temporal"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Button asChild variant="outline" size="sm" className="hidden min-h-11 md:inline-flex">
                <Link href={`/builder/${initialSite.id}/leads`}><Inbox className="h-4 w-4" /> Contactos</Link>
              </Button>
            )}
            {isAuthenticated && (
              <Button asChild variant="outline" size="sm" className="hidden min-h-11 md:inline-flex">
                <Link href={`/builder/${initialSite.id}/analytics`}><BarChart3 className="h-4 w-4" /> Analytics</Link>
              </Button>
            )}
            {isAuthenticated && (
              <Button asChild variant="outline" size="sm" className="hidden min-h-11 lg:inline-flex">
                <Link href={`/builder/${initialSite.id}/domain`}><Globe className="h-4 w-4" /> Dominio</Link>
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => void download()}
              disabled={downloading || dirty}
              title={dirty ? "Guarda tus cambios antes de descargar" : undefined}
              className="hidden min-h-11 gap-2 md:inline-flex"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Descargar ZIP
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden min-h-11 sm:inline-flex"
            >
              <Link href={published ? publicUrl : `/preview/${initialSite.id}`} target="_blank">
                Vista previa <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={save}
              disabled={saving || !dirty}
              className="min-h-11 gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Guardar cambios</span>
              <span className="sm:hidden">Guardar</span>
            </Button>
            <Button
              size="sm"
              onClick={() => void publish()}
              disabled={publishing || published || dirty}
              title={dirty ? "Guarda tus cambios antes de publicar" : undefined}
              className="min-h-11 gap-2"
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : published ? (
                <CircleCheck className="h-4 w-4" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              <span className="sm:hidden">{publishing ? "Publicando…" : published ? "Publicado" : "Publicar"}</span>
              <span className="hidden sm:inline">{publishing ? "Publicando…" : published ? "Publicado" : "Publicar sitio"}</span>
            </Button>
          </div>
        </div>
        {error && (
          <div
            role="alert"
            className="border-t border-red-900 bg-red-950 px-4 py-2 text-center text-sm text-[#ffb4ab]"
          >
            {error}
          </div>
        )}
        {!isAuthenticated && !error && (
          <div className="border-t border-[#3d3549] bg-[#1d1730] px-4 py-2 text-center text-xs text-[#d8c8f8]">
            Puedes editar libremente. Inicia sesión al guardar o publicar; este borrador expira en 72 horas.
          </div>
        )}
      </header>

      {/* ── Mobile tab toggle ── */}
      <div
        className="grid grid-cols-2 border-b border-border bg-[#15121b] p-2 lg:hidden"
        aria-label="Modo del editor"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobileView === "edit"}
          onClick={() => setMobileView("edit")}
          className={cn(
            "min-h-11 rounded text-sm font-semibold transition-colors",
            mobileView === "edit"
              ? "bg-[#8b5cf6] text-white"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Editar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileView === "preview"}
          onClick={() => setMobileView("preview")}
          className={cn(
            "min-h-11 rounded text-sm font-semibold transition-colors",
            mobileView === "preview"
              ? "bg-[#8b5cf6] text-white"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Vista previa
        </button>
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* ── Left panel ── */}
        <aside
          className={cn(
            "border-r border-border bg-[#15121b]",
            mobileView !== "edit" && "hidden lg:block"
          )}
        >
          {/* Panel tabs */}
          <div className="sticky top-0 z-10 grid grid-cols-2 gap-1.5 border-b border-border bg-[#15121b] p-3" role="tablist" aria-label="Panel del editor">
            <PanelTab
              active={panel === "content"}
              onClick={() => setPanel("content")}
            >
              <Layers3 className="h-4 w-4" /> Contenido
            </PanelTab>
            <PanelTab
              active={panel === "design"}
              onClick={() => setPanel("design")}
            >
              <Palette className="h-4 w-4" /> Diseño
            </PanelTab>
          </div>

          {/* Panel body */}
          <div className="p-4 lg:max-h-[calc(100dvh-121px)] lg:overflow-y-auto">
            {panel === "content" ? (
              <EditorContentPanel
                sections={visibleSections}
                openId={openId}
                sectionMeta={SECTION_META}
                defaultSectionMeta={DEFAULT_SECTION_META}
                onOpenChange={setOpenId}
                onMove={move}
                onUpdate={updateSection}
              />
            ) : (
              <EditorDesignPanel
                siteId={initialSite.id}
                businessName={businessName}
                phone={phone}
                email={email}
                location={location}
                primary={primary}
                secondary={secondary}
                accent={accent}
                onBusinessNameChange={change(setBusinessName)}
                onPhoneChange={change(setPhone)}
                onEmailChange={change(setEmail)}
                onLocationChange={change(setLocation)}
                onPrimaryChange={change(setPrimary)}
                onSecondaryChange={change(setSecondary)}
                onAccentChange={change(setAccent)}
              />
            )}
          </div>
        </aside>

        {/* ── Right preview ── */}
        <main
          className={cn(
            "min-w-0 bg-[#0f0d15]",
            mobileView !== "preview" && "hidden lg:block"
          )}
        >
          {/* Preview top bar */}
          <div className="flex min-h-12 items-center justify-between border-b border-border px-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Vista previa del sitio
              </span>
            </div>
            <Link
              href={published ? publicUrl : `/preview/${initialSite.id}`}
              target="_blank"
              className="flex min-h-10 items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Abrir en nueva pestaña
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Preview canvas */}
          <div className="soft-grid p-3 sm:p-6 lg:max-h-[calc(100dvh-113px)] lg:overflow-y-auto">
            <div className="mx-auto overflow-hidden rounded-xl border border-[#3d3549] bg-white shadow-[0_32px_96px_rgb(0_0_0/0.5)]">
              <SitePreview
                businessName={businessName}
                businessType={initialSite.businessType}
                phone={phone}
                email={email}
                location={location}
                logoUrl={initialSite.logoUrl}
                coverUrl={initialSite.coverUrl}
                theme={previewTheme}
                visualStyle={initialSite.visualStyle}
                sections={sections}
                socialLinks={initialSite.socialLinks}
                editable
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                        */
/* ------------------------------------------------------------------ */

function PanelTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex min-h-11 items-center justify-center gap-2 rounded text-sm font-semibold transition-colors",
        active
          ? "bg-[#2c2141] text-[#e9ddff]"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
