import {
  normalizeCanvasSectionsV2,
  normalizeSiteContentV2,
  type CanvasSectionV2,
  type SiteContentV2,
  type V2WidgetType,
} from "@/lib/site/v2-schema";

export type LaunchReadinessKey = "content" | "contact" | "form" | "media" | "published";

export type LaunchReadinessItem = {
  key: LaunchReadinessKey;
  label: string;
  passed: boolean;
  requiredForPublish: boolean;
  requiredForDownload: boolean;
  detail: string;
};

export type LaunchReadiness = {
  items: LaunchReadinessItem[];
  passed: number;
  total: number;
  canPublish: boolean;
  canDownload: boolean;
  missingForPublish: string[];
  missingForDownload: string[];
};

type SectionLike = {
  type?: string | null;
  title?: string | null;
  isVisible?: boolean | null;
  content?: unknown;
};

type SiteLike = {
  builderVersion?: number | null;
  status?: string | null;
  businessName?: string | null;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  contentJson?: unknown;
  sections?: unknown[];
};

function filled(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function v2Widgets(sections: CanvasSectionV2[]) {
  return sections.flatMap((section) =>
    section.rows.flatMap((row) => row.columns.flatMap((column) => column.widgets)),
  );
}

function hasV2Widget(sections: CanvasSectionV2[], type: V2WidgetType) {
  return v2Widgets(sections).some((widget) => widget.type === type);
}

function hasLocalMedia(content: SiteContentV2, sections: CanvasSectionV2[]) {
  if (filled(content.business.logo) || filled(content.hero.media) || filled(content.about.media)) return true;
  if (content.media.some((item) => filled(item.url))) return true;
  return v2Widgets(sections).some((widget) => {
    if (widget.type !== "image" && widget.type !== "video" && widget.type !== "gallery") return false;
    const data = widget.data || {};
    return Object.values(data).some((value) => {
      if (filled(value)) return true;
      if (Array.isArray(value)) return value.some((entry) => entry && typeof entry === "object" && Object.values(entry as Record<string, unknown>).some(filled));
      return false;
    });
  });
}

export function getLaunchReadinessV2(input: {
  content: unknown;
  sections: unknown[];
  status?: string | null;
}): LaunchReadiness {
  const content = normalizeSiteContentV2(input.content);
  const sections = normalizeCanvasSectionsV2(input.sections);
  const contentReady = filled(content.business.name) && filled(content.hero.title) && (filled(content.hero.subtitle) || filled(content.hero.body));
  const contactReady = filled(content.business.phone) || filled(content.business.email);
  const formReady = hasV2Widget(sections, "form");
  const mediaReady = hasLocalMedia(content, sections);
  return buildLaunchReadiness([
    {
      key: "content",
      label: "Contenido base",
      passed: contentReady,
      requiredForPublish: true,
      requiredForDownload: true,
      detail: "Nombre, título principal y texto del hero.",
    },
    {
      key: "contact",
      label: "Teléfono o email",
      passed: contactReady,
      requiredForPublish: true,
      requiredForDownload: true,
      detail: "Un contacto real para responder leads.",
    },
    {
      key: "form",
      label: "Formulario activo",
      passed: formReady,
      requiredForPublish: true,
      requiredForDownload: true,
      detail: "Un bloque de formulario conectado al endpoint de leads.",
    },
    {
      key: "media",
      label: "Logo o portada",
      passed: mediaReady,
      requiredForPublish: false,
      requiredForDownload: false,
      detail: "Logo, portada, video o fotos propias del negocio.",
    },
    {
      key: "published",
      label: "Sitio publicado",
      passed: input.status === "PUBLISHED",
      requiredForPublish: false,
      requiredForDownload: true,
      detail: "Necesario para que el ZIP mantenga formularios funcionales.",
    },
  ]);
}

export function getSiteLaunchReadiness(site: SiteLike): LaunchReadiness {
  const rawSections = Array.isArray(site.sections) ? site.sections : [];
  if (site.builderVersion === 2) {
    return getLaunchReadinessV2({
      content: site.contentJson,
      sections: rawSections.map((section) => {
        if (section && typeof section === "object" && "content" in section) return (section as SectionLike).content;
        return section;
      }),
      status: site.status,
    });
  }

  const sections = rawSections
    .filter((section): section is SectionLike => Boolean(section) && typeof section === "object")
    .filter((section) => section.isVisible !== false);
  const hasContactSection = sections.some((section) => section.type === "contact");
  const hasContentSection = sections.some((section) => {
    const content = section.content && typeof section.content === "object" ? section.content as Record<string, unknown> : {};
    return section.type === "hero" || filled(section.title) || filled(content.body) || filled(content.subtitle);
  });
  const hasSectionMedia = sections.some((section) => {
    const content = section.content && typeof section.content === "object" ? section.content as Record<string, unknown> : {};
    return filled(content.mediaUrl);
  });

  return buildLaunchReadiness([
    {
      key: "content",
      label: "Contenido base",
      passed: filled(site.businessName) && hasContentSection,
      requiredForPublish: true,
      requiredForDownload: true,
      detail: "Nombre del negocio y al menos una sección con contenido.",
    },
    {
      key: "contact",
      label: "Teléfono o email",
      passed: filled(site.phone) || filled(site.email),
      requiredForPublish: true,
      requiredForDownload: true,
      detail: "Un contacto real para responder leads.",
    },
    {
      key: "form",
      label: "Formulario activo",
      passed: hasContactSection,
      requiredForPublish: true,
      requiredForDownload: true,
      detail: "Una sección de contacto que genere leads.",
    },
    {
      key: "media",
      label: "Logo o portada",
      passed: filled(site.logoUrl) || filled(site.coverUrl) || hasSectionMedia,
      requiredForPublish: false,
      requiredForDownload: false,
      detail: "Logo, portada o fotos propias del negocio.",
    },
    {
      key: "published",
      label: "Sitio publicado",
      passed: site.status === "PUBLISHED",
      requiredForPublish: false,
      requiredForDownload: true,
      detail: "Necesario para que el ZIP mantenga formularios funcionales.",
    },
  ]);
}

function buildLaunchReadiness(items: LaunchReadinessItem[]): LaunchReadiness {
  const missingForPublish = items.filter((item) => item.requiredForPublish && !item.passed).map((item) => item.label);
  const missingForDownload = items.filter((item) => item.requiredForDownload && !item.passed).map((item) => item.label);
  return {
    items,
    passed: items.filter((item) => item.passed).length,
    total: items.length,
    canPublish: missingForPublish.length === 0,
    canDownload: missingForDownload.length === 0,
    missingForPublish,
    missingForDownload,
  };
}
