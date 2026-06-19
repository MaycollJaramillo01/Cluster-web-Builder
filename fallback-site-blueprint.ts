import type { Blueprint, BlueprintSection } from "@/lib/site/blueprint";
import {
  GOAL_LABELS,
  parseServiceFacts,
  resolveBusinessTypeLabel,
  splitFactLines,
  type OnboardingInput,
} from "@/lib/validators/site-onboarding";

export function buildFallbackSiteBlueprint(input: OnboardingInput): Blueprint {
  const businessType = resolveBusinessTypeLabel(input);
  const services = parseServiceFacts(input.services);
  const serviceNames = services.map((item) => item.name);
  const proofPoints = splitFactLines(input.proofPoints);
  const ctaText = ctaForGoal(input.goal);

  const sections: BlueprintSection[] = [
    section("hero", {
      title: input.businessName,
      subtitle: `${businessType} en ${input.location}`,
      body: `Servicios para ${input.targetCustomer}.`,
      ctaText,
      ctaLink: "#contact",
      imagePrompt: `professional ${businessType} small business at work, realistic photography`,
    }),
    section("services", {
      title: "Servicios y productos",
      subtitle: "Esto es lo que ofrece el negocio.",
      settings: {
        items: services.map((item) => ({
          name: item.name,
          description:
            item.description || "Contacta al negocio para confirmar alcance y disponibilidad.",
        })),
      },
    }),
    section("about", {
      title: `Sobre ${input.businessName}`,
      body: [
        `${input.businessName} atiende a ${input.targetCustomer} en ${input.location}. Ofrece ${naturalList(serviceNames)}.`,
        proofPoints.length > 0 ? `Datos confirmados: ${naturalList(proofPoints)}.` : "",
      ].filter(Boolean).join(" "),
      imagePrompt: `professional ${businessType} service for local customers, realistic photography`,
    }),
  ];

  sections.push(
    section("location", {
      title: "Zona de servicio",
      body: input.location,
    }),
    section("cta", {
      title: GOAL_LABELS[input.goal] ?? "Contacta al negocio",
      subtitle: `Atencion para ${input.targetCustomer}.`,
      ctaText,
      ctaLink: "#contact",
    }),
    section("contact", {
      title: "Contacto",
      body: `Consulta disponibilidad para ${naturalList(serviceNames)}.`,
      ctaText: "Enviar solicitud",
    }),
    section("footer", {
      title: input.businessName,
      subtitle: `${businessType} en ${input.location}`,
    })
  );

  return {
    site: {
      businessName: input.businessName,
      businessType,
      language: input.language,
      goal: input.goal,
      tone: "Profesional, claro y basado en datos confirmados.",
      visualStyle: {
        name: input.visualStyle,
        colors: {
          primary: "#2563eb",
          secondary: "#111827",
          accent: "#0891b2",
          background: "#ffffff",
          text: "#111827",
        },
        fontStyle: "",
        designNotes: "Contenido local generado solo con datos del formulario.",
      },
      seo: {
        title: `${input.businessName} | ${businessType}`,
        metaDescription: `${input.businessName}: ${naturalList(serviceNames)} en ${input.location}.`,
        mainKeyword: businessType,
        secondaryKeywords: [input.businessName, input.location, ...serviceNames],
      },
      pages: [{
        slug: "/",
        title: input.businessName,
        description: `${businessType} en ${input.location}`,
        sections,
      }],
    },
  };
}

function ctaForGoal(goal: OnboardingInput["goal"]): string {
  switch (goal) {
    case "calls":
      return "Llamar ahora";
    case "quote_forms":
      return "Solicitar cotizacion";
    case "show_services":
      return "Ver servicios";
    case "sell_products":
      return "Consultar productos";
    case "book_appointments":
      return "Solicitar cita";
    default:
      return "Contactar";
  }
}

function naturalList(items: string[]): string {
  if (items.length === 0) return "los servicios indicados";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`;
}

function section(
  type: string,
  values: Partial<BlueprintSection>
): BlueprintSection {
  return {
    type,
    title: values.title ?? "",
    subtitle: values.subtitle ?? "",
    body: values.body ?? "",
    ctaText: values.ctaText ?? "",
    ctaLink: values.ctaLink ?? "",
    imagePrompt: values.imagePrompt ?? "",
    settings: values.settings ?? {},
  };
}
