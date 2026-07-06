import { PrismaClient } from "@prisma/client";

import { instantiateTemplateV2 } from "../lib/site/v2-templates.ts";

const prisma = new PrismaClient();
const publishedAt = Date.now();

const sites = [
  {
    templateId: "assurance",
    slug: "nexo-legal-compliance",
    content: {
      business: { name: "Nexo Legal & Compliance", type: "Asesoría legal corporativa", location: "Managua, Nicaragua", phone: "+505 0000 1101", email: "contacto@nexolegal.example", logo: "" },
      hero: { title: "Decisiones empresariales con respaldo legal", subtitle: "Contratos, cumplimiento y prevención de riesgos", body: "Acompañamos a empresas que necesitan avanzar con acuerdos claros, obligaciones bajo control y asesoría directa.", ctaText: "Solicitar diagnóstico", ctaLink: "#contact", media: "https://images.pexels.com/photos/8111888/pexels-photo-8111888.jpeg?auto=compress&cs=tinysrgb&w=1600" },
      about: { title: "Asesoría que entiende la operación", subtitle: "Un equipo al lado de tu empresa", body: "Convertimos asuntos legales complejos en decisiones concretas. Revisamos el contexto comercial, explicamos alternativas y documentamos cada recomendación.", media: "https://images.pexels.com/photos/6077665/pexels-photo-6077665.jpeg?auto=compress&cs=tinysrgb&w=1200", highlights: [{ title: "Respuesta ejecutiva", description: "Criterios claros para decidir sin demoras innecesarias." }, { title: "Documentación ordenada", description: "Contratos y obligaciones fáciles de consultar." }, { title: "Prevención", description: "Riesgos identificados antes de convertirse en conflictos." }] },
      services: [{ title: "Contratos comerciales", description: "Redacción, revisión y negociación de acuerdos con clientes, proveedores y socios." }, { title: "Cumplimiento corporativo", description: "Matrices de obligaciones, políticas internas y acompañamiento documental." }, { title: "Gobierno empresarial", description: "Actas, acuerdos societarios y soporte para decisiones de dirección." }, { title: "Prevención de conflictos", description: "Análisis temprano de contingencias y estrategias de solución." }],
      benefits: [{ title: "Criterio claro", description: "Recomendaciones que conectan ley y negocio." }, { title: "Seguimiento", description: "Cada asunto conserva responsables y próximos pasos." }, { title: "Confidencialidad", description: "Información tratada con procesos profesionales." }],
      reviews: [{ name: "María Fernanda R.", role: "Gerente administrativa", quote: "Ordenaron nuestros contratos y ahora cada renovación tiene responsables y fechas claras.", rating: 5, source: "Cliente corporativo" }, { name: "Carlos M.", role: "Director comercial", quote: "La asesoría fue directa y nos permitió cerrar el acuerdo entendiendo cada riesgo.", rating: 5, source: "Cliente corporativo" }],
      faqs: [{ question: "¿Trabajan con empresas pequeñas?", answer: "Sí. Ajustamos el alcance según la operación y las prioridades reales de cada empresa." }, { question: "¿Pueden revisar un contrato antes de firmarlo?", answer: "Sí. Identificamos obligaciones, riesgos y puntos de negociación antes de emitir una recomendación." }, { question: "¿Atienden consultas recurrentes?", answer: "Podemos trabajar por asunto o mediante acompañamiento mensual." }],
      contact: { title: "Revisemos tu próximo paso", body: "Describe el asunto y te indicaremos qué información necesitamos para una primera evaluación.", ctaText: "Enviar consulta" },
      media: [], social: { linkedin: "https://www.linkedin.com" }, seo: { title: "Nexo Legal | Asesoría corporativa en Managua", description: "Contratos, cumplimiento y asesoría legal corporativa para empresas en Managua.", keyword: "asesoría legal corporativa" },
    },
    coverUrl: "https://images.pexels.com/photos/8111888/pexels-photo-8111888.jpeg?auto=compress&cs=tinysrgb&w=1600",
  },
  {
    templateId: "nordic",
    slug: "linea-clara-interiores",
    content: {
      business: { name: "Línea Clara Interiores", type: "Diseño interior residencial", location: "Granada, Nicaragua", phone: "+505 0000 2202", email: "hola@lineaclara.example", logo: "" },
      hero: { title: "Interiores serenos para la vida cotidiana", subtitle: "Diseño cálido, funcional y sin exceso", body: "Creamos hogares luminosos donde materiales, distribución y mobiliario trabajan juntos para hacer más simple cada día.", ctaText: "Cuéntanos tu proyecto", ctaLink: "#contact", media: "https://images.pexels.com/photos/19966790/pexels-photo-19966790.jpeg?auto=compress&cs=tinysrgb&w=1600" },
      about: { title: "Diseñamos desde cómo quieres vivir", subtitle: "Calma con propósito", body: "Antes de elegir colores o muebles estudiamos recorridos, luz, hábitos y objetos importantes. El resultado es un espacio personal, fácil de mantener y preparado para durar.", media: "https://images.pexels.com/photos/19966766/pexels-photo-19966766.jpeg?auto=compress&cs=tinysrgb&w=1200", highlights: [{ title: "Luz natural", description: "Distribuciones que aprovechan cada orientación." }, { title: "Materiales honestos", description: "Texturas agradables y soluciones fáciles de cuidar." }, { title: "Compra consciente", description: "Menos piezas, mejor elegidas." }] },
      services: [{ title: "Diseño integral", description: "Concepto, distribución, paleta, materiales y selección de mobiliario." }, { title: "Renovación por ambientes", description: "Cocinas, salas, dormitorios y espacios de trabajo." }, { title: "Styling final", description: "Iluminación, textiles, arte y objetos para completar el espacio." }],
      benefits: [{ title: "Un plan completo", description: "Decisiones conectadas antes de comprar." }, { title: "Presupuesto priorizado", description: "Inversión concentrada donde aporta más." }, { title: "Acompañamiento cercano", description: "Revisiones claras durante cada etapa." }],
      reviews: [{ name: "Andrea P.", role: "Propietaria", quote: "La casa se siente más amplia y tranquila sin perder las cosas que la hacen nuestra.", rating: 5, source: "Proyecto residencial" }, { name: "Lucía V.", role: "Propietaria", quote: "Nos ayudaron a comprar menos y elegir mucho mejor cada pieza.", rating: 5, source: "Proyecto residencial" }],
      faqs: [{ question: "¿Trabajan con muebles existentes?", answer: "Sí. Partimos de las piezas que quieres conservar y construimos la propuesta alrededor de ellas." }, { question: "¿Puedo contratar solo un ambiente?", answer: "Sí. El alcance puede ser una habitación o la vivienda completa." }],
      contact: { title: "Imaginemos un hogar más claro", body: "Cuéntanos qué espacio quieres transformar, sus medidas aproximadas y cómo lo utilizas hoy.", ctaText: "Iniciar conversación" },
      media: [{ url: "https://images.pexels.com/photos/19866414/pexels-photo-19866414.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Sala escandinava luminosa" }, { url: "https://images.pexels.com/photos/7836571/pexels-photo-7836571.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Interior con plantas" }, { url: "https://images.pexels.com/photos/19980206/pexels-photo-19980206.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Cocina minimalista" }],
      social: { instagram: "https://www.instagram.com" }, seo: { title: "Línea Clara | Diseño interior en Granada", description: "Diseño interior residencial sereno, funcional y cálido en Granada, Nicaragua.", keyword: "diseño interior Granada" },
    },
    coverUrl: "https://images.pexels.com/photos/19966790/pexels-photo-19966790.jpeg?auto=compress&cs=tinysrgb&w=1600",
  },
  {
    templateId: "metro",
    slug: "distrito-44-training",
    content: {
      business: { name: "Distrito 44 Training", type: "Entrenamiento funcional", location: "Managua, Nicaragua", phone: "+505 0000 3303", email: "entrena@distrito44.example", logo: "" },
      hero: { title: "Entrena fuerte. Muévete mejor.", subtitle: "Sesiones guiadas para fuerza, resistencia y movilidad", body: "Un espacio urbano para personas que quieren progreso medible, técnica cuidada y una comunidad que sí acompaña.", ctaText: "Reserva tu primera sesión", ctaLink: "#contact", media: "https://videos.pexels.com/video-files/4175897/4175897-hd_1920_1080_30fps.mp4" },
      about: { title: "Entrenamiento con intención", subtitle: "Más que completar una rutina", body: "Evaluamos tu punto de partida, adaptamos cargas y revisamos tu técnica. Cada sesión tiene un objetivo concreto y una progresión que puedes entender.", media: "https://images.pexels.com/photos/3253499/pexels-photo-3253499.jpeg?auto=compress&cs=tinysrgb&w=1200", highlights: [{ title: "Grupos reducidos", description: "Correcciones reales durante la sesión." }, { title: "Progresión visible", description: "Objetivos y cargas registrados." }, { title: "Movilidad primero", description: "Movimiento de calidad antes de sumar intensidad." }] },
      services: [{ title: "Fuerza funcional", description: "Patrones básicos, cargas progresivas y control técnico." }, { title: "Acondicionamiento", description: "Trabajo cardiovascular adaptado a tu nivel." }, { title: "Movilidad", description: "Sesiones para recuperar rango y moverte con confianza." }, { title: "Plan personal", description: "Evaluación y programación individual con seguimiento." }],
      benefits: [{ title: "45 min", description: "Sesiones enfocadas y sin tiempo perdido." }, { title: "Tu nivel", description: "Cada ejercicio tiene una progresión adecuada." }, { title: "Seguimiento", description: "Resultados revisados con datos simples." }],
      reviews: [{ name: "José A.", role: "Miembro", quote: "Volví a entrenar sin sentir que tenía que competir con nadie. Hoy me muevo mejor y soy más constante.", rating: 5, source: "Comunidad D44" }, { name: "Paola S.", role: "Miembro", quote: "Las correcciones cambiaron por completo mi técnica y dejaron de molestarme las rodillas.", rating: 5, source: "Comunidad D44" }],
      faqs: [{ question: "¿Necesito experiencia?", answer: "No. La primera sesión sirve para conocer tu nivel y adaptar cada movimiento." }, { question: "¿Qué debo llevar?", answer: "Ropa cómoda, agua y disposición para aprender la técnica." }],
      contact: { title: "Tu primera sesión empieza aquí", body: "Déjanos tus datos y el horario que prefieres. Te contactaremos para coordinar una evaluación inicial.", ctaText: "Reservar sesión" },
      media: [{ url: "https://images.pexels.com/photos/1502388/pexels-photo-1502388.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Entrenamiento con kettlebell" }, { url: "https://images.pexels.com/photos/14679049/pexels-photo-14679049.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Entrenamiento en grupo" }, { url: "https://images.pexels.com/photos/8520080/pexels-photo-8520080.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Entrenamiento urbano" }],
      social: { instagram: "https://www.instagram.com" }, seo: { title: "Distrito 44 | Entrenamiento funcional en Managua", description: "Entrenamiento funcional, fuerza y movilidad con seguimiento en Managua.", keyword: "entrenamiento funcional Managua" },
    },
    coverUrl: "https://images.pexels.com/photos/3253499/pexels-photo-3253499.jpeg?auto=compress&cs=tinysrgb&w=1600",
  },
  {
    templateId: "deco",
    slug: "aurea-celebraciones",
    content: {
      business: { name: "Áurea Celebraciones", type: "Producción de bodas y eventos", location: "Managua, Nicaragua", phone: "+505 0000 4404", email: "eventos@aurea.example", logo: "" },
      hero: { title: "Celebraciones diseñadas para ser recordadas", subtitle: "Dirección creativa y producción integral", body: "Convertimos una intención personal en una experiencia coherente: espacio, atmósfera, tiempos y cada detalle visible.", ctaText: "Solicitar una reunión", ctaLink: "#contact", media: "https://videos.pexels.com/video-files/31618415/13474997_1920_1080_24fps.mp4" },
      about: { title: "Una historia, un ritmo, una noche irrepetible", subtitle: "Producción con criterio", body: "Escuchamos lo que quieres celebrar y construimos una dirección completa. Coordinamos proveedores, montaje y tiempos para que puedas vivir el evento sin administrar cada detalle.", media: "https://images.pexels.com/photos/16120229/pexels-photo-16120229.jpeg?auto=compress&cs=tinysrgb&w=1200", highlights: [{ title: "Dirección creativa", description: "Una visión que une espacio, flores, iluminación y mesa." }, { title: "Producción", description: "Cronograma, proveedores y montaje bajo una sola coordinación." }, { title: "Acompañamiento", description: "Decisiones guiadas desde la primera reunión." }] },
      services: [{ title: "Bodas", description: "Concepto, planificación y producción completa para ceremonias y recepciones." }, { title: "Eventos privados", description: "Aniversarios, cenas y celebraciones con dirección personalizada." }, { title: "Eventos corporativos", description: "Experiencias de marca, cenas ejecutivas y lanzamientos." }],
      benefits: [{ title: "Un solo concepto", description: "Cada elemento responde a la misma historia." }, { title: "Un solo equipo", description: "Coordinación central para proveedores y montaje." }, { title: "Un día presente", description: "La logística queda en nuestras manos." }],
      reviews: [{ name: "Sofía & Daniel", role: "Boda privada", quote: "Todo se sintió nuestro. Pudimos disfrutar la noche porque el equipo tenía cada momento bajo control.", rating: 5, source: "Celebración Áurea" }, { name: "Elena C.", role: "Directora de marca", quote: "La producción fue puntual, elegante y completamente coherente con nuestra identidad.", rating: 5, source: "Evento corporativo" }],
      faqs: [{ question: "¿Con cuánto tiempo debemos reservar?", answer: "Para bodas recomendamos iniciar con varios meses de anticipación; los eventos más pequeños pueden organizarse en plazos menores según disponibilidad." }, { question: "¿Trabajan con proveedores externos?", answer: "Sí. Podemos integrar proveedores elegidos por el cliente y coordinarlos dentro del plan general." }, { question: "¿Realizan eventos fuera de Managua?", answer: "Sí. Evaluamos producción y logística según la ubicación y el alcance." }],
      contact: { title: "Cuéntanos qué quieres celebrar", body: "Comparte la fecha, ubicación aproximada y número de invitados para preparar una primera conversación.", ctaText: "Solicitar reunión" },
      media: [{ url: "https://images.pexels.com/photos/37828118/pexels-photo-37828118.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Ceremonia exterior" }, { url: "https://images.pexels.com/photos/32854447/pexels-photo-32854447.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Recepción elegante" }, { url: "https://images.pexels.com/photos/1035665/pexels-photo-1035665.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Salón de bodas" }],
      social: { instagram: "https://www.instagram.com" }, seo: { title: "Áurea Celebraciones | Bodas y eventos en Managua", description: "Dirección creativa y producción integral de bodas y eventos privados en Managua.", keyword: "organización de bodas Managua" },
    },
    coverUrl: "https://images.pexels.com/photos/16120229/pexels-photo-16120229.jpeg?auto=compress&cs=tinysrgb&w=1600",
  },
];

try {
  const owner = await prisma.user.findFirst({ where: { role: "ADMIN", username: "Maycolljaramillo" } })
    || await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
  if (!owner) throw new Error("No existe un usuario administrador para asignar los sitios.");

  const created = [];
  for (const [index, definition] of sites.entries()) {
    const document = instantiateTemplateV2(definition.templateId, definition.content);
    const site = await prisma.$transaction(async (tx) => {
      const saved = await tx.site.upsert({
        where: { publicSlug: definition.slug },
        create: {
          userId: owner.id,
          businessName: document.content.business.name,
          businessType: document.content.business.type,
          location: document.content.business.location,
          phone: document.content.business.phone,
          email: document.content.business.email,
          goal: "Conseguir nuevos clientes",
          visualStyle: definition.templateId,
          builderVersion: 2,
          templateId: document.template.id,
          contentJson: document.content,
          designJson: document.template.theme,
          publicSlug: definition.slug,
          status: "PUBLISHED",
          publishedAt: new Date(publishedAt - index * 1000),
          primaryColor: document.template.theme.primary,
          secondaryColor: document.template.theme.secondary,
          accentColor: document.template.theme.accent,
          coverUrl: definition.coverUrl,
        },
        update: {
          userId: owner.id,
          businessName: document.content.business.name,
          businessType: document.content.business.type,
          location: document.content.business.location,
          phone: document.content.business.phone,
          email: document.content.business.email,
          visualStyle: definition.templateId,
          builderVersion: 2,
          templateId: document.template.id,
          contentJson: document.content,
          designJson: document.template.theme,
          status: "PUBLISHED",
          publishedAt: new Date(publishedAt - index * 1000),
          primaryColor: document.template.theme.primary,
          secondaryColor: document.template.theme.secondary,
          accentColor: document.template.theme.accent,
          coverUrl: definition.coverUrl,
        },
      });
      await tx.siteSection.deleteMany({ where: { siteId: saved.id } });
      await tx.siteSection.createMany({ data: document.sections.map((section, order) => ({
        id: section.id,
        siteId: saved.id,
        type: "canvas",
        title: section.key,
        content: section,
        order,
        isVisible: true,
        settingsJson: {},
      })) });
      return saved;
    });
    created.push({ id: site.id, name: site.businessName, templateId: site.templateId, slug: site.publicSlug, url: `/s/${site.publicSlug}` });
  }
  console.log(JSON.stringify({ owner: owner.username, sites: created }, null, 2));
} finally {
  await prisma.$disconnect();
}
