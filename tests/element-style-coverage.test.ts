import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { TestimonialsBlock } from "@/components/site-blocks/TestimonialsBlock";
import { TEXT_STYLE_COVERED_TYPES } from "@/lib/site/element-style";
import { exportSiteHtml } from "@/lib/site/export-html";
import { getDesignPreset } from "@/lib/site/design";
import type { RenderSection } from "@/lib/site/section";

const theme = { primary: "#2563eb", secondary: "#0f172a", accent: "#f59e0b", background: "#ffffff", text: "#111827" };

function section(type: string, color = "#123456"): RenderSection {
  return {
    id: type,
    type,
    title: `Titulo ${type}`,
    subtitle: `Subtitulo ${type}`,
    body: `Cuerpo ${type}`,
    ctaText: "",
    ctaLink: "",
    imagePrompt: "",
    mediaUrl: type === "image" ? "https://example.com/photo.webp" : type === "video" ? "https://example.com/video.mp4" : "",
    altText: "Medio de prueba",
    order: 0,
    isVisible: true,
    settings: { styleOverrides: { title: { color }, body: { color: "#654321" }, subtitle: { color: "#abcdef" } } },
  };
}

function exportSection(value: RenderSection) {
  return exportSiteHtml({
    businessName: "Negocio Prueba",
    businessType: "Servicios",
    phone: null,
    email: null,
    location: "Bogota",
    publicSlug: "negocio-prueba",
    showBranding: false,
    visualStyle: "Service",
    theme,
    sections: [value],
  }, "https://example.com/leads");
}

test("los cinco tipos nuevos y el alias legado about exponen estilos de texto", () => {
  for (const type of ["about", "about_us", "footer", "trust_badges", "image", "video"]) {
    assert.ok(TEXT_STYLE_COVERED_TYPES.has(type), `${type} debe exponer controles de texto`);
    const html = exportSection(section(type));
    assert.match(html, /color:#123456/, `${type} debe exportar el color del titulo`);
  }
});

test("imagen y video exportan tambien el estilo de cuerpo", () => {
  for (const type of ["image", "video"]) {
    assert.match(exportSection(section(type)), /color:#654321/, `${type} debe exportar el color del cuerpo`);
  }
});

test("la variante cards de testimonios aplica titulo y subtitulo en la vista en vivo", () => {
  const value = section("testimonials");
  value.settings = {
    ...value.settings,
    items: [{ name: "Ana", quote: "Excelente servicio", rating: 5, source: "Google" }],
  };
  const markup = renderToStaticMarkup(TestimonialsBlock({
    section: value,
    theme,
    preset: { ...getDesignPreset("Service"), testimonialsStyle: "cards" },
    site: { businessName: "Negocio Prueba", businessType: "Servicios" },
    index: 0,
  }));
  assert.match(markup, /color:#123456/);
  assert.match(markup, /color:#abcdef/);
});
