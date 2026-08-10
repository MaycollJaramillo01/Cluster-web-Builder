import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SitePreview } from "@/components/builder/SitePreview";
import type { SiteTheme } from "@/lib/site/blueprint";
import type { RenderSection } from "@/lib/site/section";
import { getAllTemplateCandidates } from "@/lib/site/template-selection";
import { orderSectionsForTemplate } from "@/lib/site/template-layout";

export const metadata: Metadata = {
  title: "Preview local de template",
  robots: { index: false, follow: false },
};

const FAMILY_THEMES: Record<string, SiteTheme> = {
  service: { primary: "#e85d2a", secondary: "#172033", accent: "#f5be46", background: "#fffaf3", text: "#1d2028" },
  editorial: { primary: "#8b2f22", secondary: "#2c211d", accent: "#d4a373", background: "#f7f1e7", text: "#251f1b" },
  immersive: { primary: "#8b5cf6", secondary: "#111827", accent: "#22d3ee", background: "#080b12", text: "#f8fafc" },
  catalog: { primary: "#2457d6", secondary: "#14213d", accent: "#f59e0b", background: "#f7f8fa", text: "#111827" },
  local: { primary: "#287052", secondary: "#29382f", accent: "#d99b48", background: "#f8f4e9", text: "#243028" },
  minimal: { primary: "#18181b", secondary: "#3f3f46", accent: "#a16207", background: "#fafafa", text: "#18181b" },
};

const DEMO_SECTIONS: RenderSection[] = [
  demoSection("hero", 0, {
    title: "Norte Estudio",
    subtitle: "Arquitectura, interiores y espacios que perduran",
    body: "Diseñamos lugares serenos, funcionales y profundamente conectados con quienes los habitan.",
    ctaText: "Conversemos sobre tu proyecto",
    ctaLink: "#section-contact",
    imagePrompt: "premium contemporary architecture studio warm natural light",
  }),
  demoSection("services", 1, {
    title: "Del concepto al último detalle",
    subtitle: "Una práctica integral para proyectos residenciales y comerciales.",
    settings: {
      items: [
        { name: "Arquitectura", description: "Diseño de espacios precisos, luminosos y hechos para durar.", image: "/sites/aa-painting-remodeling/remodel-5.jpg" },
        { name: "Interiores", description: "Materiales, mobiliario e iluminación en una sola visión.", image: "/sites/aa-painting-remodeling/remodel-2.jpg" },
        { name: "Remodelación", description: "Transformamos estructuras existentes con una mirada contemporánea.", image: "/sites/aa-painting-remodeling/remodel-4.jpg" },
        { name: "Dirección de obra", description: "Coordinación clara para convertir el diseño en una realidad impecable.", image: "/sites/aa-painting-remodeling/painting-3.jpg" },
      ],
    },
  }),
  demoSection("benefits", 2, {
    title: "Diseño con intención",
    subtitle: "Cada decisión responde a una forma de vivir, trabajar y encontrarse.",
    settings: {
      items: [
        { title: "Visión completa", description: "Concepto, presupuesto y ejecución alineados desde el inicio." },
        { title: "Materiales honestos", description: "Selecciones durables que envejecen con carácter." },
        { title: "Proceso cercano", description: "Comunicación directa y decisiones transparentes en cada etapa." },
        { title: "Detalle preciso", description: "Escala, luz y proporción trabajadas como un solo sistema." },
      ],
    },
  }),
  demoSection("process", 3, {
    title: "Un proceso claro",
    subtitle: "Cuatro etapas para avanzar con confianza.",
    settings: {
      items: [
        { title: "Descubrir", description: "Escuchamos tus necesidades y leemos el potencial del lugar." },
        { title: "Definir", description: "Trazamos la dirección creativa, el alcance y las prioridades." },
        { title: "Diseñar", description: "Desarrollamos planos, materiales y cada encuentro constructivo." },
        { title: "Construir", description: "Acompañamos la obra hasta entregar un espacio terminado." },
      ],
    },
  }),
  demoSection("about_us", 4, {
    title: "Espacios tranquilos. Ideas firmes.",
    subtitle: "Un estudio independiente con más de doce años de experiencia.",
    body: "Trabajamos entre arquitectura, interiorismo y construcción para crear proyectos coherentes de principio a fin. Nos interesa lo esencial: buena luz, circulación intuitiva y materiales que se sienten bien con el paso del tiempo.",
    imagePrompt: "architectural design team reviewing plans in bright studio",
    settings: {
      highlights: [
        { title: "Experiencia", description: "12 años diseñando y construyendo", value: "12+" },
        { title: "Proyectos", description: "Espacios residenciales y comerciales", value: "86" },
        { title: "Ciudades", description: "Trabajo desarrollado en tres regiones", value: "03" },
      ],
    },
  }),
  demoSection("gallery", 5, {
    title: "Proyectos seleccionados",
    subtitle: "Casas, espacios de trabajo y lugares para encontrarse.",
    settings: {
      items: [
        { title: "Casa Patio", description: "Residencial · 2026", image: "/sites/aa-painting-remodeling/remodel-1.jpg" },
        { title: "Taller Norte", description: "Comercial · 2025", image: "/sites/aa-painting-remodeling/remodel-3.jpg" },
        { title: "Apartamento Luz", description: "Interiores · 2025", image: "/sites/aa-painting-remodeling/painting-1.jpg" },
        { title: "Casa Umbral", description: "Residencial · 2024", image: "/sites/aa-painting-remodeling/painting-2.jpg" },
      ],
    },
  }),
  demoSection("testimonials", 6, {
    title: "La experiencia de trabajar juntos",
    settings: {
      items: [
        { name: "Laura Méndez", quote: "Entendieron cómo queríamos vivir antes de dibujar el primer plano.", rating: 5 },
        { name: "Carlos Robleto", quote: "El proceso fue ordenado, honesto y el resultado superó lo que imaginamos.", rating: 5 },
        { name: "Marina Café", quote: "Nuestro espacio ahora expresa exactamente quiénes somos como marca.", rating: 5 },
      ],
    },
  }),
  demoSection("faq", 7, {
    title: "Preguntas frecuentes",
    settings: {
      items: [
        { question: "¿Trabajan proyectos desde cero?", answer: "Sí. Podemos desarrollar arquitectura, interiores y acompañamiento de obra como un proceso integral." },
        { question: "¿También realizan remodelaciones?", answer: "Sí. Evaluamos el espacio existente y proponemos una intervención acorde al alcance y presupuesto." },
        { question: "¿Cómo inicia un proyecto?", answer: "Comenzamos con una conversación para entender necesidades, tiempos, ubicación y nivel de inversión." },
      ],
    },
  }),
  demoSection("location", 8, {
    title: "Estudio abierto",
    subtitle: "Atendemos proyectos en Managua y otras ciudades de la región.",
    body: "Las Colinas, Managua, Nicaragua",
  }),
  demoSection("contact", 9, {
    title: "Hagamos espacio para una buena idea",
    subtitle: "Cuéntanos qué tienes en mente. Te responderemos con los próximos pasos.",
    body: "Agenda una primera conversación sin compromiso.",
    ctaText: "Enviar consulta",
  }),
  demoSection("cta", 10, {
    title: "Tu próximo espacio puede empezar hoy",
    subtitle: "Diseño claro, proceso cercano y una ejecución cuidada.",
    ctaText: "Iniciar un proyecto",
    ctaLink: "#section-contact",
    imagePrompt: "minimal modern architecture golden hour exterior",
  }),
  demoSection("footer", 11, {
    title: "Norte Estudio",
    subtitle: "Arquitectura e interiores · Managua",
  }),
];

export default async function LocalTemplatePreviewPage({
  params,
}: {
  params: Promise<{ style: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();

  const { style } = await params;
  const template = getAllTemplateCandidates().find((candidate) => candidate.style === style);
  if (!template) notFound();

  return (
    <main>
      <SitePreview
        businessName="Norte Estudio"
        businessType="Estudio de arquitectura e interiores"
        phone="+505 8888 2468"
        email="hola@norteestudio.local"
        location="Las Colinas, Managua, Nicaragua"
        showBranding={false}
        coverUrl="/sites/aa-painting-remodeling/remodel-5.jpg"
        theme={FAMILY_THEMES[template.family] ?? FAMILY_THEMES.minimal}
        visualStyle={template.style}
        sections={orderSectionsForTemplate(DEMO_SECTIONS, template.style)}
        socialLinks={{ instagram: "https://instagram.com/norteestudio" }}
      />
    </main>
  );
}

function demoSection(
  type: string,
  order: number,
  values: Partial<Omit<RenderSection, "id" | "type" | "order" | "isVisible">>,
): RenderSection {
  return {
    id: `demo-${type}`,
    type,
    title: "",
    subtitle: "",
    body: "",
    ctaText: "",
    ctaLink: "",
    imagePrompt: "",
    settings: {},
    ...values,
    order,
    isVisible: true,
  };
}
