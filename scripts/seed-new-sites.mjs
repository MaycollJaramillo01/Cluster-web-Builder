/**
 * 6 nuevos sitios para probar los estilos de bloque implementados.
 * Cubre: Editorial, Immersive, Manifesto, Minimal, BigType, Timeline.
 *
 * Run:  node scripts/seed-new-sites.mjs
 */

import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slug(value) {
  const base = value
    .toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "").slice(0, 42) || "sitio";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

function sec(type, order, title, content, settings = {}) {
  return { type, order, title, isVisible: true, content, settings };
}

const SITES = [

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1 — Alma Studio · Yoga & Bienestar, Medellin
  //     Editorial → faq:magazine, benefits:columns, process:numbered,
  //                 testimonials:quotes, gallery:masonry
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    businessName: "Alma Studio",
    businessType: "Yoga y bienestar",
    goal: "book_appointments",
    visualStyle: "Editorial",
    location: "Medellin, Colombia",
    phone: "+57 4 312-7780",
    email: "hola@almastudio.co",
    domain: "alma-studio",
    primaryColor: "#2d6a4f",
    secondaryColor: "#1b2e24",
    accentColor: "#95d5b2",
    sections: [
      sec("hero", 0, "Alma Studio", {
        subtitle: "Yoga, meditacion y bienestar integral en Medellin",
        body: "Un espacio creado para reconectar con tu cuerpo y tu mente. Clases para todos los niveles, retiros mensuales y terapias complementarias en el corazon de El Poblado.",
        ctaText: "Reservar clase",
        ctaLink: "#contact",
        imagePrompt: "serene yoga studio interior medellin colombia natural light wooden floors plants calm atmosphere",
      }),
      sec("gallery", 1, "Nuestros espacios", {
        subtitle: "Un entorno disenado para el bienestar",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "yoga studio space natural light wood floor plants colombia",
      }),
      sec("services", 2, "Nuestras clases", {
        subtitle: "Encuentra la practica que transforma tu dia",
        body: "",
        ctaText: "Ver horarios",
        ctaLink: "#contact",
        imagePrompt: "",
      }, {
        items: [
          { name: "Hatha Yoga", description: "Posturas clasicas con enfasis en alineacion y respiracion consciente. Ideal para principiantes y practicantes intermedios.", price: "COP 45,000" },
          { name: "Vinyasa Flow", description: "Secuencias dinamicas sincronizadas con la respiracion. Desarrolla fuerza, flexibilidad y concentracion.", price: "COP 50,000" },
          { name: "Yin Yoga", description: "Posturas mantenidas entre 3 y 7 minutos para trabajar tejido profundo y liberar tension acumulada.", price: "COP 45,000" },
          { name: "Meditacion guiada", description: "Sesiones de 45 minutos con tecnicas de mindfulness, visualizacion y respiracion pranayama.", price: "COP 35,000" },
          { name: "Retiro mensual", description: "Un dia completo de practica intensiva, comidas vegetarianas y talleres de bienestar. Incluye materiales.", price: "COP 280,000" },
        ],
      }),
      sec("process", 3, "Tu primer mes en Alma", {
        subtitle: "Tres pasos para una practica que dure",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { title: "Clase de bienvenida gratuita", description: "Tu primera clase es sin costo. Evaluamos tu nivel y te ubicamos en el grupo adecuado para que la experiencia sea buena desde el inicio." },
          { title: "Plan personalizado", description: "Segun tu objetivo — flexibilidad, manejo del estres, rehabilitacion o practica espiritual — disenamos un recorrido por las clases mas alineadas." },
          { title: "Seguimiento mensual", description: "Cada mes revisamos tu progreso con tu instructora asignada y ajustamos la practica para que el avance sea constante y visible." },
        ],
      }),
      sec("benefits", 4, "Por que Alma Studio", {
        subtitle: "Un espacio distinto para una practica real",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { title: "Grupos reducidos", description: "Maximo 12 personas por clase. Cada estudiante recibe atencion real de la instructora." },
          { title: "Instructoras certificadas", description: "Todos nuestros instructores tienen formacion internacional de 200 o 500 horas con escuelas reconocidas." },
          { title: "Espacio propio y exclusivo", description: "Estudio dedicado exclusivamente al yoga. Sin gimnasio compartido, sin distracciones." },
          { title: "Comunidad activa", description: "Grupos de practica, retiros y talleres que conectan a los estudiantes mas alla de las clases." },
          { title: "Acceso a grabaciones", description: "Todas las clases quedan grabadas para que puedas practicar desde casa cuando quieras." },
        ],
      }),
      sec("testimonials", 5, "Que dicen nuestros estudiantes", {
        subtitle: "Personas reales, cambios reales",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { name: "Carolina Mejia", role: "Practicante desde 2022", quote: "Llevo dos anos en Alma y es lo mejor que pude hacer por mi salud. El nivel de atencion de las instructoras no lo encontre en ningun otro estudio." },
          { name: "Felipe Torres", role: "Principiante", quote: "Llegue sin saber nada de yoga y en tres meses ya noto la diferencia en mi espalda y en como duermo. La clase de bienvenida gratuita fue clave para animarme." },
          { name: "Maria del Pilar", role: "Practica Yin Yoga", quote: "El Yin Yoga en Alma me cambio la relacion con mi cuerpo. La instructora Sara explica con una claridad y una calma que hacen la practica completamente diferente." },
          { name: "Andres Cano", role: "Asistente regular", quote: "El espacio esta disenado para que te concentres. Sin ruido, sin distracciones. Entras y ya sientes la diferencia de ambiente." },
        ],
      }),
      sec("faq", 6, "Preguntas frecuentes", {
        subtitle: "Todo lo que necesitas saber antes de tu primera clase",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { question: "No tengo experiencia en yoga, puedo unirme?", answer: "Si, absolutamente. Las clases de Hatha son ideales para empezar y la primera clase es gratis para que explores sin presion." },
          { question: "Necesito traer mi propia colchoneta?", answer: "No. El estudio tiene colchonetas, bloques, correas y mantas de alta calidad para todos los estudiantes. Solo necesitas ropa comoda." },
          { question: "Con cuanta anticipacion debo reservar?", answer: "Se recomienda reservar con 24 horas de anticipacion via WhatsApp o nuestro sistema en linea. Los cupos se liberan 2 horas antes de la clase si hay cancelaciones." },
          { question: "Tienen clases para embarazadas o adultos mayores?", answer: "Si. Tenemos sesiones especificas de yoga prenatal los miercoles a las 10:00 a.m. y clases adaptadas para adultos mayores los sabados a las 9:00 a.m." },
          { question: "Cuantas clases por semana recomienden para notar resultados?", answer: "Con dos a tres clases semanales la mayoria de estudiantes nota mejoras en flexibilidad y bienestar general en el primer mes." },
        ],
      }),
      sec("contact", 7, "Reserva tu clase", {
        subtitle: "Primera clase gratis, sin compromiso",
        body: "Cuéntanos en que turno te acomoda y te confirmamos disponibilidad el mismo dia.",
        ctaText: "Reservar ahora",
        ctaLink: "",
        imagePrompt: "",
      }),
      sec("footer", 8, "Alma Studio", {
        subtitle: "Yoga & Bienestar · El Poblado, Medellin",
        body: "Lunes a sabado 6:00–21:00 · Domingo 8:00–13:00 · +57 4 312-7780",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }),
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2 — Forja Digital · Agencia de marketing, Lima
  //     Immersive → faq:grid, benefits:grid, process:dark,
  //                 testimonials:wall, gallery:bento
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    businessName: "Forja Digital",
    businessType: "Agencia de marketing",
    goal: "get_clients",
    visualStyle: "Immersive",
    location: "Lima, Peru",
    phone: "+51 1 705-3388",
    email: "hola@forjadigital.pe",
    domain: "forja-digital",
    primaryColor: "#f97316",
    secondaryColor: "#0f172a",
    accentColor: "#fb923c",
    sections: [
      sec("hero", 0, "Forja Digital", {
        subtitle: "Agencia de marketing de resultados en Lima",
        body: "Creamos estrategias digitales que convierten trafico en clientes. SEO, pauta pagada, contenido y automatizacion para empresas que quieren crecer de verdad.",
        ctaText: "Hablar con un estratega",
        ctaLink: "#contact",
        imagePrompt: "modern marketing agency office lima peru dark interior screens showing analytics data dashboards orange accent lights",
      }),
      sec("gallery", 1, "Proyectos y resultados", {
        subtitle: "Casos reales de clientes que crecieron",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "marketing agency projects screens dashboards analytics results dark office",
      }),
      sec("services", 2, "Nuestros servicios", {
        subtitle: "Estrategia digital de extremo a extremo",
        body: "",
        ctaText: "Ver servicios",
        ctaLink: "#contact",
        imagePrompt: "",
      }, {
        items: [
          { name: "SEO y Posicionamiento", description: "Estrategia SEO tecnica y de contenido para aparecer en la primera pagina de Google en busquedas que convierten." },
          { name: "Google & Meta Ads", description: "Campanas de pauta pagada optimizadas para maximo ROI. Gestion mensual completa con reportes de resultados." },
          { name: "Marketing de Contenidos", description: "Contenido estrategico que posiciona tu marca como autoridad en tu industria y convierte lectores en clientes." },
          { name: "Email Marketing & CRM", description: "Automatizacion de correos, nurturing de leads y configuracion de CRM para que ningun prospecto se pierda." },
          { name: "Consultoria Estrategica", description: "Auditoria digital completa y hoja de ruta de 90 dias para negocios que quieren un plan solido antes de invertir." },
        ],
      }),
      sec("process", 3, "Como trabajamos", {
        subtitle: "Sin promesas vacias, con proceso documentado",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { title: "Auditoria inicial", description: "Analizamos tu situacion actual: SEO, pauta, contenido, competencia. Te entregamos un diagnostico sin costo antes de cualquier acuerdo." },
          { title: "Estrategia a 90 dias", description: "Un plan documentado con objetivos medibles, canales priorizados y presupuesto claro. Sin letra pequena." },
          { title: "Ejecucion y optimizacion", description: "Activacion semanal de acciones con reportes quincenales de metricas reales: trafico, leads, conversion." },
          { title: "Escalado de resultados", description: "Con datos del primer trimestre escalamos lo que funciona y eliminamos lo que no. Iteracion basada en evidencia." },
        ],
      }),
      sec("benefits", 4, "Por que Forja Digital", {
        subtitle: "Lo que nos separa de una agencia generica",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { title: "Equipo senior dedicado", description: "Tu cuenta es manejada por especialistas con 5+ anos de experiencia, no por practicantes." },
          { title: "Sin contratos anuales", description: "Trabajamos mes a mes. Si no ves resultados, no tienes ningun compromiso de continuar." },
          { title: "Reportes en tiempo real", description: "Dashboard propio con acceso 24/7 a tus metricas. Sabes exactamente en que se invierte cada sol." },
          { title: "Foco en conversion", description: "No medimos exito en likes o alcance. Medimos en leads, ventas e ingresos generados." },
        ],
      }),
      sec("testimonials", 5, "Resultados de clientes", {
        subtitle: "Empresas que ya crecieron con Forja",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { name: "Roberto Solis", role: "CEO, Inmobiliaria Horizon", quote: "En 4 meses Forja triplicó nuestros leads de Google Ads con el mismo presupuesto. El nivel de seguimiento y optimizacion no lo vimos en las dos agencias anteriores." },
          { name: "Patricia Llave", role: "Directora, Clinica Salud Total", quote: "El SEO local que implementaron nos puso en el top 3 de busquedas en Lima en 6 meses. Ahora el 40% de nuestros nuevos pacientes llegan por Google." },
          { name: "Gonzalo Meza", role: "Fundador, TechStart Peru", quote: "La consultoria estrategica fue una revelacion. Teniamos un problema de posicionamiento que no habiamos identificado. El plan de 90 dias fue ejecutado al pie de la letra." },
          { name: "Sofia Bernales", role: "Gerente, E-commerce Moderno", quote: "El email marketing automatizado incremento nuestras ventas recurrentes en 28% el primer trimestre. El ROI fue inmediato y medible." },
        ],
      }),
      sec("faq", 6, "Preguntas frecuentes", {
        subtitle: "Lo que mas nos preguntan antes de empezar",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { question: "Cuanto cuesta trabajar con Forja Digital?", answer: "Depende del servicio y alcance. Los paquetes de gestion mensual parten desde S/2,500/mes. La auditoria inicial es gratis y sin compromiso." },
          { question: "En cuanto tiempo veremos resultados?", answer: "SEO tarda entre 3 y 6 meses en mostrar resultados organicos. Pauta pagada puede generar leads desde la primera semana con la configuracion correcta." },
          { question: "Trabajan con empresas pequenas?", answer: "Si. Tenemos paquetes disenados para PYMEs y startups con presupuestos ajustados. El enfoque es crecer de forma escalable desde el inicio." },
          { question: "Cuanto presupuesto necesito para pauta pagada?", answer: "Recomendamos un minimo de S/3,000/mes en pauta para campanas que generen datos suficientes para optimizar correctamente." },
          { question: "Puedo ver los resultados en tiempo real?", answer: "Si. Todos los clientes tienen acceso a un dashboard propio con metricas actualizadas diariamente: impresiones, clics, leads y conversiones." },
        ],
      }),
      sec("contact", 7, "Habla con un estratega", {
        subtitle: "Auditoria digital gratis, sin compromiso",
        body: "Cuéntanos tu negocio y objetivo. Te respondemos en 24 horas con un diagnostico honesto de donde estas y donde puedes llegar.",
        ctaText: "Solicitar auditoria",
        ctaLink: "",
        imagePrompt: "",
      }),
      sec("footer", 8, "Forja Digital", {
        subtitle: "Agencia de marketing digital · Lima, Peru",
        body: "Lunes a viernes 9:00–18:00 · +51 1 705-3388 · hola@forjadigital.pe",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }),
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3 — Taller Bruto · Ebanisteria y diseno, Ciudad de Mexico
  //     Manifesto → faq:columns, benefits:brutal, process:numbered,
  //                 testimonials:wall, gallery:mosaic
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    businessName: "Taller Bruto",
    businessType: "Ebanisteria y diseno de interiores",
    goal: "get_clients",
    visualStyle: "Manifesto",
    location: "Ciudad de Mexico, Mexico",
    phone: "+52 55 6612-0034",
    email: "contacto@tallerbruto.mx",
    domain: "taller-bruto",
    primaryColor: "#1a1a1a",
    secondaryColor: "#0d0d0d",
    accentColor: "#d4a853",
    sections: [
      sec("hero", 0, "Taller Bruto", {
        subtitle: "Muebles a medida. Sin concesiones.",
        body: "Madera solida, diseno sin ornamentos, construido para durar decadas. Fabricamos muebles de autor para espacios que valoran lo genuino sobre lo decorativo.",
        ctaText: "Ver portafolio",
        ctaLink: "#gallery",
        imagePrompt: "industrial woodworking studio mexico city raw wood furniture handcrafted dark workshop natural materials",
      }),
      sec("gallery", 1, "Portafolio", {
        subtitle: "Piezas fabricadas. No decoracion de catalogo.",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "handcrafted solid wood furniture mexico brutalist minimal dark interior design",
      }),
      sec("services", 2, "Que fabricamos", {
        subtitle: "Cada pieza, unica",
        body: "",
        ctaText: "Solicitar presupuesto",
        ctaLink: "#contact",
        imagePrompt: "",
      }, {
        items: [
          { name: "Mesas de comedor", description: "Mesas en madera maciza de encino, mezquite o nogal. Dimensiones, acabado y detalle de uniones segun diseno especifico del cliente." },
          { name: "Libreros y estantes", description: "Sistemas de almacenamiento modulares o fijos. Acero y madera combinados cuando el espacio lo requiere." },
          { name: "Cocinas y alacenas", description: "Diseno y fabricacion de cocinas integrales con materiales nobles. Sin aglomerado, sin MDF, sin atajos." },
          { name: "Puertas y ventanas", description: "Carpinteria de madera solida para proyectos residenciales y comerciales donde el detalle constructivo importa." },
          { name: "Interiorismo completo", description: "Disenam y coordinamos todos los elementos de madera de un proyecto arquitectonico. Desde boceto hasta instalacion." },
        ],
      }),
      sec("process", 3, "El proceso de fabricacion", {
        subtitle: "Transparente. Sin sorpresas.",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { title: "Visita y medicion", description: "Vamos al espacio, tomamos medidas exactas y entendemos el uso real de la pieza. No trabajamos con medidas aproximadas." },
          { title: "Diseno y cotizacion", description: "Planos tecnicos en 2D, visualizacion del material y cotizacion detallada. Sin letra pequena ni costos ocultos." },
          { title: "Fabricacion en taller", description: "Todo se construye en nuestro taller en CDMX. Madera seca en camara, ensambles de carpintero, no de prensa." },
          { title: "Entrega e instalacion", description: "Transportamos e instalamos cada pieza. No dejamos cajas en la puerta. El trabajo termina cuando el mueble esta en su lugar." },
        ],
      }),
      sec("benefits", 4, "Por que Taller Bruto", {
        subtitle: "Sin eufemismos",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { title: "Madera maciza real", description: "Sin tableros de particulas ni madera reconstituida. Si dice encino, es encino." },
          { title: "Garantia de 10 anos", description: "Piezas estructurales garantizadas por una decada. Si algo falla, lo reparamos." },
          { title: "Diseno exclusivo", description: "No vendemos modelos de catalogo. Cada pieza se diseña desde cero para el espacio especifico." },
          { title: "Fabricacion local", description: "Hecho en Mexico por carpinteros mexicanos con materiales de procedencia conocida." },
          { title: "Precio justo documentado", description: "Sabes exactamente que pagas y por que. Sin margenes ocultos ni inflacion de presupuesto." },
        ],
      }),
      sec("testimonials", 5, "Clientes que confian en el oficio", {
        subtitle: "",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { name: "Eduardo Rios", role: "Arquitecto", quote: "Taller Bruto es el unico fabricante con quien trabajo en proyectos donde el detalle constructivo es parte del diseno. Sin ellos varios proyectos no habrian sido posibles." },
          { name: "Valentina Cruz", role: "Cliente residencial", quote: "La mesa que fabricaron lleva 4 anos en uso diario con tres ninos. No tiene un rayón que importe. La construccion es excepcional." },
          { name: "Marco Flores", role: "Restaurante La Morada", quote: "Todo el mobiliario del restaurante es de Taller Bruto. Cada semana algun comensal nos pregunta donde compramos las mesas. El trabajo habla solo." },
          { name: "Daniela Vega", role: "Interiorista", quote: "El proceso es tan claro y honesto que ahora los incluyo en cada propuesta de proyecto. Nunca hubo una sorpresa de precio ni de plazo." },
        ],
      }),
      sec("faq", 6, "Preguntas directas", {
        subtitle: "",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { question: "Cuanto cuesta un mueble a medida?", answer: "Una mesa de comedor en madera maciza parte desde MXN 28,000. El precio final depende de dimensiones, especie de madera y complejidad de diseno. Cotizamos sin costo." },
          { question: "Cuanto tiempo tarda la fabricacion?", answer: "Entre 6 y 10 semanas segun el proyecto. No aceleramos el proceso. Una pieza bien hecha tarda lo que tiene que tardar." },
          { question: "Hacen envios fuera de CDMX?", answer: "Si, con empresa especializada en transporte de muebles. Hemos entregado en Guadalajara, Monterrey y Cancun. El costo de flete se cotiza aparte." },
          { question: "Puedo elegir el tipo de madera?", answer: "Si. Trabajamos con encino, mezquite, nogal, cedro y tzalam principalmente. Te mostramos muestras fisicas antes de confirmar." },
        ],
      }),
      sec("contact", 7, "Cotiza tu proyecto", {
        subtitle: "Cuéntanos que tienes en mente",
        body: "Envianos las medidas aproximadas, el espacio y lo que necesitas. Te respondemos en 48 horas con una propuesta inicial.",
        ctaText: "Enviar solicitud",
        ctaLink: "",
        imagePrompt: "",
      }),
      sec("footer", 8, "Taller Bruto", {
        subtitle: "Ebanisteria y diseno · Ciudad de Mexico",
        body: "Lunes a viernes 9:00–18:00 · +52 55 6612-0034 · contacto@tallerbruto.mx",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }),
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4 — Clinica Vidal · Odontologia, Santiago de Chile
  //     Minimal → faq:minimal, benefits:numbered, process:numbered,
  //               testimonials:minimal, gallery:filmstrip
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    businessName: "Clinica Vidal",
    businessType: "Clinica dental",
    goal: "book_appointments",
    visualStyle: "Minimal",
    location: "Santiago, Chile",
    phone: "+56 2 2245-9100",
    email: "citas@clinicavidal.cl",
    domain: "clinica-vidal",
    primaryColor: "#0f4c75",
    secondaryColor: "#0a2e4a",
    accentColor: "#3498db",
    sections: [
      sec("hero", 0, "Clinica Vidal", {
        subtitle: "Odontologia de precision en Santiago",
        body: "Tratamientos dentales con tecnologia de ultima generacion y protocolos de atencion centrados en el paciente. Mas de 15 anos transformando sonrisas en Las Condes.",
        ctaText: "Agendar consulta",
        ctaLink: "#contact",
        imagePrompt: "modern dental clinic interior santiago chile clean white minimal design equipment professional",
      }),
      sec("gallery", 1, "Nuestras instalaciones", {
        subtitle: "Tecnologia pensada para el paciente",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "modern dental clinic chile clean white minimal reception treatment room",
      }),
      sec("services", 2, "Tratamientos", {
        subtitle: "Desde prevencion hasta estetica avanzada",
        body: "",
        ctaText: "Ver tratamientos",
        ctaLink: "#contact",
        imagePrompt: "",
      }, {
        items: [
          { name: "Implantes dentales", description: "Implantes de titanio de marca Straumann o Nobel Biocare. Protocolo completo desde la planificacion digital hasta la corona definitiva.", price: "CLP 950,000" },
          { name: "Ortodoncia invisible", description: "Alineadores Invisalign o sistema propio de alineadores claros. Seguimiento mensual con escaneo 3D.", price: "Desde CLP 1,200,000" },
          { name: "Blanqueamiento dental", description: "Blanqueamiento en consulta con lampara LED profesional. Resultados visibles en una sesion de 90 minutos.", price: "CLP 180,000" },
          { name: "Carillas de porcelana", description: "Carillas ultra-delgadas que transforman la forma y color de los dientes sin dano estructural. Disenadas digitalmente.", price: "CLP 380,000 c/u" },
          { name: "Limpieza y prevencion", description: "Profilaxis profesional, detartraje ultrasonica y pulido. Incluye evaluacion radiografica y plan preventivo.", price: "CLP 45,000" },
        ],
      }),
      sec("process", 3, "Como es tu primera visita", {
        subtitle: "Un proceso claro, sin sorpresas",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { title: "Evaluacion completa", description: "Radiografia panoramica, fotografia intraoral y evaluacion clinica. Diagnostico completo en la primera visita." },
          { title: "Plan de tratamiento", description: "Presentamos todas las opciones con sus costos, tiempos y resultados esperados. Tu decides con informacion completa." },
          { title: "Ejecucion del tratamiento", description: "Cada procedimiento se realiza con protocolo de asepsia estricto y anestesia local para maxima comodidad." },
          { title: "Seguimiento y prevencion", description: "Controles regulares segun el tratamiento. Plan de higiene personalizado para mantener los resultados a largo plazo." },
        ],
      }),
      sec("benefits", 4, "La diferencia Clinica Vidal", {
        subtitle: "",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { title: "Tecnologia digital completa", description: "Escaner intraoral, planificacion 3D y impresion en clinica para resultados predecibles y precisos." },
          { title: "Atencion sin listas de espera", description: "Sistema de citas en linea con disponibilidad real. Confirmacion inmediata, recordatorio automatico." },
          { title: "15 anos de historia", description: "Mas de 4,200 pacientes atendidos desde 2008. Testimonio de confianza acumulado en Las Condes." },
          { title: "Opciones de financiamiento", description: "Convenios con Fonasa e Isapres. Planes de pago en cuotas sin interes para tratamientos mayores." },
        ],
      }),
      sec("testimonials", 5, "Pacientes que confiaron en nosotros", {
        subtitle: "",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { name: "Javiera Morales", role: "Tratamiento con implante", quote: "Tenia mucho miedo al procedimiento pero el Dr. Vidal y su equipo lo hicieron completamente manejable. El resultado fue exactamente lo que esperaba." },
          { name: "Carlos Saavedra", role: "Ortodoncia invisible", quote: "Ocho meses con los alineadores y el cambio fue increible. Lo mejor es que casi nadie se daba cuenta de que usaba aparatos." },
          { name: "Patricia Henriquez", role: "Carillas de porcelana", quote: "Las carillas transformaron como me siento cuando sonrio. El diseno digital antes del procedimiento me dio total confianza en el resultado final." },
          { name: "Felipe Jimenez", role: "Paciente regular", quote: "Llevo 6 anos yendo a Clinica Vidal para mis limpiezas y controles. Nunca he tenido que esperar y siempre la atencion es impecable." },
        ],
      }),
      sec("faq", 6, "Preguntas frecuentes", {
        subtitle: "",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { question: "Tienen convenio con mi isapre?", answer: "Trabajamos con todas las isapres principales y Fonasa. El porcentaje de cobertura depende de tu plan. Verificamos tu beneficio el dia de la consulta." },
          { question: "Se puede hacer todo en una sola visita?", answer: "La primera visita incluye evaluacion y diagnostico completo. Los tratamientos se planifican en sesiones separadas segun el procedimiento." },
          { question: "Los implantes duelen?", answer: "El procedimiento se realiza con anestesia local. La molestia post operatoria es similar a una extraccion y se maneja bien con analgesicos estandar." },
          { question: "Pueden atender a ninos?", answer: "Si. Tenemos protocolo de atencion pediatrica para pacientes desde los 3 anos. El entorno esta disenado para que la experiencia sea tranquila." },
        ],
      }),
      sec("contact", 7, "Agenda tu consulta", {
        subtitle: "Primera evaluacion sin costo",
        body: "Reserva tu hora en linea o llamanos directamente. Confirmacion inmediata y recordatorio el dia anterior.",
        ctaText: "Reservar hora",
        ctaLink: "",
        imagePrompt: "",
      }),
      sec("footer", 8, "Clinica Vidal", {
        subtitle: "Odontologia · Las Condes, Santiago de Chile",
        body: "Lunes a viernes 9:00–19:00 · Sabados 9:00–14:00 · +56 2 2245-9100",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }),
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5 — Volta Cafe · Cafeteria de especialidad, Buenos Aires
  //     BigType → faq:grid, benefits:cards, process:dark,
  //               testimonials:quotes, gallery:editorial
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    businessName: "Volta Cafe",
    businessType: "Cafeteria de especialidad",
    goal: "generate_traffic",
    visualStyle: "BigType",
    location: "Buenos Aires, Argentina",
    phone: "+54 11 4523-7741",
    email: "hola@voltacafe.ar",
    domain: "volta-cafe",
    primaryColor: "#7c3aed",
    secondaryColor: "#1e1b4b",
    accentColor: "#a78bfa",
    sections: [
      sec("hero", 0, "Volta Cafe", {
        subtitle: "Cafe de especialidad en Palermo, Buenos Aires",
        body: "Granos de origen unico, tostado propio y metodos de extraccion de precision. El lugar donde el cafe deja de ser una costumbre y se convierte en una experiencia.",
        ctaText: "Ver nuestra carta",
        ctaLink: "#services",
        imagePrompt: "specialty coffee shop buenos aires argentina palermo purple interior minimal modern barista espresso",
      }),
      sec("gallery", 1, "El espacio", {
        subtitle: "Disenado para quienes toman el cafe en serio",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "specialty coffee shop interior buenos aires modern minimal purple tones barista station",
      }),
      sec("services", 2, "Nuestra carta", {
        subtitle: "Granos de origen, metodos de precision",
        body: "",
        ctaText: "Ver carta completa",
        ctaLink: "#contact",
        imagePrompt: "",
      }, {
        items: [
          { name: "Espresso de origen", description: "Single origin tostado en casa. Rotamos los granos cada temporada segun cosecha. Pregunta que tenemos hoy.", price: "ARS 2,800" },
          { name: "Cortado y Flat White", description: "Espresso con leche texturizada en temperatura y micro-espuma precisas. La relacion correcta entre grano y lacteo.", price: "ARS 3,200" },
          { name: "Filter V60 / Chemex", description: "Cafe filtrado con ratio exacto de agua y grano. Para quienes quieren extraer todo el potencial aromatico del origen.", price: "ARS 3,800" },
          { name: "Cold Brew 24h", description: "Extraccion en frio durante 24 horas. Cuerpo intenso, acidez suave, sin amargura. Disponible de jueves a domingo.", price: "ARS 4,200" },
          { name: "Tostado propio 250g", description: "Bolsas de 250g de granos de origen tostados en nuestra maquina San Franciscan. Disponibles para llevar.", price: "ARS 9,500" },
        ],
      }),
      sec("process", 3, "Nuestra filosofia", {
        subtitle: "Tres principios que no negociamos",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { title: "Origen trazable", description: "Sabemos el nombre del productor, la finca, la altitud y el proceso de cada grano que servimos. No compramos cafe anonimo." },
          { title: "Tostado propio", description: "Tostamos en casa dos veces por semana para garantizar frescura maxima. El cafe tiene fecha de tostado en cada bolsa." },
          { title: "Extraccion con protocolo", description: "Cada metodo tiene su receta documentada: ratio, temperatura, tiempo y tecnica. La consistencia es parte del producto." },
          { title: "Formacion continua", description: "Nuestros baristas se certifican con Q Graders y participan en competencias nacionales. El conocimiento se refleja en la taza." },
        ],
      }),
      sec("benefits", 4, "Por que Volta", {
        subtitle: "",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { title: "Tostado fresco cada semana", description: "Nunca sirves cafe rancio. El gramo es comprado, tostado y servido en el ciclo mas corto posible." },
          { title: "Baristas certificados", description: "Todo el equipo tiene certificacion SCA nivel introductorio o superior. No son hobbyistas, son profesionales." },
          { title: "Metodos alternativos disponibles", description: "V60, Chemex, Aeropress, Moka y Sifon. Cada uno preparado con la tecnica adecuada, no a las corridas." },
          { title: "Espacio para trabajar", description: "WiFi rapido, mesas amplias, enchufes en cada puesto y ambiente silencioso en el piso superior." },
        ],
      }),
      sec("testimonials", 5, "La comunidad Volta", {
        subtitle: "",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { name: "Mariana Soto", role: "Habitual", quote: "El V60 de Volta es el mejor cafe que tome en Buenos Aires. La atencion con la que preparan cada taza es visible desde el primer sorbo." },
          { name: "Tomas Herrera", role: "Diseñador, trabaja desde Volta", quote: "Vengo a trabajar aqui tres veces por semana. El ambiente es silencioso, el WiFi excelente y el cafe es lo que me hace volver y no otro lugar." },
          { name: "Lucia Fernandez", role: "Entusiasta del cafe", quote: "Nunca habia entendido realmente la diferencia entre origenes hasta que el barista de Volta me explico lo que estaba probando. Fue una mini clase magistral." },
          { name: "Sebastian Ruiz", role: "Barista, visita otros cafes", quote: "El nivel de consistencia de sus espressos es destacable. Vine seis veces en un mes y siempre la extraccion fue correcta. Eso en cafes de especialidad no es comun." },
        ],
      }),
      sec("faq", 6, "Lo que nos preguntan", {
        subtitle: "",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { question: "Tienen opciones sin lacteos?", answer: "Si. Leche de avena, almendra y soja disponibles para cualquier preparacion con leche. Mismo precio que la leche regular." },
          { question: "Venden granos para preparar en casa?", answer: "Si. Bolsas de 250g de nuestro tostado propio disponibles en mostrador y para delivery. Podemos molerte el grano al punto exacto para tu metodo." },
          { question: "Tienen espacio para grupos?", answer: "El piso superior puede reservarse para grupos de hasta 15 personas. Disponible de lunes a viernes con reserva previa." },
          { question: "Hacen talleres o cursos?", answer: "Si. Taller de introduccion al espresso y al V60 el primer sabado de cada mes. Cupos de 8 personas. Inscripcion por Instagram." },
        ],
      }),
      sec("contact", 7, "Encontranos en Palermo", {
        subtitle: "Thames 1847, Palermo, Buenos Aires",
        body: "Lunes a viernes 8:00–20:00, sabados y domingos 9:00–18:00. Sin reservas, por orden de llegada.",
        ctaText: "Como llegar",
        ctaLink: "",
        imagePrompt: "",
      }),
      sec("footer", 8, "Volta Cafe", {
        subtitle: "Cafe de especialidad · Palermo, Buenos Aires",
        body: "Thames 1847 · hola@voltacafe.ar · @voltacafe",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }),
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6 — Archivo 55 · Estudio de arquitectura, Bogota
  //     Timeline → faq:accordion, benefits:numbered, process:vertical,
  //                testimonials:cards, gallery:masonry
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    businessName: "Archivo 55",
    businessType: "Estudio de arquitectura",
    goal: "professional_presence",
    visualStyle: "Timeline",
    location: "Bogota, Colombia",
    phone: "+57 1 321-4400",
    email: "proyectos@archivo55.co",
    domain: "archivo-55",
    primaryColor: "#374151",
    secondaryColor: "#111827",
    accentColor: "#9ca3af",
    sections: [
      sec("hero", 0, "Archivo 55", {
        subtitle: "Estudio de arquitectura y diseno en Bogota",
        body: "Proyectos residenciales y comerciales que equilibran funcion, permanencia y caracter. Fundado en 2009, con mas de 55 proyectos construidos en Colombia.",
        ctaText: "Ver proyectos",
        ctaLink: "#gallery",
        imagePrompt: "modern architecture studio bogota colombia minimal interior concrete wood clean lines professional design",
      }),
      sec("gallery", 1, "Proyectos", {
        subtitle: "55 obras. Cada una, una solucion distinta.",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "modern architecture residential commercial colombia minimal concrete wood interior exterior",
      }),
      sec("services", 2, "Servicios", {
        subtitle: "Desde el boceto hasta la entrega de llaves",
        body: "",
        ctaText: "Consultar proyecto",
        ctaLink: "#contact",
        imagePrompt: "",
      }, {
        items: [
          { name: "Arquitectura residencial", description: "Casas y apartamentos de nueva construccion o reforma integral. Disenamos el espacio segun el modo de vida especifico del cliente." },
          { name: "Arquitectura comercial", description: "Oficinas, locales y espacios de trabajo que optimizan la experiencia del usuario y la identidad de marca del negocio." },
          { name: "Interiorismo", description: "Diseno de interiores para proyectos propios y de terceros. Materiales, mobiliario, iluminacion y detalle constructivo." },
          { name: "Consultoria tecnica", description: "Revision de proyectos en etapa de diseno, licencias y supervision de obra para clientes con arquitecto propio." },
          { name: "Render y visualizacion", description: "Visualizaciones arquitectonicas de alta fidelidad para preventa o validacion de diseno antes de la ejecucion." },
        ],
      }),
      sec("process", 3, "Proceso de trabajo", {
        subtitle: "Seis etapas documentadas para cada proyecto",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { title: "Briefing y diagnostico", description: "Primera reunion para entender el programa, el presupuesto y el plazo. Si ya existe una construccion, inspeccion tecnica incluida." },
          { title: "Anteproyecto", description: "Bocetos, plantas conceptuales y volumetrias. Presentamos dos opciones de diseno para discutir la direccion del proyecto." },
          { title: "Proyecto definitivo", description: "Planos tecnicos completos, memorias de materiales y especificaciones para licitacion o tramite de licencia." },
          { title: "Tramite de licencia", description: "Gestionamos el tramite de licencia de construccion ante la curaduría urbana. Conocemos el proceso en profundidad." },
          { title: "Supervisión de obra", description: "Visitas de supervision semanales, resolucion de consultas del contratista y control de calidad de materiales y acabados." },
          { title: "Entrega y postobra", description: "Protocolo de entrega con listado de puntos a resolver, manuales de mantenimiento y acompanamiento durante los primeros 30 dias." },
        ],
      }),
      sec("benefits", 4, "Por que Archivo 55", {
        subtitle: "",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { title: "55 proyectos construidos", description: "No somos un estudio de renders. Tenemos historia de obra ejecutada y terminada en Colombia." },
          { title: "Direccion por los socios", description: "Los dos socios fundadores participan activamente en cada proyecto desde el primer boceto." },
          { title: "Transparencia de costos", description: "Honorarios claros desde el inicio. Estructura de etapas que puedes pausar segun tu presupuesto." },
          { title: "Red de contratistas probados", description: "Podemos recomendar y coordinar contratistas con quienes tenemos historial de trabajo de calidad verificado." },
        ],
      }),
      sec("testimonials", 5, "Clientes que construyeron con nosotros", {
        subtitle: "",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { name: "Camila Ospina", role: "Casa Usaquen", quote: "El proceso fue exactamente lo que prometieron: claro, documentado y sin sorpresas. La casa supero lo que imaginabamos al inicio del proyecto." },
          { name: "Juan David Perez", role: "Oficinas Zona Rosa", quote: "La capacidad de Archivo 55 para entender como usamos el espacio se refleja en cada decision del diseno. El equipo trabaja mejor desde que se mudaron." },
          { name: "Monica Castillo", role: "Reforma integral", quote: "Teniamos un apartamento antiguo con mucho potencial pero sin saber como aprovecharlo. Archivo 55 vio exactamente lo que necesitaba para transformarse." },
          { name: "Hernan Molina", role: "Local comercial", quote: "Desde el primer boceto entendieron la identidad de la marca. El espacio atrajo comentarios de clientes desde el primer dia de apertura." },
        ],
      }),
      sec("faq", 6, "Preguntas frecuentes", {
        subtitle: "",
        body: "",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }, {
        items: [
          { question: "Cuanto cobran sus honorarios?", answer: "Los honorarios de diseno son un porcentaje del valor de construccion, segun tabla de la Sociedad Colombiana de Arquitectos. Te damos el numero exacto en la primera reunion." },
          { question: "Podemos contratar solo la supervision de obra?", answer: "Si. Si ya tienes el diseno y el contratista, ofrecemos el servicio de supervision tecnica independiente para garantizar la calidad de ejecucion." },
          { question: "Trabajan fuera de Bogota?", answer: "Si, hemos desarrollado proyectos en Cartagena, Medellin y eje cafetero. Los proyectos fuera de Bogota tienen un costo adicional de desplazamiento." },
          { question: "Cuanto tarda un proyecto residencial completo?", answer: "El diseno toma entre 2 y 4 meses segun la complejidad. La construccion, de 8 a 18 meses segun el tamano del proyecto y el contratista elegido." },
        ],
      }),
      sec("contact", 7, "Habla con el estudio", {
        subtitle: "Consulta inicial sin costo",
        body: "Cuéntanos tu proyecto. Nos reunimos, evaluamos y te decimos honestamente si podemos aportarle algo real.",
        ctaText: "Escribir al estudio",
        ctaLink: "",
        imagePrompt: "",
      }),
      sec("footer", 8, "Archivo 55", {
        subtitle: "Estudio de arquitectura · Bogota, Colombia",
        body: "Lunes a viernes 9:00–18:00 · +57 1 321-4400 · proyectos@archivo55.co",
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
      }),
    ],
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const targetEmail = process.env.SEED_USER_EMAIL || "info@cluster.marketing";
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: targetEmail }, { username: "admin" }] },
    select: { id: true, email: true },
  });

  const created = [];

  for (const def of SITES) {
    const publicSlug = slug(def.domain || def.businessName);

    await prisma.site.create({
      data: {
        userId: user?.id ?? null,
        businessName: def.businessName,
        businessType: def.businessType,
        goal: def.goal,
        visualStyle: def.visualStyle,
        location: def.location,
        phone: def.phone ?? null,
        email: def.email,
        domain: def.domain,
        publicSlug,
        language: "es",
        status: "PUBLISHED",
        publishedAt: new Date(),
        primaryColor: def.primaryColor,
        secondaryColor: def.secondaryColor,
        accentColor: def.accentColor,
        blueprintJson: {},
        sections: {
          create: def.sections.map((s) => ({
            type: s.type,
            title: s.title,
            order: s.order,
            isVisible: s.isVisible,
            content: s.content,
            settingsJson: s.settings,
          })),
        },
      },
      include: { sections: { select: { type: true } } },
    });

    created.push({ publicSlug, businessName: def.businessName, visualStyle: def.visualStyle });

    console.log(`  ${def.businessName.padEnd(24)} [${def.visualStyle.padEnd(10)}]  /s/${publicSlug}`);
  }

  console.log("\n" + "━".repeat(70));
  console.log("  6 sitios creados:\n");
  for (const s of created) {
    console.log(`  http://localhost:3000/s/${s.publicSlug}`);
  }
  console.log("━".repeat(70) + "\n");
}

main()
  .catch((e) => { console.error("Error:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
