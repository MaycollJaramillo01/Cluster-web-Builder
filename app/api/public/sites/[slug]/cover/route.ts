import { createElement as h, type ReactNode } from "react";
import { ImageResponse } from "next/og";

import { prisma } from "@/lib/db";
import { getDesignPreset, type HeroStyle } from "@/lib/site/design";
import { sectionImageUrl } from "@/lib/site/images";
import { getContrastText } from "@/lib/site/theme-surface";
import { themeFromSite } from "@/lib/site/theme";
import { normalizeSiteContentV2, normalizeThemeV2 } from "@/lib/site/v2-schema";

export const runtime = "nodejs";

const size = { width: 1200, height: 900 };

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findFirst({
    where: { publicSlug: slug, status: "PUBLISHED" },
    select: {
      businessName: true,
      businessType: true,
      visualStyle: true,
      builderVersion: true,
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
      coverUrl: true,
      blueprintJson: true,
      contentJson: true,
      designJson: true,
      sections: {
        where: { type: "hero", isVisible: true },
        orderBy: { order: "asc" },
        take: 1,
        select: { title: true, content: true },
      },
    },
  });

  if (!site) return new Response("Portada no encontrada", { status: 404 });

  const preset = getDesignPreset(site.visualStyle);
  const legacyHero = asRecord(site.sections[0]?.content);
  const v2Content = site.builderVersion === 2 ? normalizeSiteContentV2(site.contentJson) : null;
  const theme = site.builderVersion === 2 ? normalizeThemeV2(site.designJson) : themeFromSite(site);
  const title = v2Content?.hero.title || site.sections[0]?.title || site.businessName;
  const subtitle = v2Content?.hero.subtitle || asString(legacyHero.subtitle) || site.businessType;
  const body = v2Content?.hero.body || asString(legacyHero.body);
  const prompt = asString(legacyHero.imagePrompt) || `${site.businessType} professional business`;
  const photo = heroPhoto(preset.heroStyle);
  const photoUrl = imageUrlFor(
    v2Content?.hero.media || v2Content?.about.media || v2Content?.media[0]?.url || site.coverUrl,
    request.url,
  ) || (photo ? `${new URL(sectionImageUrl({ prompt, businessType: site.businessType, ...photo }), request.url).toString()}&format=jpeg` : null);

  return new ImageResponse(
    h("div", { style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: theme.background, color: theme.text, fontFamily: "Arial, sans-serif" } },
      h("div", { style: { height: 72, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 48px", borderBottom: `1px solid ${theme.text}22`, background: theme.background } },
        h("strong", { style: { fontSize: 22, letterSpacing: "-0.03em" } }, site.businessName),
        h("div", { style: { display: "flex", gap: 28, alignItems: "center", fontSize: 13, opacity: 0.7 } },
          h("span", null, "Servicios"), h("span", null, "Nosotros"), h("span", null, "Contacto"),
          h("span", { style: { padding: "10px 18px", color: getContrastText(theme.primary), background: theme.primary, borderRadius: preset.buttonRadius } }, "Contactar"),
        ),
      ),
      renderHeroCover({ heroStyle: preset.heroStyle, title, subtitle, body, photoUrl, theme, uppercase: preset.uppercaseHeadings }),
    ),
    {
      ...size,
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" },
    },
  );
}

function renderHeroCover({ heroStyle, title, subtitle, body, photoUrl, theme, uppercase }: {
  heroStyle: HeroStyle;
  title: string;
  subtitle: string;
  body: string;
  photoUrl: string | null;
  theme: ReturnType<typeof themeFromSite>;
  uppercase: boolean;
}): ReactNode {
  const heading = uppercase ? title.toUpperCase() : title;

  if (heroStyle === "gradient") {
    return h("div", { style: { position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", textAlign: "center", color: "#fff", background: theme.secondary } },
      photoUrl ? h("img", { src: photoUrl, alt: "", style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } }) : null,
      h("div", { style: { position: "absolute", inset: 0, background: `linear-gradient(135deg, ${theme.secondary}F2, ${theme.primary}C9 58%, ${theme.accent}99)` } }),
      h("div", { style: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: 72 } },
        h("h1", { style: { margin: 0, maxWidth: 960, fontSize: 78, lineHeight: 0.98, letterSpacing: "-0.055em" } }, heading),
        h("p", { style: { margin: "28px 0 0", maxWidth: 760, fontSize: 25, lineHeight: 1.35, opacity: 0.9 } }, subtitle),
      ),
    );
  }

  if (heroStyle === "poster") {
    return h("div", { style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "64px 58px", color: getContrastText(theme.accent), background: theme.accent } },
      h("p", { style: { margin: "0 0 30px", fontSize: 16, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase" } }, subtitle),
      h("h1", { style: { margin: 0, maxWidth: 1060, fontSize: 104, lineHeight: 0.86, letterSpacing: "-0.075em", textTransform: "uppercase" } }, heading),
      body ? h("p", { style: { margin: "34px 0 0", maxWidth: 680, fontSize: 22, lineHeight: 1.4 } }, body) : null,
    );
  }

  if (heroStyle === "minimal") {
    return h("div", { style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "70px 90px", background: theme.background } },
      h("div", { style: { width: 72, height: 7, marginBottom: 30, background: theme.accent } }),
      h("h1", { style: { margin: 0, maxWidth: 940, fontSize: 84, lineHeight: 0.98, letterSpacing: "-0.06em" } }, heading),
      h("p", { style: { margin: "28px 0 0", maxWidth: 720, fontSize: 24, lineHeight: 1.4, opacity: 0.68 } }, subtitle),
    );
  }

  if ((heroStyle === "split" || heroStyle === "editorial") && photoUrl) {
    const editorial = heroStyle === "editorial";
    return h("div", { style: { flex: 1, display: "flex", flexDirection: editorial ? "row-reverse" : "row", background: theme.background } },
      h("div", { style: { width: editorial ? "45%" : "52%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "58px 52px" } },
        h("p", { style: { margin: "0 0 24px", color: theme.primary, fontSize: 15, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase" } }, subtitle),
        h("h1", { style: { margin: 0, fontSize: editorial ? 72 : 66, lineHeight: 0.98, letterSpacing: "-0.06em" } }, heading),
        body ? h("p", { style: { margin: "26px 0 0", fontSize: 20, lineHeight: 1.45, opacity: 0.68 } }, body.slice(0, 180)) : null,
      ),
      h("img", { src: photoUrl, alt: "", style: { width: editorial ? "55%" : "48%", height: "100%", objectFit: "cover" } }),
    );
  }

  return h("div", { style: { position: "relative", flex: 1, display: "flex", alignItems: "flex-end", overflow: "hidden", background: theme.secondary } },
    photoUrl ? h("img", { src: photoUrl, alt: "", style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } }) : null,
    h("div", { style: { position: "absolute", inset: 0, background: `linear-gradient(180deg, ${theme.secondary}22, ${theme.secondary}f2)` } }),
    h("div", { style: { position: "relative", display: "flex", flexDirection: "column", padding: "62px 58px", color: "#fff" } },
      h("p", { style: { margin: "0 0 20px", color: theme.accent, fontSize: 16, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase" } }, subtitle),
      h("h1", { style: { margin: 0, maxWidth: 980, fontSize: 82, lineHeight: 0.94, letterSpacing: "-0.06em" } }, heading),
      body ? h("p", { style: { margin: "26px 0 0", maxWidth: 740, fontSize: 21, lineHeight: 1.45, opacity: 0.86 } }, body.slice(0, 180)) : null,
    ),
  );
}

function heroPhoto(heroStyle: HeroStyle) {
  if (heroStyle === "gradient") return { width: 1600, height: 1000, seed: "hero-gradient" };
  if (heroStyle === "editorial") return { width: 760, height: 940, seed: "hero-editorial" };
  if (heroStyle === "framed") return { width: 1500, height: 900, seed: "hero-framed" };
  if (heroStyle === "immersive") return { width: 1800, height: 1100, seed: "hero-immersive" };
  if (heroStyle === "split") return { width: 900, height: 700, seed: "hero-split" };
  if (heroStyle === "cinematic") return { width: 1900, height: 1200, seed: "hero-cinematic" };
  if (heroStyle === "image") return { width: 1600, height: 1000, seed: "hero-bg" };
  return null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function imageUrlFor(value: unknown, baseUrl: string): string | null {
  if (typeof value !== "string" || !value.trim() || value.startsWith("data:")) return null;
  try {
    const url = new URL(value, baseUrl);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
