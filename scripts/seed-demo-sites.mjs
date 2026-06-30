/**
 * Seed three high-quality published demo sites directly into the database.
 * Simulates the full "modo guiado" generation pipeline without needing the AI API.
 *
 * Run with:  node scripts/seed-demo-sites.mjs
 *
 * Requires DATABASE_URL in .env (Prisma reads it automatically).
 * Optionally set SEED_USER_EMAIL to associate sites with a user account.
 */

import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────────────

function createPublicSlug(value) {
  const base = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42) || "sitio";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

function section(type, order, title, content, settings = {}) {
  return { type, order, title, isVisible: true, content, settingsJson: settings };
}

// ── Site definitions ─────────────────────────────────────────────────────────

const SITES = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SITE 1 — Fuego & Tierra (Restaurante premium, Managua)
  //          Design: Panorama · Palette: artisan_nature (warm earth tones)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    businessName: "Fuego & Tierra",
    businessType: "Restaurante",
    goal: "book_appointments",
    visualStyle: "Panorama",
    location: "Managua, Nicaragua",
    phone: "+505 2255-8899",
    email: "reservas@fuegoytierra.com",
    domain: "fuego-y-tierra",
    language: "es",
    primaryColor: "#4a3c28",
    secondaryColor: "#1a130a",
    accentColor: "#c8a878",
    blueprint: {
      site: {
        businessName: "Fuego & Tierra",
        businessType: "Restaurante",
        language: "es",
        goal: "book_appointments",
        tone: "Cálido, evocador y sofisticado. Lenguaje que despierta los sentidos.",
        visualStyle: {
          name: "Panorama",
          colors: { primary: "#4a3c28", secondary: "#1a130a", accent: "#c8a878", background: "#f5f0e8", text: "#1a1510" },
          fontStyle: "Space Grotesk — titulares cinematográficos",
          designNotes: "Cinematográfico. Secciones a pantalla completa con fotografías de alto impacto y tipografía grande sobre fondos oscuros.",
        },
        socialLinks: { instagram: "fuegoytierra.nic", facebook: "", tiktok: "", linkedin: "", youtube: "" },
        seo: {
          title: "Fuego & Tierra | Restaurante Grill en Managua, Nicaragua",
          metaDescription: "Cocina de fuego vivo en Managua. Res al comal, mariscos del Pacífico y degustaciones premium elaboradas con ingredientes nicaragüenses de origen.",
          mainKeyword: "restaurante grill managua",
          secondaryKeywords: ["fuego & tierra", "restaurante managua", "cena managua", "reserva restaurante nicaragua"],
        },
      },
    },
    sections: [
      section("hero", 0, "Fuego & Tierra",
        {
          subtitle: "Cocina de fuego vivo en el corazón de Managua",
          body: "Una experiencia culinaria donde los ingredientes nicaragüenses se elevan a su máxima expresión a través del fuego. Reserva tu mesa y descubre por qué somos el restaurante favorito de la ciudad.",
          ctaText: "Reservar mesa",
          ctaLink: "#contact",
          imagePrompt: "fine dining restaurant nicaragua wood fire grill rustic elegant interior warm lighting candles",
        }),
      section("gallery", 1, "Una probada de lo que te espera",
        {
          subtitle: "Gastronomía de fuego y productos de la tierra nicaragüense",
          body: "",
          ctaText: "",
          ctaLink: "",
          imagePrompt: "wood fire grill restaurant plated dishes nicaragua fine dining close up food photography warm tones",
        }),
      section("services", 2, "Nuestra carta",
        {
          subtitle: "Platos elaborados con fuego real e ingredientes de productores locales",
          body: "",
          ctaText: "Ver carta completa",
          ctaLink: "#contact",
          imagePrompt: "",
        },
        {
          items: [
            { name: "Res al comal", description: "Corte de res local a la brasa con chimichurri de hierbas del huerto, yuca confitada y ensalada de micro hierbas.", price: "C$420" },
            { name: "Mariscos del Pacífico", description: "Corvina y camarones frescos a las brasas con mantequilla de ajo, limón y arroz de coco.", price: "C$380" },
            { name: "Pollo de corral ahumado", description: "Pollo criado en campo abierto, marinado 24 horas y ahumado lentamente con madera de naranjillo.", price: "C$290" },
            { name: "Degustación Fuego & Tierra", description: "Menú de 5 tiempos que recorre los sabores más representativos de nuestra cocina. Para 2 personas.", price: "C$1,100" },
            { name: "Tasting vegetariano", description: "Cuatro tiempos elaborados exclusivamente con vegetales de productores locales, cocinados sobre piedra volcánica.", price: "C$340" },
          ],
        }),
      section("about_us", 3, "Nuestra historia",
        {
          subtitle: "Nacidos del fuego y la tierra nicaragüense",
          body: "Fuego & Tierra nació en 2019 con una convicción: que los ingredientes de Nicaragua merecen una cocina que los celebre. Nuestro fundador, el chef Rodrigo Lacayo, regresó de Europa con una sola misión: crear el mejor restaurante de cocina nicaragüense contemporánea del país. Hoy somos un referente de la gastronomía centroamericana y recibimos comensales de todo el mundo.",
          ctaText: "",
          ctaLink: "",
          imagePrompt: "chef working open kitchen wood fire grill nicaragua portrait serious concentration",
        },
        {
          highlights: [
            { title: "Ingredientes 100% locales", description: "El 90% de nuestros productos provienen de productores nicaragüenses certificados." },
            { title: "Solo fuego vivo", description: "Toda la cocina se elabora sobre leña y brasas. Sin gas ni electricidad en el proceso." },
            { title: "60 comensales", description: "Salón principal para 60 + terraza privada para 20. Reservas exclusivas disponibles." },
          ],
        }),
      section("process", 4, "Cómo hacer tu reserva",
        {
          subtitle: "Tu mesa, en tres pasos simples",
          body: "",
          ctaText: "",
          ctaLink: "",
          imagePrompt: "",
        },
        {
          items: [
            { title: "Elige tu fecha y hora", description: "Disponibilidad de martes a domingo, 12:00–22:00. Reserva con al menos 2 horas de anticipación." },
            { title: "Cuéntanos tu ocasión", description: "Cumpleaños, aniversario o cena de negocios. Nos preparamos para hacerlo especial." },
            { title: "Confirma y disfruta", description: "Confirmación inmediata por WhatsApp. Solo preséntate y déjate llevar." },
          ],
        }),
      section("cta", 5, "Reserva tu mesa esta noche",
        {
          subtitle: "Mesas disponibles de martes a domingo, 12:00 – 22:00.",
          body: "Plazas limitadas. Reserva ahora y asegura tu lugar en la mejor mesa de Managua.",
          ctaText: "Reservar por WhatsApp",
          ctaLink: "https://wa.me/50522558899",
          imagePrompt: "",
        }),
      section("contact", 6, "Contacto y reservas",
        {
          subtitle: "Estamos en el corazón de Managua. Escríbenos.",
          body: "Respondemos en menos de 1 hora de martes a domingo. También puedes llamarnos directamente.",
          ctaText: "Enviar mensaje",
          ctaLink: "",
          imagePrompt: "",
        }),
      section("footer", 7, "Fuego & Tierra",
        {
          subtitle: "Restaurante · Managua, Nicaragua",
          body: "Martes a domingo, 12:00–22:00 · +505 2255-8899",
          ctaText: "",
          ctaLink: "",
          imagePrompt: "",
        }),
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SITE 2 — Nexus Athletic (Gimnasio de alto rendimiento, CDMX)
  //          Design: SplitStats · Palette: fitness_gym (rojo/amarillo)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    businessName: "Nexus Athletic",
    businessType: "Gimnasio",
    goal: "book_appointments",
    visualStyle: "SplitStats",
    location: "Ciudad de Mexico, Mexico",
    phone: "+52 55 3847-1200",
    email: "info@nexusathletic.mx",
    domain: "nexus-athletic",
    language: "es",
    primaryColor: "#dc2626",
    secondaryColor: "#111827",
    accentColor: "#facc15",
    blueprint: {
      site: {
        businessName: "Nexus Athletic",
        businessType: "Gimnasio",
        language: "es",
        goal: "book_appointments",
        tone: "Directo, motivador y orientado a resultados. Sin florituras.",
        visualStyle: {
          name: "SplitStats",
          colors: { primary: "#dc2626", secondary: "#111827", accent: "#facc15", background: "#ffffff", text: "#111827" },
          fontStyle: "Space Grotesk — bold, kinetic, atlético",
          designNotes: "Layout dividido con estadísticas de impacto. Fotografía de atletas reales. Energía y movimiento en cada sección.",
        },
        socialLinks: { instagram: "nexusathletic.mx", facebook: "", tiktok: "nexusathletic", linkedin: "", youtube: "" },
        seo: {
          title: "Nexus Athletic | Gimnasio de Alto Rendimiento en Ciudad de Mexico",
          metaDescription: "Transforma tu cuerpo con metodología de élite. Entrenamiento funcional, musculación y planes personalizados en CDMX. Primera semana gratis.",
          mainKeyword: "gimnasio alto rendimiento cdmx",
          secondaryKeywords: ["nexus athletic", "gym cdmx", "entrenamiento funcional mexico", "gym personal trainer"],
        },
      },
    },
    sections: [
      section("hero", 0, "Nexus Athletic",
        {
          subtitle: "Transforma tu cuerpo. Supera tus límites.",
          body: "Entrenamientos de alto rendimiento diseñados para quienes no se conforman con poco. Metodología probada, entrenadores de élite, resultados medibles.",
          ctaText: "Prueba gratis una semana",
          ctaLink: "#contact",
          imagePrompt: "modern high performance gym mexico city athletes training weights functional fitness red black",
        }),
      section("about_us", 1, "Somos Nexus Athletic",
        {
          subtitle: "Más que un gimnasio: una comunidad de alto rendimiento",
          body: "Fundado en 2020 por Alejandro Cruz — ex atleta de élite y entrenador certificado — Nexus Athletic fue construido para quienes necesitan resultados medibles, no motivación vacía. Hoy somos la comunidad atlética de referencia en CDMX con más de 1,200 miembros activos.",
          ctaText: "",
          ctaLink: "",
          imagePrompt: "fitness trainer coaching athletes high performance gym mexico city team training",
        },
        {
          highlights: [
            { title: "+1,200", description: "Miembros activos transformando su vida cada semana" },
            { title: "15", description: "Entrenadores certificados en modalidades especializadas" },
            { title: "4.9 ★", description: "Valoración promedio en Google de más de 850 reseñas" },
            { title: "1,800 m²", description: "De espacio con equipamiento de última generación" },
          ],
        }),
      section("services", 2, "Programas de entrenamiento",
        {
          subtitle: "Encuentra el programa diseñado para tu objetivo",
          body: "",
          ctaText: "Ver todos los programas",
          ctaLink: "#contact",
          imagePrompt: "",
        },
        {
          items: [
            { name: "Entrenamiento Funcional", description: "Circuitos de alta intensidad que desarrollan fuerza, potencia y resistencia. Grupos de máximo 12 personas para atención real.", price: "$1,200/mes" },
            { name: "Musculación Guiada", description: "Plan de hipertrofia periodizado con seguimiento semanal. Incluye evaluación de composición corporal mensual.", price: "$1,400/mes" },
            { name: "HIIT & Cardio Avanzado", description: "Sesiones de 45 minutos de máxima intensidad con monitor de frecuencia cardíaca. Quema calórica documentada.", price: "$900/mes" },
            { name: "Entrenamiento Personal", description: "Sesiones 1 a 1 con tu entrenador asignado. Plan 100% personalizado según tu historial y objetivo específico.", price: "$2,800/mes" },
            { name: "Nutrición Deportiva", description: "Plan nutricional elaborado por nuestro dietista deportivo certificado. Compatible con cualquier programa de entrenamiento.", price: "$600/mes" },
          ],
        }),
      section("process", 3, "Tu camino al cambio",
        {
          subtitle: "Cuatro pasos que separan tu vida actual de la que mereces",
          body: "",
          ctaText: "",
          ctaLink: "",
          imagePrompt: "",
        },
        {
          items: [
            { title: "Evaluación inicial gratuita", description: "Test de composición corporal, capacidades físicas y entrevista de objetivos. Sin costo ni compromiso para nuevos miembros." },
            { title: "Plan personalizado", description: "Tu entrenador diseña un programa basado exclusivamente en tu evaluación — no en plantillas genéricas." },
            { title: "Entrenamiento guiado", description: "Seguimiento semanal de progreso con ajustes de intensidad y volumen según tus avances reales." },
            { title: "Resultados documentados", description: "Evaluación mensual completa con métricas comparativas para que veas exactamente cuánto has avanzado." },
          ],
        }),
      section("gallery", 4, "Nuestras instalaciones",
        {
          subtitle: "1,800 m² de equipamiento de última generación",
          body: "",
          ctaText: "",
          ctaLink: "",
          imagePrompt: "high performance gym interior mexico city modern equipment weights cardio zone functional training area",
        }),
      section("benefits", 5, "Por qué Nexus Athletic",
        {
          subtitle: "La diferencia entre progresar y solo aparecer",
          body: "",
          ctaText: "",
          ctaLink: "",
          imagePrompt: "",
        },
        {
          items: [
            { title: "Metodología basada en evidencia", description: "Nuestros programas se actualizan con investigación científica, no con tendencias de redes sociales." },
            { title: "Seguimiento real y documentado", description: "Cada miembro tiene un expediente de progreso. Sabemos exactamente en qué punto estás." },
            { title: "Comunidad comprometida", description: "+1,200 personas que se apoyan mutuamente. El ambiente lo cambia todo cuando el tuyo falla." },
            { title: "Sin contratos de largo plazo", description: "Mes a mes. Confiamos en que querrás quedarte por los resultados, no porque firmaste algo." },
          ],
        }),
      section("contact", 6, "Empieza tu semana gratis",
        {
          subtitle: "Sin costo. Sin letra pequeña. Sin excusas.",
          body: "Agenda tu evaluación inicial y comienza esta semana. Te respondemos en menos de 2 horas en días hábiles.",
          ctaText: "Agendar evaluación gratuita",
          ctaLink: "",
          imagePrompt: "",
        }),
      section("footer", 7, "Nexus Athletic",
        {
          subtitle: "Gimnasio de alto rendimiento · Ciudad de Mexico, Mexico",
          body: "Lunes a sábado 5:30–22:00, domingos 7:00–15:00 · +52 55 3847-1200",
          ctaText: "",
          ctaLink: "",
          imagePrompt: "",
        }),
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SITE 3 — Vargas & Mendoza Abogados (Bufete boutique, Bogotá)
  //          Design: Reverse · Palette: legal_professional (azul/dorado)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    businessName: "Vargas & Mendoza Abogados",
    businessType: "Servicios legales",
    goal: "professional_presence",
    visualStyle: "Reverse",
    location: "Bogotá, Colombia",
    phone: "+57 1 285-3300",
    email: "consultas@vmabogados.co",
    domain: "vargas-mendoza-abogados",
    language: "es",
    primaryColor: "#1e3a8a",
    secondaryColor: "#0f172a",
    accentColor: "#c2a14d",
    blueprint: {
      site: {
        businessName: "Vargas & Mendoza Abogados",
        businessType: "Servicios legales",
        language: "es",
        goal: "professional_presence",
        tone: "Autoridad, claridad y confianza. Lenguaje preciso, accesible y sin jerga innecesaria.",
        visualStyle: {
          name: "Reverse",
          colors: { primary: "#1e3a8a", secondary: "#0f172a", accent: "#c2a14d", background: "#ffffff", text: "#111827" },
          fontStyle: "Inter — limpio, institucional, legible",
          designNotes: "Diseño asimétrico con detalles dorados. Autoridad visual sin artificios. Fotografía profesional en entornos legales.",
        },
        socialLinks: { instagram: "", facebook: "", tiktok: "", linkedin: "vargas-mendoza-abogados", youtube: "" },
        seo: {
          title: "Vargas & Mendoza Abogados | Bufete Boutique en Bogotá, Colombia",
          metaDescription: "Más de 20 años litigando en Colombia. Derecho corporativo, laboral, civil y penal. Consulta inicial gratuita. Resultados documentados en +800 casos.",
          mainKeyword: "abogados bogota colombia",
          secondaryKeywords: ["bufete bogota", "abogado corporativo colombia", "derecho laboral bogota", "litigios civiles colombia"],
        },
      },
    },
    sections: [
      section("hero", 0, "Vargas & Mendoza Abogados",
        {
          subtitle: "Protección legal que importa",
          body: "Más de 20 años litigando con resultados comprobados en Colombia. Asesoría clara, estrategia sólida y acceso directo al socio desde el primer día.",
          ctaText: "Consulta inicial sin costo",
          ctaLink: "#contact",
          imagePrompt: "professional law firm office bogota colombia partners meeting room books library elegant dark blue gold",
        }),
      section("services", 1, "Áreas de práctica",
        {
          subtitle: "Representación legal especializada donde más te impacta",
          body: "",
          ctaText: "Consultar mi caso",
          ctaLink: "#contact",
          imagePrompt: "",
        },
        {
          items: [
            { name: "Derecho Corporativo", description: "Constitución de sociedades, fusiones, adquisiciones, contratos comerciales y gobierno corporativo para empresas de todos los tamaños." },
            { name: "Derecho Laboral", description: "Representación de empleadores y trabajadores. Contratos, desvinculaciones, pensiones y litigios ante el Ministerio de Trabajo y la Rama Judicial." },
            { name: "Litigios Civiles y de Familia", description: "Defensa y demandas en procesos civiles, sucesiones, bienes raíces y familia ante juzgados del circuito y tribunales superiores." },
            { name: "Derecho Penal", description: "Defensa técnica en todas las fases del proceso penal colombiano, desde la investigación hasta el juicio oral ante el juez de conocimiento." },
            { name: "Propiedad Intelectual", description: "Registro de marcas, patentes y derechos de autor en Colombia y ante organismos internacionales (OMPI, EUIPO)." },
          ],
        }),
      section("about_us", 2, "El bufete",
        {
          subtitle: "Fundado sobre principios, construido sobre resultados",
          body: "Vargas & Mendoza es un bufete boutique fundado en Bogotá en 2003 por los socios Claudia Vargas y Arturo Mendoza. Nos especializamos en litigios de alto impacto y asesoría corporativa estratégica para empresas colombianas y extranjeras con operaciones en el país. Creemos que el derecho debe ser una herramienta poderosa y comprensible, no un laberinto.",
          ctaText: "",
          ctaLink: "",
          imagePrompt: "law firm partners professional portraits bogota colombia legal office books",
        },
        {
          highlights: [
            { title: "20+ años", description: "De experiencia acumulada en el foro colombiano en todas las jurisdicciones." },
            { title: "+800 casos", description: "Resueltos con alta tasa de éxito en civil, laboral, corporativo y penal." },
            { title: "94%", description: "Tasa de resolución favorable en litigios civiles y laborales documentados." },
            { title: "Boutique especializado", description: "8 abogados altamente especializados. Sin procesos industrializados ni delegación a pasantes." },
          ],
        }),
      section("process", 3, "Cómo trabajamos",
        {
          subtitle: "Transparencia y estrategia desde el primer contacto",
          body: "",
          ctaText: "",
          ctaLink: "",
          imagePrompt: "",
        },
        {
          items: [
            { title: "Consulta inicial gratuita", description: "Analizamos tu situación sin costo ni compromiso. Evaluamos fortalezas, riesgos y estrategia viable en 30 minutos." },
            { title: "Propuesta clara de honorarios", description: "Sin sorpresas. Recibes un acuerdo escrito con todas las etapas del proceso y sus costos antes de comenzar." },
            { title: "Estrategia legal documentada", description: "Elaboramos un plan jurídico escrito que puedes seguir paso a paso durante toda la representación." },
            { title: "Informes regulares de avance", description: "Te mantenemos informado en cada hito del proceso. Canal directo con tu abogado socio, sin intermediarios." },
          ],
        }),
      section("benefits", 4, "Por qué confiar en nosotros",
        {
          subtitle: "Lo que nos diferencia de un bufete genérico",
          body: "",
          ctaText: "",
          ctaLink: "",
          imagePrompt: "",
        },
        {
          items: [
            { title: "Acceso directo al socio", description: "Tu caso es atendido por un abogado socio desde el inicio, no delegado a pasantes o asistentes." },
            { title: "Lenguaje claro, no jurídico", description: "Traducimos el lenguaje legal a decisiones concretas que puedes tomar con confianza." },
            { title: "Equipo multidisciplinario", description: "Contamos con expertos en contabilidad forense y peritos técnicos para fortalecer tu posición." },
            { title: "Disponibilidad real", description: "Canal directo con tu abogado. Sin secretarías ni respuestas de 5 días hábiles para preguntas urgentes." },
          ],
        }),
      section("faq", 5, "Preguntas frecuentes",
        {
          subtitle: "Respuestas claras antes de dar el primer paso",
          body: "",
          ctaText: "",
          ctaLink: "",
          imagePrompt: "",
        },
        {
          items: [
            { question: "¿La consulta inicial tiene algún costo?", answer: "No. La primera consulta de hasta 30 minutos es completamente gratuita. Evaluamos tu caso y te decimos con honestidad si podemos ayudarte y cómo." },
            { question: "¿Cuánto tiempo toma resolver mi caso?", answer: "Depende del tipo de proceso. Asesorías corporativas pueden resolverse en semanas; litigios civiles toman entre 1 y 3 años según la complejidad y jurisdicción." },
            { question: "¿Atienden empresas y personas naturales?", answer: "Sí. El 60% de nuestra cartera son personas jurídicas; el 40% son individuos en procesos civiles, penales o laborales." },
            { question: "¿Tienen experiencia en casos con contrapartes internacionales?", answer: "Sí. Hemos representado clientes en disputas con empresas extranjeras y manejamos registros de propiedad intelectual ante la OMPI y el EUIPO." },
            { question: "¿Cuáles son sus esquemas de honorarios?", answer: "Trabajamos con honorario fijo, por horas o success fee según el tipo de caso. Lo definimos en detalle antes de firmar cualquier acuerdo." },
          ],
        }),
      section("contact", 6, "Consulta sin costo",
        {
          subtitle: "Primera conversación, sin compromiso",
          body: "Cuéntanos tu situación. Un abogado socio te contactará en 24 horas hábiles para evaluar tu caso y definir los próximos pasos.",
          ctaText: "Solicitar consulta gratuita",
          ctaLink: "",
          imagePrompt: "",
        }),
      section("footer", 7, "Vargas & Mendoza Abogados",
        {
          subtitle: "Bufete de abogados · Bogotá, Colombia",
          body: "Lunes a viernes 8:00–18:00 · +57 1 285-3300 · consultas@vmabogados.co",
          ctaText: "",
          ctaLink: "",
          imagePrompt: "",
        }),
    ],
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const targetEmail = process.env.SEED_USER_EMAIL || "info@cluster.marketing";
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: targetEmail }, { username: "admin" }] },
    select: { id: true, username: true, email: true },
  });

  if (user) {
    console.log(`Asociando sitios al usuario: ${user.username} (${user.email ?? "sin email"})`);
  } else {
    console.log("No se encontro un usuario con ese email. Los sitios se crearan sin propietario pero con status PUBLISHED.");
  }

  const created = [];

  for (const siteDef of SITES) {
    const publicSlug = createPublicSlug(siteDef.domain || siteDef.businessName);

    // Build full blueprint with sections embedded
    const blueprintWithSections = {
      ...siteDef.blueprint,
      site: {
        ...siteDef.blueprint.site,
        pages: [{
          slug: "/",
          title: siteDef.businessName,
          description: siteDef.blueprint.site.seo?.metaDescription ?? "",
          sections: siteDef.sections.map((s) => ({
            type: s.type,
            title: s.title,
            subtitle: s.content.subtitle,
            body: s.content.body,
            ctaText: s.content.ctaText,
            ctaLink: s.content.ctaLink,
            imagePrompt: s.content.imagePrompt,
            settings: s.settingsJson,
          })),
        }],
      },
    };

    const site = await prisma.site.create({
      data: {
        userId: user?.id ?? null,
        businessName: siteDef.businessName,
        businessType: siteDef.businessType,
        goal: siteDef.goal,
        visualStyle: siteDef.visualStyle,
        location: siteDef.location,
        phone: siteDef.phone,
        email: siteDef.email,
        domain: siteDef.domain,
        publicSlug,
        language: siteDef.language,
        status: "PUBLISHED",
        publishedAt: new Date(),
        primaryColor: siteDef.primaryColor,
        secondaryColor: siteDef.secondaryColor,
        accentColor: siteDef.accentColor,
        blueprintJson: blueprintWithSections,
        sections: {
          create: siteDef.sections.map((s) => ({
            type: s.type,
            title: s.title,
            order: s.order,
            isVisible: s.isVisible,
            content: s.content,
            settingsJson: s.settingsJson,
          })),
        },
      },
      include: { sections: { select: { type: true, order: true } } },
    });

    created.push({ id: site.id, publicSlug, businessName: siteDef.businessName, visualStyle: siteDef.visualStyle });

    console.log(`\n  ✓ ${siteDef.businessName}`);
    console.log(`    ID:          ${site.id}`);
    console.log(`    Slug:        /s/${publicSlug}`);
    console.log(`    Estilo:      ${siteDef.visualStyle}`);
    console.log(`    Secciones:   ${site.sections.length}`);
    console.log(`    Status:      PUBLISHED`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  3 sitios publicados creados exitosamente.\n");
  console.log("  URLs:");
  for (const s of created) {
    console.log(`    ${s.businessName.padEnd(32)} → /s/${s.publicSlug}`);
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  return created;
}

main()
  .catch((e) => { console.error("Error:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
