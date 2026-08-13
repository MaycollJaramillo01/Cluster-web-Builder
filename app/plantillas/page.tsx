import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { DesignLanguageId } from "@/lib/site/design-language-types";
import { composeSiteSectionsV2 } from "@/lib/site/section-composer";
import { getColorPalettePair } from "@/lib/site/color-palettes";
import { SITE_RECIPES, type SiteRecipeId } from "@/lib/site/site-recipes";
import type { ThemeTokensV2 } from "@/lib/site/v2-schema";
import { renderSiteV2 } from "@/lib/site/v2-render";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Plantillas para negocios de servicio | Cluster",
  description: "Seis lenguajes visuales para contratistas, oficios y servicios locales. Cada sitio se compone con contenido real, no con una plantilla rellenada.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Plantillas para negocios de servicio | Cluster",
    description: "Seis lenguajes visuales para contratistas, oficios y servicios locales.",
    type: "website",
    locale: "es_ES",
  },
};

type DemoSeed = {
  slug: string;
  name: string;
  businessType: string;
  language: DesignLanguageId;
  languageName: string;
  summary: string;
  swatch: string;
  /** Receta funcional a forzar. Sin ella el compositor usa su orden por defecto. */
  recipe?: SiteRecipeId;
  theme: Partial<ThemeTokensV2>;
  content: unknown;
};

const DEMO_VISUAL_STYLE: Record<DesignLanguageId, string> = {
  bauhaus: "bold",
  swiss: "modern_clean",
  editorial: "premium_elegant",
  industrial: "local_trustworthy",
  storm: "local_trustworthy",
  makeover: "modern_clean",
};

const ATLANTIC_SKY = getColorPalettePair("atlantic-sky")!;

const image = (photoId: number, width = 1600, height = 1000) =>
  `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${width}&h=${height}`;

const DEMOS: DemoSeed[] = [
  {
    slug: "taller-brava",
    name: "Taller Brava",
    businessType: "Mobiliario a medida",
    language: "bauhaus",
    languageName: "Bauhaus UI",
    summary: "Geometría directa, rojo de señal y una composición con energía de cartel.",
    swatch: "#e6392f",
    theme: {
      primary: "#e6392f",
      secondary: "#171717",
      accent: "#e6392f",
      background: "#f5f0e6",
      text: "#171717",
      muted: "#625e56",
    },
    content: {
      business: {
        name: "Taller Brava",
        type: "Mobiliario a medida",
        location: "Carretera a Masaya, Managua",
        phone: "+505 2270 1840",
        email: "hola@tallerbrava.test",
      },
      hero: {
        subtitle: "Diseño local - Hecho para durar",
        title: "Muebles que ordenan tu espacio.",
        body: "Diseñamos y fabricamos piezas a medida para hogares, oficinas y comercios. Sin catálogos genéricos.",
        ctaText: "Cotizar un proyecto",
        ctaLink: "#contact",
        media: image(18947396),
      },
      about: {
        subtitle: "Taller, diseño y oficio",
        title: "La forma sigue a tu manera de vivir.",
        body: "Somos un pequeño equipo de diseñadores y ebanistas en Managua. Trabajamos madera sólida y tableros de alta resistencia, cuidando proporción, uso y mantenimiento desde el primer boceto.",
        media: image(5974344, 1000, 1200),
        highlights: [
          { title: "12 años", description: "Diseñando y fabricando localmente." },
          { title: "4 semanas", description: "Plazo medio para una pieza residencial." },
          { title: "1 a 1", description: "Seguimiento directo con el diseñador." },
        ],
      },
      services: [
        { title: "Cocinas", description: "Distribución, almacenaje y superficies pensadas para el uso diario.", meta: "Desde diseño hasta instalación" },
        { title: "Mobiliario comercial", description: "Mostradores, exhibidores y mesas que resisten operación continua.", meta: "Proyectos por etapas" },
        { title: "Piezas únicas", description: "Mesas, libreros y soluciones difíciles de encontrar prefabricadas.", meta: "A medida" },
      ],
      benefits: [
        { title: "01", description: "Medición y diagnóstico del espacio." },
        { title: "02", description: "Propuesta visual con materiales definidos." },
        { title: "03", description: "Fabricación con avances semanales." },
        { title: "04", description: "Instalación y ajuste final incluidos." },
      ],
      media: [
        { url: image(19407121, 1200, 900), alt: "Detalle de mueble de madera" },
        { url: image(5974344, 1200, 900), alt: "Mesa de comedor de madera" },
        { url: image(18947396, 1200, 900), alt: "Gabinete en proceso de fabricación" },
        { url: image(19407121, 1200, 900), alt: "Estantería de madera instalada" },
      ],
      reviews: [
        { name: "Lucía Robleto", role: "Propietaria de café", quote: "Entendieron el flujo del local y resolvieron almacenamiento que ni siquiera habíamos considerado.", rating: 5, source: "Cliente verificado" },
        { name: "Andrés Mejía", role: "Arquitecto", quote: "Buena comunicación, medidas precisas y una instalación limpia.", rating: 5, source: "Cliente verificado" },
      ],
      faqs: [
        { question: "¿Trabajan fuera de Managua?", answer: "Sí. Visitamos proyectos en Granada, Masaya, León y zonas cercanas con cita previa." },
        { question: "¿Puedo llevar una referencia?", answer: "Claro. La usamos para entender el gusto y luego adaptamos proporciones, materiales y función al espacio real." },
      ],
      contact: {
        title: "Conversemos sobre el espacio que quieres resolver.",
        body: "Cuéntanos medidas aproximadas, uso y fecha ideal. Respondemos en un día hábil.",
        ctaText: "Enviar consulta",
      },
      seo: { title: "Taller Brava | Mobiliario a medida", description: "Diseño y fabricación de mobiliario a medida en Managua." },
    },
  },
  {
    slug: "clinica-cauce",
    name: "Clínica Cauce",
    businessType: "Fisioterapia y movimiento",
    language: "swiss",
    languageName: "Swiss Design",
    summary: "Retícula rigurosa, azul clínico y jerarquía informativa para decidir rápido.",
    swatch: "#165dff",
    theme: {
      primary: "#165dff",
      secondary: "#101820",
      accent: "#165dff",
      background: "#ffffff",
      text: "#101820",
      muted: "#58616a",
    },
    content: {
      business: {
        name: "Clínica Cauce",
        type: "Fisioterapia y movimiento",
        location: "Los Robles, Managua",
        phone: "+505 2255 4102",
        email: "citas@clinicacauce.test",
      },
      hero: {
        subtitle: "Evaluación precisa - Plan claro",
        title: "Entiende la causa. Vuelve a moverte con confianza.",
        body: "Fisioterapia basada en evaluación funcional para dolor, recuperación deportiva y movilidad. Un plan claro y medible desde la primera cita.",
        ctaText: "Agendar evaluación",
        ctaLink: "#contact",
        media: image(20860579),
      },
      about: {
        subtitle: "Atención individual",
        title: "Un proceso visible de principio a fin.",
        body: "Cada sesión tiene un objetivo concreto. Evaluamos movimiento, fuerza y tolerancia a la carga para construir un plan que puedas comprender y sostener fuera de la clínica.",
        media: image(20860599, 1000, 1200),
        highlights: [
          { title: "45 min", description: "Sesiones individuales sin rotación de pacientes." },
          { title: "24 h", description: "Acceso a tu plan de ejercicios después de evaluar." },
          { title: "Semanal", description: "Revisión objetiva del progreso." },
        ],
      },
      services: [
        { title: "Dolor musculoesquelético", description: "Cuello, espalda, hombro, rodilla y lesiones por sobrecarga.", meta: "Evaluación funcional" },
        { title: "Rehabilitación deportiva", description: "Retorno progresivo a correr, levantar peso o competir.", meta: "Pruebas de rendimiento" },
        { title: "Movilidad activa", description: "Programas para recuperar rango, fuerza y autonomía.", meta: "Plan personalizado" },
      ],
      benefits: [
        { title: "Evaluar", description: "Identificamos capacidades, límites y objetivos." },
        { title: "Planificar", description: "Definimos fases y señales claras de avance." },
        { title: "Entrenar", description: "Combinamos terapia manual con ejercicio útil." },
        { title: "Medir", description: "Ajustamos el plan con datos, no con intuición." },
      ],
      media: [
        { url: image(20860619, 1200, 900), alt: "Ejercicio guiado en clínica" },
        { url: image(29807423, 1200, 900), alt: "Rehabilitación deportiva" },
        { url: image(5793687, 1200, 900), alt: "Sala de fisioterapia" },
      ],
      reviews: [
        { name: "María Fernanda López", role: "Corredora recreativa", quote: "Por primera vez entendí qué estaba limitando mi rodilla y cómo trabajar para volver a correr.", rating: 5, source: "Paciente verificada" },
        { name: "Carlos Téllez", role: "Paciente", quote: "El plan fue claro, progresivo y compatible con mi trabajo.", rating: 5, source: "Paciente verificado" },
      ],
      faqs: [
        { question: "¿Necesito orden médica?", answer: "No para la evaluación inicial. Si encontramos señales que requieren atención médica, te lo explicaremos antes de continuar." },
        { question: "¿Cuántas sesiones necesitaré?", answer: "Depende del objetivo y la evaluación. Después de la primera cita recibirás una recomendación por fases, sin paquetes obligatorios." },
      ],
      contact: {
        title: "Agenda una evaluación funcional.",
        body: "Indica tu molestia principal y el horario que te funciona. Confirmamos la cita por teléfono o correo.",
        ctaText: "Solicitar cita",
      },
      seo: { title: "Clínica Cauce | Fisioterapia en Managua", description: "Fisioterapia y rehabilitación con planes medibles en Managua." },
    },
  },
  {
    slug: "casa-mombacho",
    name: "Casa Mombacho",
    businessType: "Hospedaje boutique",
    language: "editorial",
    languageName: "Editorial UI",
    summary: "Tipografía narrativa, verde profundo y fotografía como hilo conductor de la estancia.",
    swatch: "#315c45",
    theme: {
      primary: "#315c45",
      secondary: "#24362b",
      accent: "#315c45",
      background: "#f4f0e7",
      text: "#252821",
      muted: "#6b6d63",
    },
    content: {
      business: {
        name: "Casa Mombacho",
        type: "Hospedaje boutique",
        location: "Centro histórico, Granada",
        phone: "+505 2552 0931",
        email: "reservas@casamombacho.test",
      },
      hero: {
        subtitle: "Granada, Nicaragua",
        title: "Una casa tranquila para vivir la ciudad sin prisa.",
        body: "Ocho habitaciones alrededor de un patio fresco, desayuno de temporada y rutas a pie para descubrir Granada desde adentro.",
        ctaText: "Consultar disponibilidad",
        ctaLink: "#contact",
        media: image(30952470),
      },
      about: {
        subtitle: "Una casa con otra cadencia",
        title: "Entre el patio, la sombra y el sonido lejano de la ciudad.",
        body: "Casa Mombacho ocupa una residencia restaurada cerca del parque central. Conservamos sus corredores, mosaicos y jardín interior, sumando lo necesario para una estancia cómoda y silenciosa. Aquí las mañanas empiezan con café de altura y fruta local; las tardes se dejan abiertas para caminar, leer o mirar la lluvia caer sobre el patio.",
        media: image(29119037, 1000, 1200),
        highlights: [
          { title: "8 habitaciones", description: "Cada una con luz y mobiliario propios." },
          { title: "Desayuno local", description: "Incluido y preparado cada mañana." },
          { title: "A pie", description: "A pocas cuadras del centro histórico." },
        ],
      },
      services: [
        { title: "Habitación Patio", description: "Ventanas al jardín interior, cama queen y rincón de lectura.", meta: "2 huéspedes" },
        { title: "Suite Corredor", description: "Techo alto, balcón privado y baño amplio con luz natural.", meta: "2 huéspedes" },
        { title: "Casa completa", description: "Las ocho habitaciones y espacios comunes para grupos pequeños.", meta: "Hasta 18 huéspedes" },
      ],
      benefits: [
        { title: "Llegar", description: "Traslado coordinado desde el aeropuerto o cualquier ciudad cercana." },
        { title: "Descubrir", description: "Mapa propio con talleres, cocinas y rincones que visitamos de verdad." },
        { title: "Descansar", description: "Patio silencioso, ropa de cama natural y horario de calma nocturna." },
      ],
      media: [
        { url: image(36201032, 1200, 900), alt: "Patio interior de la casa" },
        { url: image(35846903, 1200, 900), alt: "Jardín interior tropical" },
        { url: image(29119037, 1200, 900), alt: "Corredor colonial con plantas" },
        { url: image(20308408, 1200, 900), alt: "Calle colorida de Granada" },
        { url: image(30952470, 1200, 900), alt: "Patio tropical al atardecer" },
      ],
      reviews: [
        { name: "Elena y Marco", role: "Viajeros", quote: "La casa tiene la calma de un lugar vivido. Nos dieron recomendaciones precisas y nunca sentimos prisa.", rating: 5, source: "Huéspedes verificados" },
        { name: "Sofía Ramírez", role: "Huésped", quote: "El patio, el desayuno y la atención hicieron que alargáramos la estancia.", rating: 5, source: "Huésped verificada" },
      ],
      faqs: [
        { question: "¿Ofrecen traslado?", answer: "Sí. Coordinamos transporte privado desde Managua, el aeropuerto y otras ciudades con reserva previa." },
        { question: "¿Se puede trabajar desde la casa?", answer: "Sí. Hay internet estable y mesas en habitaciones y áreas comunes, aunque cuidamos un ambiente tranquilo." },
      ],
      contact: {
        title: "Dinos cuándo quieres llegar.",
        body: "Comparte fechas, número de huéspedes y cualquier detalle importante. Te enviaremos opciones disponibles y tarifa total.",
        ctaText: "Consultar estancia",
      },
      seo: { title: "Casa Mombacho | Hospedaje boutique en Granada", description: "Hospedaje boutique de ocho habitaciones en el centro histórico de Granada." },
    },
  },
  {
    slug: "cumbre-roofing",
    name: "Cumbre Roofing & Exteriors",
    businessType: "Roofing residencial y exteriores",
    language: "industrial",
    languageName: "Industrial Utility",
    summary: "Jerarquía de obra, evidencia verificable y una ruta corta hacia llamada o cotización.",
    swatch: "#f5a623",
    recipe: "contractor-pro",
    theme: {
      primary: "#17324d",
      secondary: "#101820",
      accent: "#f5a623",
      background: "#f4f1ea",
      text: "#101820",
      muted: "#5d6670",
    },
    content: {
      business: {
        name: "Cumbre Roofing & Exteriors",
        type: "Roofing residencial y exteriores",
        location: "Houston, Katy y Cypress, Texas",
        phone: "+1 (713) 555-0148",
        email: "estimados@cumbreroofing.test",
      },
      hero: {
        subtitle: "Inspección clara · Trabajo asegurado · Houston, TX",
        title: "Tu techo listo para la próxima tormenta.",
        body: "Inspeccionamos el daño, documentamos el alcance y resolvemos reparaciones o reemplazos con materiales y plazos por escrito.",
        ctaText: "Pedir inspección",
        ctaLink: "#contact",
        media: image(31771166),
      },
      about: {
        subtitle: "Contratista local · Atención en español e inglés",
        title: "Una cuadrilla local que explica el trabajo antes de empezar.",
        body: "Cumbre atiende viviendas en el oeste y noroeste de Houston. Cada visita comienza con una inspección documentada, fotografías del daño y una propuesta por escrito. El propietario sabe qué se hará, qué materiales se usarán y quién responderá durante la obra.",
        media: image(30514132, 1000, 1200),
        highlights: [
          { title: "10 años", description: "Garantía de mano de obra en reemplazos completos." },
          { title: "24 horas", description: "Respuesta inicial para daños por tormenta." },
          { title: "1 contacto", description: "Un responsable desde la inspección hasta el cierre." },
        ],
      },
      services: [
        { title: "Inspección de techo", description: "Revisión de shingles, flashing, ventilación y puntos de filtración con reporte fotográfico.", meta: "Sin presión de venta" },
        { title: "Reemplazo completo", description: "Retiro, preparación de deck, instalación y limpieza final con alcance documentado.", meta: "Residencial" },
        { title: "Daño por tormenta", description: "Protección temporal, documentación del daño y reparación priorizada para detener filtraciones.", meta: "Respuesta rápida" },
        { title: "Gutters y siding", description: "Canaletas, fascia y revestimiento exterior coordinados con el sistema de techo.", meta: "Exterior completo" },
      ],
      benefits: [
        { title: "01 · Inspeccionar", description: "Fotografiamos el estado actual y separamos mantenimiento, reparación y reemplazo." },
        { title: "02 · Cotizar", description: "Entregamos alcance, materiales, exclusiones y plazo por escrito." },
        { title: "03 · Ejecutar", description: "Protegemos la propiedad, coordinamos la cuadrilla y reportamos avances." },
        { title: "04 · Verificar", description: "Hacemos recorrido final, limpieza magnética y entrega de garantías." },
      ],
      media: [
        { url: image(31771166, 1400, 1000), alt: "Instalación de shingles en una vivienda" },
        { url: image(37623622, 1200, 900), alt: "Técnico trabajando con equipo de seguridad sobre un techo" },
        { url: image(30514132, 1200, 900), alt: "Cuadrilla instalando la estructura de un techo" },
        { url: image(259588, 1200, 900), alt: "Exterior terminado de una vivienda residencial" },
      ],
      reviews: [
        { name: "Marisol G.", role: "Propietaria en Katy", quote: "Nos enseñaron las fotos, explicaron qué sí necesitaba reparación y terminaron sin dejar clavos en el patio.", rating: 5, source: "Reseña de demostración" },
        { name: "Daniel R.", role: "Propietario en Cypress", quote: "La propuesta fue clara y el supervisor respondió el teléfono durante todo el trabajo.", rating: 5, source: "Reseña de demostración" },
        { name: "Ana y Luis P.", role: "Propietarios en Houston", quote: "Pudimos hablar en español con la cuadrilla y entender cada decisión antes de aprobarla.", rating: 5, source: "Reseña de demostración" },
      ],
      faqs: [
        { question: "¿La inspección me obliga a contratar?", answer: "No. Recibes el diagnóstico y las opciones recomendadas; la decisión de continuar es tuya." },
        { question: "¿Atienden daños después de una tormenta?", answer: "Sí. Priorizamos filtraciones activas y podemos instalar protección temporal antes de la reparación definitiva." },
        { question: "¿Trabajan con seguros?", answer: "Documentamos daños y alcance para que puedas conversar con tu aseguradora. La cobertura final siempre la determina tu póliza y su ajustador." },
        { question: "¿En qué zonas trabajan?", answer: "Atendemos Houston, Katy, Cypress y comunidades cercanas según el alcance del proyecto." },
      ],
      contact: {
        title: "Empieza con una inspección, no con una promesa.",
        body: "Cuéntanos tu zona, tipo de techo y si existe una filtración activa. Te llamamos para confirmar la visita y el siguiente paso.",
        ctaText: "Solicitar inspección",
      },
      seo: { title: "Cumbre Roofing & Exteriors | Houston, TX", description: "Inspección, reparación y reemplazo de techos residenciales en Houston, Katy y Cypress.", keyword: "roofing Houston" },
    },
  },
  {
    slug: "vanguard-storm",
    name: "Vanguard Storm & Restoration",
    businessType: "Respuesta a daños por tormenta",
    language: "storm",
    languageName: "Storm Response",
    summary: "Emergencia declarada, disponibilidad medible y el reclamo de seguro explicado antes de pedir el contacto.",
    swatch: "#ff5a1f",
    recipe: "storm-response",
    theme: {
      primary: "#123a5c",
      secondary: "#0b1620",
      accent: "#ff5a1f",
      background: "#eef1f4",
      text: "#0b1620",
      muted: "#5a6672",
    },
    content: {
      business: {
        name: "Vanguard Storm & Restoration",
        type: "Respuesta a daños por tormenta",
        location: "Oklahoma City, Edmond y Norman, Oklahoma",
        phone: "+1 (405) 555-0172",
        email: "despacho@vanguardstorm.test",
      },
      hero: {
        subtitle: "Cuadrilla de guardia 24/7",
        title: "Llegamos antes de que el agua siga avanzando.",
        body: "Techo, agua, plomería y climatización después de una tormenta. Contenemos el daño, lo documentamos para tu aseguradora y reparamos con alcance por escrito.",
        ctaText: "Reportar una emergencia",
        ctaLink: "#contact",
        media: image(37623622),
      },
      about: {
        subtitle: "Despacho local · Atención en español e inglés",
        title: "Un despacho que contesta a las 3 de la mañana.",
        body: "Vanguard atiende viviendas y comercios en el área metropolitana de Oklahoma City. Mantenemos cuadrillas de guardia todo el año porque el daño por tormenta no espera al horario de oficina. Cada llamada entra a un despacho real, no a un buzón: registramos la dirección, el tipo de daño y enviamos la unidad más cercana con material de contención.",
        media: image(30514132, 1000, 1200),
        highlights: [
          { title: "24/7/365", description: "Despacho atendido por personal propio, sin centro de llamadas externo." },
          { title: "90 minutos", description: "Llegada objetivo dentro del área metropolitana." },
          { title: "Licencia y póliza", description: "Contratista licenciado y asegurado, verificable antes de firmar." },
        ],
      },
      services: [
        { title: "Contención inmediata", description: "Lonas, tapado de aberturas y extracción de agua para detener el daño en las primeras horas.", meta: "Primera respuesta" },
        { title: "Daño por agua y moho", description: "Secado con equipo de medición, control de humedad y retiro de material comprometido.", meta: "Restauración" },
        { title: "Techo y exteriores", description: "Reparación o reemplazo tras granizo y viento, con canaletas y revestimiento coordinados.", meta: "Roofing" },
        { title: "Plomería de urgencia", description: "Tubería reventada, fugas bajo losa y reconexión de suministro tras congelamiento.", meta: "Plomería" },
        { title: "Climatización", description: "Diagnóstico y reposición de equipos HVAC dañados por agua, granizo o descarga eléctrica.", meta: "HVAC" },
        { title: "Expediente para el seguro", description: "Reporte fotográfico, medición de humedad y alcance detallado listo para tu ajustador.", meta: "Seguros" },
      ],
      benefits: [
        { title: "24/7", description: "Línea de despacho activa todos los días del año" },
        { title: "90 min", description: "Llegada objetivo en el área metropolitana" },
        { title: "3 condados", description: "Oklahoma, Cleveland y Canadian" },
        { title: "1 responsable", description: "Un supervisor asignado desde la llamada" },
      ],
      media: [
        { url: image(37623622, 1400, 1000), alt: "Técnico con equipo de seguridad trabajando sobre un techo" },
        { url: image(31771166, 1200, 900), alt: "Instalación de shingles en una vivienda" },
        { url: image(30514132, 1200, 900), alt: "Cuadrilla trabajando en la estructura de un techo" },
        { url: image(259588, 1200, 900), alt: "Exterior de vivienda residencial ya reparada" },
      ],
      reviews: [
        { name: "Rebecca T.", role: "Propietaria en Edmond", quote: "Llamé a la medianoche y había una cuadrilla lonando el techo antes del amanecer. Eso evitó que el agua llegara al segundo piso.", rating: 5, source: "Reseña de demostración" },
        { name: "Miguel A.", role: "Propietario en Moore", quote: "El expediente de fotos y mediciones fue justo lo que pidió el ajustador. No tuve que discutir el alcance.", rating: 5, source: "Reseña de demostración" },
        { name: "Karen y Dave S.", role: "Propietarios en Norman", quote: "Explicaron qué cubría la póliza y qué no antes de empezar. Sin sorpresas al final.", rating: 5, source: "Reseña de demostración" },
      ],
      faqs: [
        { question: "¿Atienden fuera del horario de oficina?", answer: "Sí. El despacho opera 24 horas todos los días del año y la cuadrilla de guardia sale con material de contención en la primera visita." },
        { question: "¿Qué hago mientras llega la cuadrilla?", answer: "Corta la electricidad de la zona afectada si es seguro hacerlo, cierra la llave de paso si hay fuga y toma fotos del daño antes de mover nada. Te guiamos por teléfono mientras vamos en camino." },
        { question: "¿Trabajan con mi aseguradora?", answer: "Documentamos el daño con fotos, mediciones de humedad y alcance detallado, y coordinamos la visita del ajustador. La cobertura y el deducible siempre los determina tu póliza, no nosotros." },
        { question: "¿Puedo elegir a mi contratista aunque el seguro sugiera otro?", answer: "En general sí: la mayoría de las pólizas permiten elegir contratista. Revisa tu documento o pregúntanos y lo verificamos contigo antes de comenzar." },
        { question: "¿Cuánto tarda una restauración completa?", answer: "La contención ocurre el mismo día. El secado suele tomar de tres a cinco días con medición diaria, y la reparación depende del alcance aprobado; lo entregamos por escrito antes de empezar." },
      ],
      contact: {
        title: "¿Hay daño activo ahora mismo?",
        body: "Llama y despachamos la unidad de guardia. Si prefieres escribir, indícanos la dirección, el tipo de daño y si el agua sigue entrando.",
        ctaText: "Enviar reporte",
      },
      seo: { title: "Vanguard Storm & Restoration | Oklahoma City, OK", description: "Respuesta 24/7 a daños por tormenta, agua, plomería y HVAC en Oklahoma City, Edmond y Norman.", keyword: "storm damage restoration Oklahoma City" },
    },
  },
  {
    slug: "brightline-exteriores",
    name: "Brightline Exterior Care",
    businessType: "Lavado a presión y pintura exterior",
    language: "makeover",
    languageName: "Before & After",
    summary: "La transformación como argumento: comparación arrastrable, dos tonos y una ruta corta al presupuesto.",
    swatch: "#C4F8FF",
    recipe: "before-after",
    // Paleta "atlantic-sky" de COLOR_PALETTE_PAIRS.
    theme: {
      primary: ATLANTIC_SKY.deep.hex,
      secondary: ATLANTIC_SKY.deep.hex,
      accent: ATLANTIC_SKY.light.hex,
      background: "#f6fdff",
      text: "#0a2233",
      muted: "#5b7686",
    },
    content: {
      business: {
        name: "Brightline Exterior Care",
        type: "Lavado a presión y pintura exterior",
        location: "Tampa, Brandon y Riverview, Florida",
        phone: "+1 (813) 555-0139",
        email: "hola@brightlineexterior.test",
      },
      hero: {
        subtitle: "Presupuesto sin costo",
        title: "La misma casa. Otra primera impresión.",
        body: "Lavado a presión, pintura exterior y recuperación de superficies para viviendas y comercios. Fotografiamos cada trabajo antes y después, sin retoques.",
        ctaText: "Pedir presupuesto",
        ctaLink: "#contact",
        media: image(259588),
      },
      about: {
        subtitle: "Cuadrilla propia · Tampa Bay",
        title: "Trabajamos hasta que la diferencia se nota desde la acera.",
        body: "Brightline atiende viviendas, condominios y locales en Tampa Bay. Ajustamos presión y producto al material de cada superficie, protegemos plantas y ventanas antes de empezar, y dejamos el perímetro enjuagado. Si el resultado no se nota en la foto, no lo cobramos como terminado.",
        media: image(31771166, 1000, 1200),
        highlights: [
          { title: "Presupuesto sin costo", description: "Visita y medición incluidas" },
          { title: "Licenciados y asegurados", description: "Verificable antes de firmar" },
          { title: "Presión según material", description: "Sin dañar madera ni sellos" },
          { title: "Protección previa", description: "Plantas y ventanas cubiertas" },
          { title: "Fotos antes y después", description: "Del mismo ángulo, sin retoque" },
          { title: "Perímetro enjuagado", description: "Nos vamos sin dejar rastro" },
        ],
      },
      services: [
        { title: "Lavado a presión", description: "Aceras, entradas, terrazas y muros con la presión adecuada para cada material.", meta: "Exterior" },
        { title: "Lavado suave de techo", description: "Retiro de manchas y moho sin levantar tejas ni forzar los sellos.", meta: "Techos" },
        { title: "Pintura exterior", description: "Preparación, sellado de grietas y acabado con garantía por escrito.", meta: "Pintura" },
        { title: "Recuperación de concreto", description: "Manchas de aceite, óxido y sarro en cocheras y estacionamientos.", meta: "Concreto" },
        { title: "Canaletas y fascia", description: "Limpieza interior y exterior con revisión de bajantes.", meta: "Mantenimiento" },
        { title: "Mantenimiento programado", description: "Visitas semestrales para conservar el resultado sin volver a empezar.", meta: "Plan anual" },
      ],
      benefits: [
        { title: "Medimos", description: "Visitamos, identificamos el material y calculamos el trabajo real." },
        { title: "Protegemos", description: "Cubrimos plantas, luminarias y ventanas antes de encender el equipo." },
        { title: "Trabajamos", description: "Ajustamos presión y producto por superficie, sin fórmula única." },
        { title: "Comparamos", description: "Fotografiamos el mismo ángulo antes y después y te lo entregamos." },
      ],
      media: [
        { url: image(259588, 1400, 1000), alt: "Exterior de vivienda residencial con entrada de concreto" },
        { url: image(30514132, 1400, 1000), alt: "Cuadrilla trabajando en el exterior de una vivienda" },
        { url: image(37623622, 1400, 1000), alt: "Técnico con equipo de seguridad sobre una cubierta" },
        { url: image(31771166, 1400, 1000), alt: "Superficie de tejado recién intervenida" },
      ],
      reviews: [
        { name: "Danielle P.", role: "Propietaria en Brandon", quote: "Mandaron las fotos del mismo ángulo antes y después. La entrada parecía otra y no hubo que discutir nada.", rating: 5, source: "Reseña de demostración" },
        { name: "Hector V.", role: "Administrador de condominio", quote: "Coordinaron por edificios para no bloquear estacionamientos. Terminaron en el plazo que dieron.", rating: 5, source: "Reseña de demostración" },
        { name: "Susan M.", role: "Propietaria en Riverview", quote: "Cubrieron las plantas antes de empezar y al final enjuagaron todo el perímetro.", rating: 5, source: "Reseña de demostración" },
      ],
      faqs: [
        { question: "¿El lavado a presión puede dañar mi casa?", answer: "Si se usa presión de más, sí. Por eso ajustamos el equipo al material: el concreto admite presión alta, pero la madera, el vinilo y el techo se tratan con lavado suave y producto." },
        { question: "¿Cuánto dura el resultado?", answer: "En Florida, entre doce y dieciocho meses según sombra y humedad. Ofrecemos visitas semestrales para conservarlo sin repetir el trabajo completo." },
        { question: "¿Necesito estar en casa?", answer: "No es necesario si tenemos acceso al agua y al área de trabajo. Te enviamos las fotos del antes y del después al terminar." },
        { question: "¿Qué pasa con mis plantas?", answer: "Las cubrimos antes de empezar y las enjuagamos al terminar. Si alguna zona es delicada, la trabajamos a mano." },
        { question: "¿El presupuesto tiene costo?", answer: "No. Visitamos, medimos y entregamos el precio por escrito antes de que decidas." },
      ],
      contact: {
        title: "Cuéntanos qué superficie quieres recuperar.",
        body: "Indícanos la dirección y qué te gustaría mejorar. Pasamos a medir y te enviamos el precio por escrito, sin compromiso.",
        ctaText: "Pedir presupuesto",
      },
      seo: { title: "Brightline Exterior Care | Tampa, FL", description: "Lavado a presión, lavado suave de techo y pintura exterior en Tampa, Brandon y Riverview.", keyword: "pressure washing Tampa" },
    },
  },
];

function renderDemo(demo: DemoSeed) {
  const composed = composeSiteSectionsV2({
    content: demo.content,
    businessType: demo.businessType,
    visualStyle: DEMO_VISUAL_STYLE[demo.language],
    designLanguage: demo.language,
    theme: demo.theme,
    blueprint: demo.recipe ? SITE_RECIPES[demo.recipe].sections : undefined,
  });

  return {
    ...demo,
    html: renderSiteV2({
      ...composed,
      leadEndpoint: "/api/leads/local-preview",
      showBranding: false,
      indexable: false,
    }).html,
  };
}

export default async function TemplateGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string | string[]; viewport?: string | string[] }>;
}) {
  const params = await searchParams;
  const requested = params.site;
  const slug = Array.isArray(requested) ? requested[0] : requested;
  const requestedViewport = Array.isArray(params.viewport) ? params.viewport[0] : params.viewport;
  const mobileViewport = requestedViewport === "mobile";
  const demos = DEMOS.map(renderDemo);

  if (slug) {
    const demo = demos.find((item) => item.slug === slug);
    if (!demo) notFound();

    return (
      <main className="flex h-dvh flex-col overflow-hidden bg-[#111411] text-white">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/15 px-4 sm:px-6">
          <Link
            href="/plantillas"
            className="inline-flex min-h-11 items-center font-semibold text-white underline decoration-white/35 underline-offset-4 transition-colors hover:decoration-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Volver a las plantillas
          </Link>
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <Link
              href={`/plantillas?site=${demo.slug}${mobileViewport ? "" : "&viewport=mobile"}`}
              prefetch={false}
              className="inline-flex min-h-11 items-center text-xs font-bold uppercase tracking-[0.1em] text-white/70 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
            >
              {mobileViewport ? "Ver escritorio" : "Ver móvil"}
            </Link>
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-semibold">{demo.name}</p>
              <p className="truncate text-xs text-white/60">{demo.languageName}</p>
            </div>
          </div>
        </header>
        <div className={`flex min-h-0 flex-1 justify-center ${mobileViewport ? "bg-[#20241f] p-3 sm:p-5" : ""}`}>
          <iframe
            title={`Sitio completo de ${demo.name}`}
            srcDoc={demo.html}
            sandbox="allow-forms allow-scripts"
            className={mobileViewport ? "h-full w-[390px] max-w-full border-0 bg-white shadow-2xl" : "h-full w-full border-0 bg-white"}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#f3f1ea] text-[#171a17]">
      <header className="border-b border-[#171a17]/20">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" className="text-sm font-black uppercase tracking-[0.16em] no-underline">Cluster</Link>
          <Link
            href="/register"
            className="inline-flex min-h-11 items-center border-2 border-[#171a17] bg-[#171a17] px-4 text-xs font-black uppercase tracking-[0.1em] text-white no-underline transition-colors hover:bg-transparent hover:text-[#171a17] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#315c45]"
          >
            Crear mi sitio
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-8 border-b border-[#171a17]/25 pb-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#315c45]">Seis lenguajes, un solo motor</p>
            <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.055em] sm:text-7xl">
              Plantillas para negocios que se contratan por su trabajo.
            </h1>
          </div>
          <div className="max-w-lg">
            <p className="text-base leading-7 text-[#526057]">
              Cada sitio usa contenido, paleta y tipografía propios. Los bloques y su secuencia fueron elegidos por el compositor real de Cluster, no por una plantilla rellenada.
            </p>
            <p className="mt-4 text-sm leading-6 text-[#7a8580]">
              Los negocios que aparecen son ejemplos: los nombres, teléfonos y reseñas se crearon para esta muestra.
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#171a17]/20">
          {demos.map((demo, index) => (
            <article
              key={demo.slug}
              className="grid gap-7 py-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(16rem,.45fr)] lg:items-center lg:gap-10 lg:py-14"
            >
              <div className={`overflow-hidden border border-[#171a17]/25 bg-white ${index % 2 ? "lg:order-2" : ""}`}>
                <iframe
                  title={`Vista previa de ${demo.name}`}
                  srcDoc={demo.html}
                  sandbox=""
                  loading="lazy"
                  tabIndex={-1}
                  className="pointer-events-none h-[24rem] w-full border-0 bg-white sm:h-[30rem]"
                />
              </div>

              <div className={index % 2 ? "lg:order-1" : ""}>
                <div className="mb-8 h-2 w-20" style={{ backgroundColor: demo.swatch }} aria-hidden="true" />
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#526057]">
                  {String(index + 1).padStart(2, "0")} / {demo.languageName}
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.045em]">{demo.name}</h2>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.1em] text-[#526057]">{demo.businessType}</p>
                <p className="mt-5 max-w-md text-base leading-7 text-[#454d47]">{demo.summary}</p>
                <Link
                  href={`/plantillas?site=${demo.slug}`}
                  prefetch={false}
                  className="mt-8 inline-flex min-h-11 items-center border-2 border-[#171a17] bg-[#171a17] px-5 py-2.5 text-sm font-black uppercase tracking-[0.08em] text-white transition-colors hover:bg-transparent hover:text-[#171a17] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#315c45]"
                >
                  Abrir sitio completo
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
