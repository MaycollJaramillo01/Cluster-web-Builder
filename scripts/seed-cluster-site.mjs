import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function createPublicSlug(value) {
  const base = value.toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "").slice(0, 42) || "sitio";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

function s(type, order, title, content, settings = {}) {
  return { type, order, title, isVisible: true, content, settingsJson: settings };
}

const SITE = {
  businessName: "Cluster",
  businessType: "Plataforma de sitios web para negocios",
  goal: "get_clients",
  visualStyle: "StudioSplit",
  location: "Latinoamerica",
  phone: null,
  email: "info@cluster.marketing",
  domain: "cluster.marketing",
  language: "es",
  primaryColor: "#6d35db",
  secondaryColor: "#1e1b4b",
  accentColor: "#a78bfa",
  sections: [
    s("hero", 0, "Diseña. Publica. Crece.", {
      subtitle: "Plataforma de sitios web para negocios",
      body: "Convierte tu idea en una pagina web profesional en minutos. Sin codigo, sin complicaciones. Tu negocio en linea hoy.",
      ctaText: "Crear mi sitio gratis",
      ctaLink: "/builder",
      imagePrompt: "modern creative agency workspace with multiple screens showing beautiful website designs, purple tones, clean minimal office",
    }),
    s("about_us", 1, "La plataforma que convierte negocios en presencia digital", {
      subtitle: "Quienes somos",
      body: "Cluster nacio con una mision clara: que cualquier negocio latinoamericano pueda tener un sitio web de calidad sin depender de agencias costosas ni codigo complejo. Un motor de IA que entiende tu negocio y lo convierte en una pagina web lista para publicar.",
      imagePrompt: "team of designers and developers working on digital projects, modern studio, purple branding",
    }, {
      highlights: [
        { title: "+500 sitios creados", description: "Negocios de toda Latinoamerica ya confian en Cluster para su presencia digital." },
        { title: "26 estilos unicos", description: "Cada sitio tiene su propio diseno, paleta y personalidad. Nunca dos iguales." },
        { title: "Publicado en minutos", description: "Desde la primera respuesta hasta el sitio en linea: menos de 5 minutos." },
        { title: "Sin codigo requerido", description: "Disenado para emprendedores, no para desarrolladores." },
      ],
    }),
    s("services", 2, "Todo lo que necesitas para estar en linea", {
      subtitle: "Que incluye Cluster",
      body: "Desde el diseno hasta la publicacion, Cluster se encarga de cada detalle para que tu te concentres en tu negocio.",
    }, {
      items: [
        { name: "Creacion con IA", description: "La IA disena tu sitio completo desde una descripcion de tu negocio. Solo respondes unas preguntas y el resto lo hacemos nosotros." },
        { name: "26 estilos de diseno", description: "Panorama, Editorial, Split, Inmersivo y mas. Cada estilo tiene tipografias, paletas y animaciones propias." },
        { name: "Publicacion instantanea", description: "Publica con un clic. Tu sitio queda en linea en segundos con URL propia incluida." },
        { name: "Optimizado para movil", description: "Cada sitio se adapta perfectamente a celulares, tablets y escritorio sin ningun esfuerzo adicional." },
        { name: "SEO incluido", description: "Titulos, meta tags y estructura optimizada para aparecer en Google desde el primer dia." },
      ],
    }),
    s("process", 3, "De la idea al sitio web en 4 pasos", {
      subtitle: "Como funciona",
      body: "El proceso mas simple que existe para tener tu pagina web profesional en linea.",
    }, {
      items: [
        { title: "Describe tu negocio", description: "Cuentanos que haces, donde estas y a quien le vendes. Toma menos de 2 minutos." },
        { title: "La IA disena tu sitio", description: "Nuestro motor crea el contenido, la estructura y el diseno completo en segundos." },
        { title: "Personaliza los detalles", description: "Ajusta textos, colores e imagenes con nuestro editor visual. Sin tocar codigo." },
        { title: "Publica en linea", description: "Con un clic tu sitio queda publicado con URL propia y hosting incluido." },
      ],
    }),
    s("benefits", 4, "Por que elegir Cluster", {
      subtitle: "Ventajas reales",
      body: "No somos otro constructor de sitios generico. Cluster fue construido especificamente para negocios latinoamericanos que necesitan resultados reales.",
    }, {
      items: [
        { title: "Cero codigo", description: "No necesitas saber programar. Cluster hace el trabajo tecnico por ti." },
        { title: "Imagenes profesionales", description: "Fotos de alta calidad integradas automaticamente segun tu tipo de negocio." },
        { title: "IA entrenada para negocios", description: "No es un chat generico. Cluster entiende lo que tu cliente necesita ver." },
        { title: "Hosting incluido", description: "Tu sitio vive en nuestros servidores. Sin costos adicionales de hospedaje." },
      ],
    }),
    s("contact", 5, "Hablemos de tu proyecto", {
      subtitle: "Contacto",
      body: "Tienes preguntas, ideas o quieres conocer los planes. Escribenos y te respondemos pronto.",
      ctaText: "Escribir a Cluster",
      ctaLink: "mailto:info@cluster.marketing",
    }),
    s("footer", 6, "Cluster", {
      subtitle: "La forma mas rapida de tener tu sitio web",
      body: "cluster.marketing · info@cluster.marketing",
      ctaText: "Crear mi sitio",
      ctaLink: "/builder",
    }),
  ],
};

async function main() {
  // Remove any existing Cluster site to avoid duplicates
  await prisma.site.deleteMany({
    where: { domain: "cluster.marketing" },
  });

  const publicSlug = createPublicSlug("cluster-marketing");

  const site = await prisma.site.create({
    data: {
      userId: null,
      businessName: SITE.businessName,
      businessType: SITE.businessType,
      goal: SITE.goal,
      visualStyle: SITE.visualStyle,
      location: SITE.location,
      phone: SITE.phone,
      email: SITE.email,
      domain: SITE.domain,
      language: SITE.language,
      publicSlug,
      status: "PUBLISHED",
      publishedAt: new Date(),
      primaryColor: SITE.primaryColor,
      secondaryColor: SITE.secondaryColor,
      accentColor: SITE.accentColor,
      blueprintJson: {},
      sections: {
        create: SITE.sections.map((sec) => ({
          type: sec.type,
          order: sec.order,
          title: sec.title,
          isVisible: sec.isVisible,
          content: sec.content,
          settingsJson: sec.settingsJson,
        })),
      },
    },
  });

  console.log(`Cluster Marketing site created: /s/${site.publicSlug}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
