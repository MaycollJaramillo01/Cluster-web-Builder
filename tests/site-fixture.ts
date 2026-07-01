import type { OnboardingInput } from "@/lib/validators/site-onboarding";

export const onboardingFixture: OnboardingInput = {
  businessName: "Taller Norte",
  businessType: "other",
  customBusinessType: "Estudio de arquitectura",
  location: "Managua, Nicaragua",
  services: [
    "Diseño residencial: Anteproyecto y planos ejecutivos para viviendas contemporáneas.",
    "Consultoría de terreno: Evaluación de orientación, normativa y viabilidad constructiva.",
  ].join("\n"),
  targetCustomer: "familias que buscan una vivienda funcional y duradera",
  proofPoints: "Proceso documentado y contacto directo con el equipo de diseño.",
  goal: "quote_forms",
  phone: "+505 4000 1000",
  email: "hola@tallernorte.example",
  domain: "taller-norte",
  language: "es",
  visualStyle: "premium_elegant",
  palette: {
    primary: "#18181b",
    secondary: "#3f3f46",
    accent: "#2563eb",
    background: "#fafafa",
    text: "#09090b",
  },
  socialLinks: { instagram: "@tallernorte" },
};
