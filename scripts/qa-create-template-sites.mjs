// Crea un sitio DRAFT real en la base de datos por cada uno de los 30 templates
// V2, con contenido acorde al rubro de cada uno, para pruebas de diseño y
// desarrollo end-to-end (no solo el render aislado de generate-v2-visual-results).
import { PrismaClient } from "@prisma/client";
import { getAllTemplatesV2, instantiateTemplateV2 } from "../lib/site/v2-templates.ts";

const prisma = new PrismaClient();
const SLUG_PREFIX = "qa-";

const img = (seed, w = 1400, h = 1000) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

// "Packs" de contenido por familia de negocio — se reusan entre templates que
// comparten intención (ej. todos los de servicios locales usan el mismo pack).
const PACKS = {
  local: {
    business: { name: "Cluster Servicios del Valle", type: "Servicios profesionales" },
    hero: { title: "Soluciones confiables para tu hogar y tu negocio", subtitle: "Atención rápida, presupuesto claro", body: "Un equipo local con años de experiencia resolviendo lo que tu propiedad necesita." },
    services: ["Diagnóstico y presupuesto", "Instalación y mantenimiento", "Atención de emergencias"],
    benefits: ["Respuesta el mismo día", "Garantía por escrito", "Equipo certificado"],
  },
  restaurant: {
    business: { name: "Cocina de Barrio", type: "Restaurante" },
    hero: { title: "Cocina de temporada, servida con calma", subtitle: "Reservas abiertas toda la semana", body: "Ingredientes locales, una carta corta y un ambiente que invita a quedarse." },
    services: ["Menú de temporada", "Reservas para grupos", "Eventos privados"],
    benefits: ["Ingredientes locales", "Carta rotativa cada mes", "Terraza disponible"],
  },
  medical: {
    business: { name: "Consultorio Vitalis", type: "Clínica médica" },
    hero: { title: "Atención médica cercana, sin esperas largas", subtitle: "Citas disponibles esta semana", body: "Un equipo de profesionales certificados acompañando tu salud en cada etapa." },
    services: ["Consulta general", "Chequeo preventivo", "Seguimiento especializado"],
    benefits: ["Profesionales certificados", "Historia clínica digital", "Atención de urgencias"],
  },
  legal: {
    business: { name: "Bufete Alcántara & Asociados", type: "Despacho legal" },
    hero: { title: "Representación legal clara, sin letra pequeña", subtitle: "Consulta inicial sin costo", body: "Más de una década resolviendo casos civiles, corporativos y de familia." },
    services: ["Derecho corporativo", "Derecho de familia", "Litigio civil"],
    benefits: ["Consulta inicial gratuita", "Comunicación directa con tu abogado", "Casos resueltos favorablemente"],
  },
  education: {
    business: { name: "Academia Norte Digital", type: "Escuela online" },
    hero: { title: "Aprende una habilidad real, a tu ritmo", subtitle: "Nueva cohorte cada mes", body: "Cursos cortos, con proyectos reales y acompañamiento de instructores activos en la industria." },
    services: ["Curso introductorio", "Programa avanzado", "Mentoría 1 a 1"],
    benefits: ["Instructores en activo", "Certificado al finalizar", "Comunidad de alumnos"],
  },
  events: {
    business: { name: "Salón Jacaranda", type: "Salón de eventos" },
    hero: { title: "El espacio perfecto para tu próxima celebración", subtitle: "Fechas 2026 disponibles", body: "Un salón versátil para bodas, conferencias y celebraciones de hasta 300 invitados." },
    services: ["Paquete boda", "Paquete corporativo", "Alquiler solo del espacio"],
    benefits: ["Capacidad hasta 300 personas", "Catering incluido", "Estacionamiento propio"],
  },
  fitness: {
    business: { name: "Vigor Training Club", type: "Gimnasio" },
    hero: { title: "Entrena distinto. Resultados reales", subtitle: "Primera semana gratis", body: "Clases grupales, entrenamiento funcional y planes personalizados con coaches certificados." },
    services: ["Entrenamiento funcional", "Clases grupales", "Plan personalizado"],
    benefits: ["Coaches certificados", "Horarios flexibles", "Comunidad activa"],
  },
  automotive: {
    business: { name: "Taller Motorcraft", type: "Taller automotriz" },
    hero: { title: "Tu auto, en manos de mecánicos certificados", subtitle: "Diagnóstico sin costo", body: "Servicio honesto, repuestos de calidad y un taller que respalda cada trabajo." },
    services: ["Diagnóstico computarizado", "Mantenimiento preventivo", "Reparación de motor"],
    benefits: ["Diagnóstico sin costo", "Repuestos originales", "Garantía en mano de obra"],
  },
  nonprofit: {
    business: { name: "Fundación Raíces", type: "Organización sin fines de lucro" },
    hero: { title: "Juntos construimos oportunidades reales", subtitle: "100% de lo donado va a programas", body: "Trabajamos con comunidades locales en educación, alimentación y vivienda digna." },
    services: ["Programa educativo", "Banco de alimentos", "Vivienda comunitaria"],
    benefits: ["Transparencia total en el uso de fondos", "Presencia en 12 comunidades", "10 años de trabajo continuo"],
  },
  photography: {
    business: { name: "Estudio Lente Norte", type: "Fotografía y videografía" },
    hero: { title: "Historias reales, contadas en imágenes", subtitle: "Agenda disponible para 2026", body: "Fotografía de bodas, retratos y proyectos comerciales con una mirada documental." },
    services: ["Sesión de boda", "Retrato profesional", "Cobertura de evento"],
    benefits: ["Entrega en 2 semanas", "Edición incluida", "Portafolio verificable"],
  },
  realestate: {
    business: { name: "Horizonte Propiedades", type: "Inmobiliaria" },
    hero: { title: "Encuentra la propiedad que estás buscando", subtitle: "Nuevas propiedades cada semana", body: "Acompañamiento completo, desde la primera visita hasta la firma." },
    services: ["Casa en Las Colinas — $185,000", "Apartamento centro — $92,000", "Terreno comercial — $240,000"],
    benefits: ["Asesoría legal incluida", "Visitas guiadas", "Financiamiento facilitado"],
  },
  creative: {
    business: { name: "Estudio Vértice", type: "Agencia creativa" },
    hero: { title: "Marcas con carácter, no plantillas", subtitle: "Proyectos nuevos cada trimestre", body: "Branding, diseño digital y producción audiovisual para marcas que quieren destacar." },
    services: ["Identidad de marca", "Diseño web", "Producción audiovisual"],
    benefits: ["Proceso colaborativo", "Entregas puntuales", "Portafolio premiado"],
  },
  tech: {
    business: { name: "Nortek Software", type: "Desarrollo de software" },
    hero: { title: "Software a la medida de tu operación", subtitle: "Consultoría técnica sin costo", body: "Equipos de ingeniería dedicados a construir el producto que tu negocio necesita." },
    services: ["Desarrollo a medida", "Consultoría técnica", "Soporte y mantenimiento"],
    benefits: ["Equipo senior dedicado", "Metodología ágil", "Código documentado"],
  },
  luxury: {
    business: { name: "Astre Joyería", type: "Joyería" },
    hero: { title: "Piezas que se heredan, no se repiten", subtitle: "Colección otoño 2026", body: "Diseño a medida y piezas de colección trabajadas por artesanos locales." },
    services: ["Diseño a medida", "Reparación y mantenimiento", "Tasación"],
    benefits: ["Materiales certificados", "Garantía de por vida", "Diseño exclusivo"],
  },
  travel: {
    business: { name: "Horizonte Expediciones", type: "Turismo de aventura" },
    hero: { title: "La montaña te espera", subtitle: "Salidas todos los fines de semana", body: "Expediciones guiadas para todos los niveles, con equipo incluido y guías certificados." },
    services: ["Trekking de un día", "Expedición de 3 días", "Salidas privadas"],
    benefits: ["Guías certificados", "Equipo incluido", "Grupos reducidos"],
  },
  wellness: {
    business: { name: "Espacio Calma", type: "Spa y bienestar" },
    hero: { title: "Un momento para ti, sin prisa", subtitle: "Agenda tu cita esta semana", body: "Terapias corporales y faciales en un espacio pensado para desconectar." },
    services: ["Masaje terapéutico", "Ritual facial", "Día de spa completo"],
    benefits: ["Productos naturales", "Terapeutas certificados", "Ambiente privado"],
  },
};

const TEMPLATE_PACK = {
  conversion: "local", editorial: "creative", catalog: "realestate", local: "local", immersive: "creative",
  minimal: "local", studio: "creative", saas: "tech", gastro: "restaurant", wellness: "wellness",
  essential: "local", assurance: "legal", nordic: "creative", metro: "fitness", deco: "luxury",
  impact: "creative", "hvac-premium": "local", terminal: "tech", horizonte: "travel", astre: "luxury",
  realty: "realestate", clinic: "medical", counsel: "legal", academy: "education", venue: "events",
  vigor: "fitness", drive: "automotive", cause: "nonprofit", frame: "photography", craft: "local",
};

function contentFor(template) {
  const pack = PACKS[TEMPLATE_PACK[template.id]] ?? PACKS.local;
  const seed = template.id;
  return {
    business: { ...pack.business, location: "San Pedro Sula, Honduras", phone: "+504 9988 7766", email: `hola@${template.id}.example` },
    hero: { ...pack.hero, ctaText: "Contactar", ctaLink: "#contact", media: img(`${seed}-hero`, 1600, 1100) },
    about: {
      title: `Sobre ${pack.business.name}`, subtitle: "Quiénes somos",
      body: `${pack.business.name} lleva años trabajando en ${pack.business.type.toLowerCase()}, con un equipo cercano y procesos claros de principio a fin.`,
      media: img(`${seed}-about`, 1200, 900),
      highlights: [{ title: "Equipo dedicado", description: "Personas reales detrás de cada proyecto" }, { title: "Procesos claros", description: "Sabés en qué etapa está tu proyecto siempre" }],
    },
    services: pack.services.map((title, i) => ({ title, description: "Descripción breve del servicio, pensada para transmitir confianza sin relleno.", meta: template.id === "realty" ? "" : "", image: img(`${seed}-service-${i}`, 900, 700) })),
    benefits: pack.benefits.map((title) => ({ title, description: "Por qué esto importa para quien nos elige." })),
    reviews: [
      { name: "Ana Martínez", role: "Clienta", quote: "El proceso fue claro de principio a fin y el resultado superó lo que esperaba.", rating: 5, source: "Google" },
      { name: "Carlos Núñez", role: "Cliente", quote: "Respuesta rápida y trato honesto. Totalmente recomendados.", rating: 5, source: "Google" },
      { name: "Sofía Reyes", role: "Clienta", quote: "Se nota la experiencia. Resolvieron todo sin complicaciones.", rating: 5, source: "Google" },
    ],
    faqs: [
      { question: "¿Cómo empiezo?", answer: "Escribinos por el formulario de contacto y coordinamos una primera conversación sin costo." },
      { question: "¿Cuánto tarda el proceso?", answer: "Depende del alcance, pero te damos un tiempo estimado claro desde el primer contacto." },
    ],
    contact: { title: "Hablemos de tu proyecto", body: "Contanos qué necesitás y te respondemos en menos de 24 horas.", ctaText: "Enviar mensaje" },
    media: [0, 1, 2, 3].map((i) => ({ url: img(`${seed}-gallery-${i}`, 1200, 900), alt: `${pack.business.name} — imagen ${i + 1}` })),
    social: { Instagram: "https://instagram.com", Facebook: "https://facebook.com" },
    seo: { title: `${pack.business.name} — ${pack.business.type}`, description: `${pack.business.name}: ${pack.hero.subtitle}.`, keyword: pack.business.type },
  };
}

try {
  const owner = await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
  if (!owner) throw new Error("No existe un administrador para asignar los sitios de QA.");

  const templates = getAllTemplatesV2();
  const results = [];
  for (const template of templates) {
    const slug = `${SLUG_PREFIX}${template.id}`;
    const content = contentFor(template);
    const document = instantiateTemplateV2(template.id, content);
    const site = await prisma.$transaction(async (tx) => {
      const saved = await tx.site.upsert({
        where: { publicSlug: slug },
        create: {
          userId: owner.id, businessName: content.business.name, businessType: content.business.type,
          location: content.business.location, phone: content.business.phone, email: content.business.email,
          goal: "QA de templates V2", visualStyle: template.id, builderVersion: 2,
          templateId: document.template.id, contentJson: document.content, designJson: document.template.theme,
          publicSlug: slug, status: "PUBLISHED", publishedAt: new Date(),
          primaryColor: document.template.theme.primary, secondaryColor: document.template.theme.secondary,
          accentColor: document.template.theme.accent, coverUrl: content.hero.media,
        },
        update: {
          businessName: content.business.name, businessType: content.business.type,
          location: content.business.location, phone: content.business.phone, email: content.business.email,
          visualStyle: template.id, builderVersion: 2, templateId: document.template.id,
          contentJson: document.content, designJson: document.template.theme,
          status: "PUBLISHED", publishedAt: new Date(),
          primaryColor: document.template.theme.primary, secondaryColor: document.template.theme.secondary,
          accentColor: document.template.theme.accent, coverUrl: content.hero.media,
        },
      });
      await tx.siteSection.deleteMany({ where: { siteId: saved.id } });
      await tx.siteSection.createMany({ data: document.sections.map((section, order) => ({
        id: section.id, siteId: saved.id, type: "canvas", title: section.key,
        content: section, order, isVisible: true, settingsJson: {},
      })) });
      return saved;
    });
    results.push({ templateId: template.id, siteId: site.id, slug: site.publicSlug });
    console.log(`✓ ${template.id.padEnd(14)} -> /preview/${site.id}`);
  }
  console.log(`\n${results.length} sitios creados/actualizados.`);
} finally {
  await prisma.$disconnect();
}
