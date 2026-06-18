import type { Blueprint, BlueprintSection } from "@/lib/site/blueprint";
import {
  GOAL_LABELS,
  resolveBusinessTypeLabel,
  type OnboardingInput,
} from "@/lib/validators/site-onboarding";

type Item = Record<string, string>;

type IndustryCopy = {
  headline: string;
  intro: string;
  about: string;
  services: Item[];
  benefits: Item[];
  faqs: Item[];
  imagePrompt: string;
};

const INDUSTRY_COPY: Record<OnboardingInput["businessType"], IndustryCopy> = {
  roofing: {
    headline: "Techos resistentes, instalados con detalle y garantia",
    intro:
      "Ayudamos a proteger tu propiedad con reparaciones, instalaciones y mantenimiento de techos hechos por profesionales.",
    about:
      "Nuestro equipo combina experiencia practica, materiales confiables y comunicacion clara en cada proyecto. Trabajamos con orden, seguridad y atencion a los detalles para entregar resultados duraderos.",
    services: [
      { name: "Instalacion de techos", description: "Sistemas nuevos para casas, negocios y remodelaciones." },
      { name: "Reparacion de filtraciones", description: "Diagnostico rapido y soluciones para goteras y danos por clima." },
      { name: "Inspecciones preventivas", description: "Revision del estado del techo antes de que el problema crezca." },
      { name: "Mantenimiento", description: "Limpieza, sellado y cuidados para extender la vida util del techo." },
    ],
    benefits: [
      { title: "Trabajo seguro", description: "Procesos ordenados para proteger tu propiedad y al equipo." },
      { title: "Materiales confiables", description: "Opciones duraderas segun presupuesto y tipo de inmueble." },
      { title: "Cotizacion clara", description: "Explicamos alcance, tiempos y costos antes de comenzar." },
    ],
    faqs: [
      { question: "Necesito reparar o cambiar todo el techo?", answer: "Primero revisamos el dano y te recomendamos la opcion mas conveniente." },
      { question: "Atienden emergencias?", answer: "Puedes contactarnos para evaluar disponibilidad y prioridad del servicio." },
      { question: "Hacen cotizaciones?", answer: "Si, podemos preparar una cotizacion segun el estado y tamano del proyecto." },
    ],
    imagePrompt: "professional roofing crew installing shingles on a suburban home, sunny day",
  },
  painting: {
    headline: "Pintura profesional para renovar cualquier espacio",
    intro:
      "Transformamos interiores y exteriores con acabados limpios, colores bien aplicados y preparacion cuidadosa de superficies.",
    about:
      "Cuidamos cada detalle desde la proteccion del area hasta la entrega final. Nuestro enfoque es lograr acabados uniformes, duraderos y alineados al estilo que buscas.",
    services: [
      { name: "Pintura interior", description: "Habitaciones, oficinas, muros, techos y detalles." },
      { name: "Pintura exterior", description: "Fachadas con preparacion para clima y uso diario." },
      { name: "Preparacion de superficies", description: "Resane, lijado y limpieza antes de aplicar pintura." },
      { name: "Asesoria de color", description: "Combinaciones pensadas para tu espacio y marca." },
    ],
    benefits: [
      { title: "Acabados limpios", description: "Cortes precisos y superficies uniformes." },
      { title: "Proteccion del espacio", description: "Cubrimos muebles, pisos y areas de trabajo." },
      { title: "Entrega ordenada", description: "Trabajamos con tiempos claros y limpieza al finalizar." },
    ],
    faqs: [
      { question: "Incluyen materiales?", answer: "Podemos trabajar con materiales incluidos o con los que ya tengas." },
      { question: "Cuanto tarda un proyecto?", answer: "Depende del tamano y preparacion; te damos un estimado antes de iniciar." },
      { question: "Pueden ayudar con colores?", answer: "Si, sugerimos paletas segun luz, estilo y uso del espacio." },
    ],
    imagePrompt: "professional painter applying fresh paint on a modern home interior wall",
  },
  landscaping: {
    headline: "Jardines y exteriores que se ven bien todo el ano",
    intro:
      "Creamos y mantenemos areas verdes funcionales, limpias y atractivas para hogares y negocios.",
    about:
      "Entendemos que un buen exterior mejora la primera impresion y el disfrute diario. Por eso combinamos diseno, mantenimiento y cuidado constante segun las necesidades del terreno.",
    services: [
      { name: "Diseno de jardines", description: "Distribucion de plantas, areas verdes y detalles decorativos." },
      { name: "Mantenimiento de areas verdes", description: "Corte, limpieza, poda y cuidado regular." },
      { name: "Instalacion de pasto", description: "Soluciones para renovar patios y zonas exteriores." },
      { name: "Poda y limpieza", description: "Arboles, arbustos y retiro de residuos verdes." },
    ],
    benefits: [
      { title: "Mejor apariencia", description: "Exteriores limpios y listos para recibir visitas." },
      { title: "Planes flexibles", description: "Servicios por proyecto o mantenimiento recurrente." },
      { title: "Cuidado experto", description: "Recomendaciones segun clima, suelo y temporada." },
    ],
    faqs: [
      { question: "Ofrecen mantenimiento mensual?", answer: "Si, podemos programar visitas recurrentes segun el espacio." },
      { question: "Trabajan en casas y negocios?", answer: "Atendemos propiedades residenciales y comerciales." },
      { question: "Pueden disenar desde cero?", answer: "Si, te ayudamos a planear y ejecutar el proyecto." },
    ],
    imagePrompt: "beautiful residential landscaping crew maintaining a green garden and walkway",
  },
  cleaning: {
    headline: "Limpieza confiable para espacios impecables",
    intro:
      "Mantenemos casas, oficinas y negocios limpios con procesos consistentes y atencion a cada detalle.",
    about:
      "Nuestro servicio esta pensado para ahorrar tiempo y dar tranquilidad. Usamos listas de trabajo claras, productos adecuados y personal comprometido con resultados visibles.",
    services: [
      { name: "Limpieza residencial", description: "Rutinas para casas, apartamentos y mudanzas." },
      { name: "Limpieza comercial", description: "Oficinas, locales y areas comunes limpias y presentables." },
      { name: "Limpieza profunda", description: "Cocinas, banos, pisos y zonas de alto uso." },
      { name: "Planes recurrentes", description: "Servicio semanal, quincenal o mensual segun necesidad." },
    ],
    benefits: [
      { title: "Puntualidad", description: "Coordinamos horarios y cumplimos lo acordado." },
      { title: "Detalle constante", description: "Revisamos las areas clave en cada visita." },
      { title: "Espacios saludables", description: "Limpieza enfocada en higiene y orden." },
    ],
    faqs: [
      { question: "Llevan productos de limpieza?", answer: "Podemos llevarlos o usar los productos que prefieras." },
      { question: "Puedo agendar servicio recurrente?", answer: "Si, ajustamos frecuencia y alcance a tu rutina." },
      { question: "Atienden oficinas?", answer: "Si, trabajamos con hogares, oficinas y negocios." },
    ],
    imagePrompt: "professional cleaning team cleaning a bright modern office space",
  },
  restaurant: {
    headline: "Sabores frescos y una experiencia que invita a volver",
    intro:
      "Recibe a tus clientes con una propuesta clara, platos atractivos y un sitio listo para mostrar menus, horarios y contacto.",
    about:
      "Cada detalle del restaurante comunica confianza: el menu, el ambiente y la forma de atender. Este sitio presenta tu propuesta de manera clara para atraer reservas, pedidos y visitas.",
    services: [
      { name: "Menu destacado", description: "Platos principales, especialidades y opciones populares." },
      { name: "Reservas y contacto", description: "Informacion facil para que el cliente te encuentre." },
      { name: "Eventos y catering", description: "Opciones para grupos, celebraciones o pedidos especiales." },
      { name: "Promociones", description: "Espacio para ofertas, combos o novedades de temporada." },
    ],
    benefits: [
      { title: "Primera impresion clara", description: "El cliente entiende que ofreces desde el primer vistazo." },
      { title: "Mas contactos", description: "Llamadas, ubicacion y horarios visibles." },
      { title: "Imagen profesional", description: "Fotos y mensajes que elevan la experiencia." },
    ],
    faqs: [
      { question: "Puedo mostrar el menu?", answer: "Si, el sitio puede destacar platos, precios y categorias." },
      { question: "Incluye ubicacion?", answer: "Si, se muestra mapa y datos de contacto." },
      { question: "Sirve para promociones?", answer: "Si, puedes editar secciones para mostrar ofertas nuevas." },
    ],
    imagePrompt: "fresh restaurant dishes served on a modern table with warm lighting",
  },
  law_firm: {
    headline: "Asesoria legal clara, profesional y cercana",
    intro:
      "Presenta tus areas de practica, genera confianza y facilita que nuevos clientes soliciten una consulta.",
    about:
      "Un sitio legal debe transmitir seriedad y claridad. Organizamos la informacion para explicar servicios, experiencia y proximos pasos sin prometer resultados ni inventar credenciales.",
    services: [
      { name: "Consultas legales", description: "Orientacion inicial para entender el caso y opciones." },
      { name: "Contratos y documentos", description: "Revision, preparacion y apoyo en documentos clave." },
      { name: "Representacion", description: "Acompanamiento profesional segun el area de practica." },
      { name: "Asesoria preventiva", description: "Recomendaciones para reducir riesgos legales." },
    ],
    benefits: [
      { title: "Comunicacion clara", description: "Explicaciones entendibles y pasos concretos." },
      { title: "Confidencialidad", description: "Manejo cuidadoso de informacion sensible." },
      { title: "Atencion profesional", description: "Servicio serio desde la primera consulta." },
    ],
    faqs: [
      { question: "Como agendo una consulta?", answer: "Puedes llamar o enviar tus datos desde el formulario de contacto." },
      { question: "Que debo llevar a la consulta?", answer: "Documentos relevantes, fechas importantes y una descripcion del caso." },
      { question: "Prometen resultados?", answer: "No. Se explican opciones y riesgos segun la informacion disponible." },
    ],
    imagePrompt: "professional law office consultation table with legal documents",
  },
  real_estate: {
    headline: "Compra, venta y renta con acompanamiento profesional",
    intro:
      "Muestra propiedades, genera confianza y ayuda a compradores o vendedores a dar el siguiente paso.",
    about:
      "El proceso inmobiliario requiere informacion clara, seguimiento y buena presentacion. Este sitio organiza tus servicios y facilita que prospectos te contacten.",
    services: [
      { name: "Venta de propiedades", description: "Promocion y acompanamiento para vender con claridad." },
      { name: "Compra de vivienda", description: "Busqueda y orientacion segun presupuesto y zona." },
      { name: "Rentas", description: "Apoyo para propietarios e interesados en alquilar." },
      { name: "Valoracion inicial", description: "Analisis basico para entender el potencial de una propiedad." },
    ],
    benefits: [
      { title: "Informacion clara", description: "Servicios y contacto visibles para cada interesado." },
      { title: "Mejor presentacion", description: "Imagen profesional para propiedades y marca personal." },
      { title: "Seguimiento facil", description: "Canales de contacto directos para nuevos prospectos." },
    ],
    faqs: [
      { question: "Puedo publicar propiedades?", answer: "Si, puedes usar secciones de galeria y servicios para destacarlas." },
      { question: "Atienden compradores y vendedores?", answer: "Si, el sitio esta preparado para ambos perfiles." },
      { question: "Incluye mapa?", answer: "Si, puede mostrar zona de servicio o ubicacion principal." },
    ],
    imagePrompt: "modern real estate agent showing a bright home exterior to clients",
  },
  medical: {
    headline: "Atencion medica clara, humana y profesional",
    intro:
      "Facilita que pacientes conozcan tus servicios, ubiquen la clinica y soliciten una cita.",
    about:
      "La confianza comienza con informacion clara. Presentamos servicios, datos de contacto y orientacion general sin sustituir una consulta medica profesional.",
    services: [
      { name: "Consulta general", description: "Evaluacion inicial y orientacion de salud." },
      { name: "Chequeos preventivos", description: "Seguimiento para cuidar tu bienestar." },
      { name: "Atencion familiar", description: "Servicios para distintas etapas y necesidades." },
      { name: "Referencias y seguimiento", description: "Indicaciones claras para proximos pasos." },
    ],
    benefits: [
      { title: "Atencion humana", description: "Trato cercano y explicaciones claras." },
      { title: "Datos accesibles", description: "Telefono, ubicacion y contacto faciles de encontrar." },
      { title: "Enfoque preventivo", description: "Informacion orientada al cuidado continuo." },
    ],
    faqs: [
      { question: "Puedo agendar una cita?", answer: "Si, usa el telefono o formulario para solicitar disponibilidad." },
      { question: "Atienden urgencias?", answer: "Consulta directamente la disponibilidad antes de acudir." },
      { question: "El sitio reemplaza una consulta?", answer: "No, la informacion es general y debes consultar a un profesional." },
    ],
    imagePrompt: "modern medical clinic reception with friendly healthcare professional",
  },
  beauty: {
    headline: "Servicios de belleza para verte y sentirte mejor",
    intro:
      "Presenta tratamientos, agenda citas y muestra una imagen profesional que conecte con tus clientes.",
    about:
      "Cada servicio de belleza necesita confianza, estilo y detalle. Este sitio destaca tu propuesta, tus servicios y la forma mas facil de reservar.",
    services: [
      { name: "Corte y estilo", description: "Looks personalizados segun rostro, rutina y preferencia." },
      { name: "Color y tratamientos", description: "Opciones para renovar, cuidar y fortalecer el cabello." },
      { name: "Maquillaje", description: "Servicios para eventos, sesiones o dias especiales." },
      { name: "Cuidado personal", description: "Tratamientos pensados para bienestar y presentacion." },
    ],
    benefits: [
      { title: "Estilo personalizado", description: "Recomendaciones segun cada cliente." },
      { title: "Reserva sencilla", description: "Contacto directo para pedir disponibilidad." },
      { title: "Imagen cuidada", description: "Una presentacion visual alineada a tu marca." },
    ],
    faqs: [
      { question: "Necesito cita?", answer: "Recomendamos agendar para asegurar disponibilidad." },
      { question: "Puedo pedir asesoria?", answer: "Si, puedes consultar opciones antes del servicio." },
      { question: "Hacen servicios para eventos?", answer: "Puedes solicitar disponibilidad para fechas especiales." },
    ],
    imagePrompt: "modern beauty salon stylist working with a client in a bright studio",
  },
  fitness: {
    headline: "Entrena con enfoque, energia y resultados medibles",
    intro:
      "Muestra planes, horarios y beneficios para que nuevos miembros se animen a empezar.",
    about:
      "Un buen programa fitness necesita motivacion y estructura. Este sitio comunica tu metodo, servicios y formas de contacto para convertir visitas en registros.",
    services: [
      { name: "Entrenamiento personal", description: "Planes adaptados a objetivos, nivel y disponibilidad." },
      { name: "Clases grupales", description: "Sesiones dinamicas para entrenar con energia." },
      { name: "Planes de fuerza", description: "Rutinas para mejorar condicion y progreso." },
      { name: "Evaluacion inicial", description: "Punto de partida para medir avance." },
    ],
    benefits: [
      { title: "Objetivos claros", description: "Entrenamientos pensados para avanzar paso a paso." },
      { title: "Ambiente motivador", description: "Una experiencia que impulsa constancia." },
      { title: "Seguimiento", description: "Orientacion para mantener progreso." },
    ],
    faqs: [
      { question: "Puedo empezar siendo principiante?", answer: "Si, se ajusta el entrenamiento a tu nivel." },
      { question: "Hay clases grupales?", answer: "Puedes mostrar horarios y tipos de clase en el sitio." },
      { question: "Ofrecen evaluacion?", answer: "Si, puedes invitar a una evaluacion inicial desde el contacto." },
    ],
    imagePrompt: "modern fitness gym with trainer coaching a client during workout",
  },
  other: {
    headline: "Una presencia profesional para hacer crecer tu negocio",
    intro:
      "Presenta tus servicios, genera confianza y facilita que nuevos clientes te contacten.",
    about:
      "Creamos una estructura clara para explicar lo que haces, por que confiar en tu negocio y como dar el siguiente paso. El sitio queda listo para editar y adaptar a tu marca.",
    services: [
      { name: "Servicio principal", description: "La solucion mas importante que ofreces a tus clientes." },
      { name: "Servicio especializado", description: "Atencion enfocada en necesidades concretas." },
      { name: "Asesoria", description: "Orientacion clara antes de iniciar un proyecto." },
      { name: "Soporte continuo", description: "Acompanamiento despues del primer contacto." },
    ],
    benefits: [
      { title: "Claridad", description: "Tus clientes entienden rapido que ofreces." },
      { title: "Confianza", description: "Secciones pensadas para presentar experiencia y valor." },
      { title: "Contacto facil", description: "Llamadas, email y formulario visibles." },
    ],
    faqs: [
      { question: "Puedo editar el contenido?", answer: "Si, puedes ajustar textos, secciones y datos desde el editor." },
      { question: "Sirve para captar clientes?", answer: "Si, esta organizado para explicar servicios y generar contactos." },
      { question: "Puedo publicar varias paginas?", answer: "Si, la estructura se adapta al tipo de sitio elegido." },
    ],
    imagePrompt: "professional small business team working with a customer in a modern office",
  },
};

export function buildFallbackSiteBlueprint(input: OnboardingInput): Blueprint {
  const copy = INDUSTRY_COPY[input.businessType] ?? INDUSTRY_COPY.other;
  const businessType = resolveBusinessTypeLabel(input);
  const location = input.location?.trim() || "tu zona";
  const ctaText = ctaForGoal(input.goal);
  const goalLabel = GOAL_LABELS[input.goal] ?? input.goal;

  const sections: BlueprintSection[] = [
    section("hero", {
      title: input.businessName,
      subtitle: copy.headline,
      body: `${copy.intro} Servicio disponible en ${location}.`,
      ctaText,
      ctaLink: "#contact",
      imagePrompt: copy.imagePrompt,
    }),
    section("services", {
      title: "Servicios",
      subtitle: `Soluciones de ${businessType} pensadas para clientes que buscan calidad y respuesta clara.`,
      settings: { items: copy.services },
    }),
    section("benefits", {
      title: "Por que elegirnos",
      subtitle: "Trabajamos con procesos claros, comunicacion directa y enfoque en resultados.",
      settings: { items: copy.benefits },
    }),
    section("about", {
      title: `Sobre ${input.businessName}`,
      subtitle: "Servicio profesional con trato cercano",
      body: copy.about,
      imagePrompt: copy.imagePrompt,
    }),
    section("testimonials", {
      title: "Clientes satisfechos",
      subtitle: "La confianza se construye con buen servicio y seguimiento.",
      settings: {
        items: [
          {
            name: "Cliente local",
            role: "Cliente",
            quote: "Nos atendieron rapido, explicaron todo con claridad y el resultado fue excelente.",
          },
          {
            name: "Cliente frecuente",
            role: "Cliente",
            quote: "Muy profesionales y atentos. Los volveria a contactar sin dudarlo.",
          },
          {
            name: "Proyecto reciente",
            role: "Cliente",
            quote: "Cumplieron con lo acordado y mantuvieron buena comunicacion durante el proceso.",
          },
        ],
      },
    }),
    section("faq", {
      title: "Preguntas frecuentes",
      subtitle: "Respuestas rapidas antes de contactarnos.",
      settings: { items: copy.faqs },
    }),
    section("gallery", {
      title: "Galeria",
      subtitle: "Una muestra visual del estilo y calidad de nuestro trabajo.",
    }),
    section("location", {
      title: "Zona de servicio",
      body: `Atendemos en ${location} y areas cercanas. Contactanos para confirmar disponibilidad.`,
    }),
    section("cta", {
      title: "Listo para empezar?",
      subtitle: `Cuentanos que necesitas y te ayudamos con el siguiente paso.`,
      ctaText,
      ctaLink: "#contact",
      imagePrompt: copy.imagePrompt,
    }),
    section("contact", {
      title: "Contactanos",
      body: `Envia tus datos para recibir informacion sobre ${goalLabel.toLowerCase()}.`,
      ctaText: "Enviar solicitud",
    }),
    section("footer", {
      title: input.businessName,
      subtitle: `${businessType} en ${location}`,
    }),
  ];

  return {
    site: {
      businessName: input.businessName,
      businessType,
      language: input.language,
      goal: input.goal,
      tone: "Profesional, claro y orientado a conversion.",
      visualStyle: {
        name: input.visualStyle,
        colors: {
          primary: "#1d4ed8",
          secondary: "#0f172a",
          accent: "#f59e0b",
          background: "#ffffff",
          text: "#0f172a",
        },
        fontStyle: "",
        designNotes: "Contenido generado localmente como respaldo cuando el proveedor de IA no esta disponible.",
      },
      seo: {
        title: `${input.businessName} | ${businessType}`,
        metaDescription: `${input.businessName} ofrece ${businessType} en ${location}. Solicita informacion, cotizacion o agenda contacto.`,
        mainKeyword: businessType,
        secondaryKeywords: [input.businessName, location, goalLabel],
      },
      pages: [
        {
          slug: "/",
          title: input.businessName,
          description: copy.intro,
          sections,
        },
      ],
    },
  };
}

function ctaForGoal(goal: OnboardingInput["goal"]): string {
  switch (goal) {
    case "calls":
      return "Llamar ahora";
    case "quote_forms":
      return "Pedir cotizacion";
    case "show_services":
      return "Ver servicios";
    case "sell_products":
      return "Comprar ahora";
    case "book_appointments":
      return "Agendar cita";
    case "professional_presence":
      return "Contactar";
    default:
      return "Contactar";
  }
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
