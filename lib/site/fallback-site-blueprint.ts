import type { Blueprint, BlueprintSection } from "@/lib/site/blueprint";
import {
  GOAL_LABELS,
  parseServiceFacts,
  resolveBusinessTypeLabel,
  splitFactLines,
  type OnboardingInput,
} from "@/lib/validators/site-onboarding";

// English search keywords per business type — used for imagePrompts sent to Pexels/loremflickr.
// Must stay in English so photo search APIs return relevant results.
const IMAGE_KEYWORDS: Record<string, string> = {
  roofing:     "roofing contractor house roof repair tiles",
  painting:    "painting contractor house exterior interior walls",
  landscaping: "landscaping garden design green plants outdoor",
  cleaning:    "professional cleaning service home office sparkling",
  restaurant:  "restaurant dining food cuisine chef kitchen",
  law_firm:    "law firm legal attorney office professional",
  real_estate: "real estate property house architecture modern",
  medical:     "medical clinic healthcare professional doctor office",
  beauty:      "beauty salon spa hair makeup treatment",
  fitness:     "fitness gym workout exercise training weights",
  other:       "professional business service local team",
};

export function buildFallbackSiteBlueprint(
  input: OnboardingInput,
  sectionPlan: string[] = ["hero", "services", "about_us", "cta", "contact", "footer"]
): Blueprint {
  const businessType = resolveBusinessTypeLabel(input);
  const imageKw = IMAGE_KEYWORDS[input.businessType] ?? `${input.businessType} professional business`;
  const services = parseServiceFacts(input.services);
  const serviceNames = services.map((item) => item.name);
  const proofPoints = splitFactLines(input.proofPoints);
  const ctaText = ctaForGoal(input.goal);

  const hasLocation = input.location !== "Zona por definir";
  const candidates: BlueprintSection[] = [
    section("hero", {
      title: input.businessName,
      subtitle: hasLocation ? `${businessType} en ${input.location}` : businessType,
      body: `Servicios para ${input.targetCustomer}.`,
      ctaText,
      ctaLink: "#contact",
      imagePrompt: `${imageKw}, realistic photography high quality`,
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
    section("benefits", {
      title: "Por que elegir esta propuesta",
      settings: { items: [
        { title: "Atencion enfocada", description: `Pensada para ${input.targetCustomer}.` },
        { title: "Oferta clara", description: `Acceso directo a ${naturalList(serviceNames)}.` },
        { title: "Contacto directo", description: "Una siguiente accion visible para continuar la conversacion." },
      ] },
    }),
    section("about_us", {
      title: `Sobre ${input.businessName}`,
      body: [
        `${input.businessName} atiende a ${input.targetCustomer}${hasLocation ? ` en ${input.location}` : ""}. Ofrece ${naturalList(serviceNames)}.`,
        proofPoints.length > 0 ? `Datos confirmados: ${naturalList(proofPoints)}.` : "",
      ].filter(Boolean).join(" "),
      imagePrompt: `${imageKw} team serving local clients, realistic photography`,
      settings: { highlights: [
        { title: "Actividad", description: businessType },
        { title: "Servicios", description: naturalList(serviceNames) },
        ...(hasLocation ? [{ title: "Zona de atención", description: input.location }] : []),
      ] },
    }),
    section("process", {
      title: "Cómo empezar",
      settings: { items: [
        { title: "Cuéntanos qué necesitas", description: "Comparte la información principal de tu proyecto." },
        { title: "Recibe una respuesta", description: "El negocio continuará la conversación por el contacto disponible." },
      ] },
    }),
    section("gallery", {
      title: "Inspiración",
      subtitle: `Una selección visual relacionada con ${businessType.toLowerCase()}.`,
    }),
    section("faq", {
      title: "Preguntas frecuentes",
      settings: { items: [
        { question: "¿Cómo puedo solicitar información?", answer: "Usa el formulario o el contacto disponible en esta página." },
        ...(hasLocation ? [{ question: "¿Dónde ofrece servicio?", answer: input.location }] : []),
      ] },
    }),
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
      subtitle: hasLocation ? `${businessType} en ${input.location}` : businessType,
    })
  ];

  const candidatesByType = new Map(candidates.map((item) => [item.type, item]));
  const sections = sectionPlan.flatMap((type) => {
    if (type === "location" && !hasLocation) return [];
    const candidate = candidatesByType.get(type);
    return candidate ? [candidate] : [];
  });

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
