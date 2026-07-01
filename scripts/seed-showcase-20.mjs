/**
 * 20 sitios de muestra, uno por cada composicion nueva del catalogo:
 * Folio, Journal, Atelier, Noir, Velocity, Pulse, Horizon, Market, Showcase,
 * Boutique, Stack, Corner, Neighbor, Homestead, Storefront, Ledger, Blank,
 * Serif, Mono y Blueprint.
 *
 * Cada sitio sigue el sectionPlan real de su preset y usa su paleta oficial,
 * para que la composicion se vea tal como fue disenada.
 *
 * Run:  node --env-file=.env --import tsx scripts/seed-showcase-20.mjs
 */

import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { getDesignPreset, getPalette } from "../lib/site/design.ts";

const prisma = new PrismaClient();

function slug(value) {
  const base = value
    .toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "").slice(0, 42) || "sitio";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

/** Negocios de muestra. Las secciones se arman desde el sectionPlan del preset. */
const SITES = [
  {
    style: "Folio",
    businessName: "Estudio Lumen",
    businessType: "Fotografia editorial",
    goal: "professional_presence",
    location: "Bogota, Colombia",
    phone: "+57 1 745-2210",
    email: "estudio@lumen.co",
    imageTheme: "editorial photography studio portrait natural light bogota",
    tagline: "Fotografia editorial y de retrato con mirada de autor",
    heroBody: "Quince anos documentando personas, marcas y espacios para publicaciones y clientes que valoran la imagen bien hecha. Cada encargo se trabaja como una pieza de portafolio.",
    heroCta: "Ver disponibilidad",
    about: { subtitle: "Detras del lente", body: "Lumen nacio en 2011 como un estudio de dos personas y hoy es un equipo de cinco fotografos y una productora. Trabajamos despacio, con pocas sesiones al mes, porque cada proyecto merece preproduccion real: scouting, direccion de arte y edicion propia." },
    services: [
      { name: "Retrato editorial", description: "Sesion de dos horas en estudio o locacion, con direccion de pose y seleccion conjunta de tomas finales.", price: "COP 850,000" },
      { name: "Fotografia de marca", description: "Banco de imagenes trimestral para marcas: producto, equipo y proceso, listo para web y prensa.", price: "Desde COP 2,400,000" },
      { name: "Cobertura de espacios", description: "Arquitectura e interiores con luz natural, entregada en formatos editoriales y de portafolio.", price: "COP 1,200,000" },
      { name: "Edicion y retoque fino", description: "Tratamiento de archivo por imagen para campanas que exigen acabado de revista.", price: "COP 90,000 por imagen" },
    ],
    benefits: [
      { title: "Direccion de arte incluida", description: "Cada sesion llega con moodboard y paleta aprobados antes de disparar la primera foto." },
      { title: "Entrega editorial", description: "Archivos calibrados para impresion y pantalla, con guia de uso tipografico y de recorte." },
      { title: "Pocas sesiones al mes", description: "Agenda limitada a ocho proyectos mensuales para sostener el nivel de detalle." },
      { title: "Archivo protegido", description: "Respaldo de negativos digitales por cinco anos, recuperables en cualquier momento." },
    ],
    faq: [
      { question: "Trabajan fuera de Bogota?", answer: "Si. Los viajes dentro de Colombia suman viaticos al presupuesto y se cotizan junto con la sesion." },
      { question: "Cuanto tarda la entrega?", answer: "Retratos en siete dias habiles; proyectos de marca en quince, con adelanto de tres imagenes a las 48 horas." },
      { question: "Puedo usar las fotos en publicidad?", answer: "La licencia editorial esta incluida; el uso publicitario se licencia por campana y se cotiza aparte." },
    ],
    contact: { title: "Agenda tu sesion", subtitle: "Respuesta en menos de un dia habil", body: "Cuentanos que necesitas fotografiar, para cuando y en que formato lo vas a usar." },
    hours: "Lunes a viernes 9:00-18:00",
  },
  {
    style: "Journal",
    businessName: "Casa Palabra",
    businessType: "Taller literario",
    goal: "book_appointments",
    location: "Ciudad de Mexico",
    phone: "+52 55 4172-8830",
    email: "hola@casapalabra.mx",
    imageTheme: "cozy writing workshop books desk warm light mexico city",
    tagline: "Talleres de escritura y acompanamiento editorial",
    heroBody: "Un espacio pequeno en la Roma Norte donde se escribe en serio: talleres de narrativa, clinicas de manuscrito y acompanamiento uno a uno para terminar el libro que llevas anos posponiendo.",
    heroCta: "Reservar lugar",
    about: { subtitle: "Nuestra historia", body: "Casa Palabra la fundo la editora Julieta Arce en 2019, despues de una decada en editoriales grandes. La premisa es simple: grupos de maximo ocho personas, lectura cercana y devoluciones honestas. Por aqui han pasado mas de trescientos manuscritos." },
    services: [
      { name: "Taller de narrativa", description: "Doce sesiones semanales de tres horas. Se lee el trabajo de todos, se discute y se reescribe.", price: "MXN 4,800" },
      { name: "Clinica de manuscrito", description: "Lectura profesional de tu novela o libro de cuentos con informe de veinte paginas y sesion de devolucion.", price: "MXN 9,500" },
      { name: "Acompanamiento uno a uno", description: "Seis meses de trabajo editorial personalizado para terminar un primer borrador completo.", price: "MXN 3,200 mensuales" },
      { name: "Curso de cronica", description: "Ocho sesiones sobre escritura de no ficcion con ejercicios en la calle y edicion en vivo.", price: "MXN 3,600" },
    ],
    benefits: [
      { title: "Grupos de ocho", description: "Nadie se queda sin leer ni sin devolucion en cada sesion." },
      { title: "Editores en activo", description: "Los talleristas trabajan o trabajaron en editoriales y revistas reconocidas." },
      { title: "Biblioteca abierta", description: "Los alumnos pueden usar la biblioteca y el estudio de la casa entre semana." },
      { title: "Red de publicacion", description: "Los mejores manuscritos se presentan a editoriales aliadas dos veces al ano." },
    ],
    faq: [
      { question: "Necesito experiencia previa?", answer: "Para el taller de narrativa no. La clinica de manuscrito si requiere una obra terminada o muy avanzada." },
      { question: "Hay modalidad en linea?", answer: "El acompanamiento uno a uno puede ser remoto. Los talleres grupales son presenciales." },
      { question: "Puedo recuperar sesiones?", answer: "Hasta dos sesiones por ciclo se pueden recuperar en el grupo paralelo de la semana." },
    ],
    contact: { title: "Escribenos", subtitle: "Los cupos se abren cada trimestre", body: "Dinos en que proyecto estas trabajando y que taller te interesa; te contamos si hay lugar o te anotamos en lista." },
    hours: "Martes a sabado 10:00-19:00",
  },
  {
    style: "Atelier",
    businessName: "Atelier Norte",
    businessType: "Diseno de interiores",
    goal: "quote_forms",
    location: "Monterrey, Mexico",
    phone: "+52 81 2314-7760",
    email: "proyectos@ateliernorte.mx",
    imageTheme: "interior design studio modern furniture material samples monterrey",
    tagline: "Interiores residenciales y comerciales con oficio",
    heroBody: "Disenamos espacios que se usan todos los dias: casas, consultorios y locales donde el material, la luz y el presupuesto se deciden con la misma seriedad.",
    heroCta: "Cotizar proyecto",
    about: { subtitle: "El estudio", body: "Somos un equipo de seis disenadores e interioristas fundado en 2016. Trabajamos con carpinteros, herreros y canteros de la region, y documentamos cada obra terminada como parte de nuestro archivo publico." },
    services: [
      { name: "Proyecto residencial completo", description: "Del levantamiento al estilismo final: planos, mobiliario, iluminacion y supervision de obra.", price: "Desde MXN 180,000" },
      { name: "Interiorismo comercial", description: "Locales, consultorios y oficinas disenados para operar bien y fotografiar mejor.", price: "Cotizacion por m2" },
      { name: "Consultoria por espacio", description: "Sesion de tres horas en sitio con propuesta de distribucion, paleta y lista de compras.", price: "MXN 8,500" },
      { name: "Mobiliario a medida", description: "Piezas unicas de carpinteria y herreria disenadas y fabricadas con talleres locales.", price: "Segun pieza" },
    ],
    faq: [
      { question: "Trabajan con obra ya iniciada?", answer: "Si, nos integramos con tu constructor. Pedimos planos actualizados y una visita tecnica antes de cotizar." },
      { question: "Cuanto dura un proyecto residencial?", answer: "Entre cuatro y ocho meses segun alcance: dos de diseno y el resto de ejecucion y supervision." },
      { question: "Atienden fuera de Monterrey?", answer: "Tomamos proyectos en Saltillo y alrededores; otras ciudades se evaluan segun calendario." },
    ],
    ctaBlock: { title: "Tu espacio merece un plan", subtitle: "Agenda una visita tecnica", body: "La primera llamada de veinte minutos es sin costo y sirve para saber si somos el estudio correcto para tu proyecto.", cta: "Agendar llamada" },
    contact: { title: "Cotiza tu proyecto", subtitle: "Respondemos en 48 horas", body: "Cuentanos que espacio quieres transformar, en que zona esta y con que presupuesto aproximado cuentas." },
    hours: "Lunes a viernes 9:00-18:00",
  },
  {
    style: "Noir",
    businessName: "Onix Bar",
    businessType: "Cocteleria de autor",
    goal: "book_appointments",
    location: "Bogota, Colombia",
    phone: "+57 1 610-4425",
    email: "reservas@onixbar.co",
    imageTheme: "dark moody cocktail bar gold accents luxury interior night",
    tagline: "Cocteles de autor en un sotano de Chapinero Alto",
    heroBody: "Doce puestos en barra, una carta que cambia cada estacion y un equipo que trata el hielo, el destilado y el tiempo del cliente con el mismo respeto.",
    heroCta: "Reservar barra",
    about: { subtitle: "La casa", body: "Onix abrio en 2021 en un sotano restaurado de los anos cincuenta. No hay musica alta ni carta infinita: hay quince cocteles pensados durante meses, un menu corto de bocados y conversacion. La reserva es obligatoria los fines de semana." },
    services: [
      { name: "Experiencia de barra", description: "Recorrido de cuatro cocteles guiado por el bartender jefe, con maridaje de bocados.", price: "COP 220,000" },
      { name: "Carta de estacion", description: "Quince cocteles originales que rotan cuatro veces al ano con destilados locales e infusiones propias.", price: "COP 38,000-52,000" },
      { name: "Eventos privados", description: "El bar completo para grupos de hasta veinte personas, con carta disenada para la ocasion.", price: "Desde COP 3,800,000" },
      { name: "Clases de cocteleria", description: "Sesiones de dos horas para cuatro personas, los domingos en la tarde.", price: "COP 180,000 por persona" },
    ],
    benefits: [
      { title: "Hielo propio", description: "Programa de hielo cristalino cortado a mano para cada estilo de coctel." },
      { title: "Destilados locales", description: "Trabajamos con destilerias colombianas pequenas y lotes numerados." },
      { title: "Doce puestos", description: "Todo el servicio ocurre en barra, frente a quien prepara tu trago." },
      { title: "Sin prisa", description: "Las reservas son de dos horas y media; nadie te apura el ultimo sorbo." },
    ],
    ctaBlock: { title: "La barra abre a las siete", subtitle: "Jueves a sabado", body: "Los cupos de fin de semana se agotan con dias de anticipacion. Reserva y llega diez minutos antes.", cta: "Reservar ahora" },
    contact: { title: "Reservas", subtitle: "Confirmacion inmediata por WhatsApp", body: "Indicanos fecha, hora y numero de personas. Grupos de mas de seis se atienden solo en eventos privados." },
    hours: "Jueves a sabado 19:00-01:00",
  },
  {
    style: "Velocity",
    businessName: "Garaje Vector",
    businessType: "Taller automotriz",
    goal: "quote_forms",
    location: "Medellin, Colombia",
    phone: "+57 4 448-9012",
    email: "taller@garajevector.co",
    imageTheme: "performance car workshop mechanic garage tools dramatic light",
    tagline: "Mecanica de performance y preparacion de autos",
    heroBody: "Especialistas en afinacion, frenos y suspension para quienes usan el carro de verdad: track days, montana y carretera. Diagnostico con datos, no con oido.",
    heroCta: "Pedir cotizacion",
    services: [
      { name: "Diagnostico integral", description: "Escaner completo, prueba de compresion y revision de tren de rodaje con informe escrito.", price: "COP 180,000" },
      { name: "Preparacion para track day", description: "Frenos, liquidos, alineacion agresiva y revision de seguridad para tandas en el CDA o Tocancipa.", price: "Desde COP 950,000" },
      { name: "Suspension y frenos", description: "Instalacion y ajuste de coilovers, bujes y kits de freno de alto desempeno.", price: "Cotizacion por vehiculo" },
      { name: "Mantenimiento premium", description: "Plan semestral con aceites certificados, registro fotografico y bitacora digital del vehiculo.", price: "COP 620,000" },
    ],
    process: [
      { title: "Diagnostico con datos", description: "Todo entra por el escaner y el banco: sin diagnostico escrito no se cotiza ni se toca el carro." },
      { title: "Cotizacion cerrada", description: "Apruebas repuestos y mano de obra por escrito antes de empezar. Sin sorpresas al recoger." },
      { title: "Entrega con prueba", description: "Cada trabajo sale con prueba de ruta documentada y garantia de seis meses." },
    ],
    benefits: [
      { title: "Repuestos originales", description: "Trabajamos con importadores directos y entregamos factura de cada pieza." },
      { title: "Bitacora digital", description: "Historial completo de tu vehiculo con fotos y kilometraje en cada visita." },
      { title: "Garantia real", description: "Seis meses de garantia escrita sobre mano de obra en todos los servicios." },
      { title: "Solo cita programada", description: "Tu carro entra directo al elevador: no pasa dias parqueado esperando turno." },
    ],
    ctaBlock: { title: "Tu carro rinde mas de lo que crees", subtitle: "Agenda el diagnostico", body: "El informe es tuyo aunque no hagas el trabajo con nosotros.", cta: "Agendar diagnostico" },
    contact: { title: "Cotiza tu servicio", subtitle: "Agenda con una semana de anticipacion", body: "Dinos marca, modelo, ano y que le sientes al carro. Te respondemos con cita y presupuesto estimado." },
    hours: "Lunes a sabado 8:00-17:00",
  },
  {
    style: "Pulse",
    businessName: "Distrito Pulso",
    businessType: "Centro de entrenamiento",
    goal: "book_appointments",
    location: "Cali, Colombia",
    phone: "+57 2 380-5541",
    email: "entrena@distritopulso.co",
    imageTheme: "functional training gym athletes intense workout energy",
    tagline: "Entrenamiento funcional en grupos pequenos",
    heroBody: "Clases de cuarenta y cinco minutos, maximo doce atletas y coaches que corrigen cada repeticion. Aqui se entrena fuerte y se progresa con registro.",
    heroCta: "Clase de prueba gratis",
    services: [
      { name: "Funcional grupal", description: "Fuerza, acondicionamiento y movilidad en sesiones programadas por ciclos de ocho semanas.", price: "COP 190,000 mensual" },
      { name: "Entrenamiento personalizado", description: "Programacion individual con coach dedicado, dos a cuatro sesiones semanales.", price: "Desde COP 480,000" },
      { name: "Plan de competencia", description: "Preparacion especifica para competencias funcionales con seguimiento de marcas.", price: "COP 350,000 mensual" },
      { name: "Movilidad y recuperacion", description: "Sesiones de cuarenta minutos enfocadas en rangos de movimiento y prevencion de lesiones.", price: "COP 25,000 por clase" },
    ],
    process: [
      { title: "Evaluacion inicial", description: "Valoramos movilidad, fuerza base e historial de lesiones antes de tu primera clase." },
      { title: "Ciclos de ocho semanas", description: "La programacion sube de intensidad por bloques y cada atleta registra sus marcas." },
      { title: "Re-test y ajuste", description: "Al final de cada ciclo se repiten las pruebas y se ajusta el plan segun tus numeros." },
    ],
    benefits: [
      { title: "Maximo doce por clase", description: "Los coaches alcanzan a corregir tecnica en cada bloque de la sesion." },
      { title: "Registro de marcas", description: "Tu progreso queda en la app del box: cargas, tiempos y asistencia." },
      { title: "Coaches certificados", description: "Todo el equipo tiene certificacion internacional vigente y formacion en primeros auxilios." },
      { title: "Horarios de 5 am a 9 pm", description: "Dieciseis franjas diarias para que el entreno no dependa de tu agenda." },
    ],
    faq: [
      { question: "Nunca he entrenado, puedo empezar?", answer: "Si. La evaluacion inicial define tu punto de partida y las primeras dos semanas trabajas con cargas tecnicas." },
      { question: "Que debo llevar?", answer: "Ropa comoda, tenis estables y botella de agua. El box presta todo el material de entrenamiento." },
      { question: "Puedo congelar mi plan?", answer: "Los planes mensuales se pueden congelar hasta diez dias por lesion o viaje, avisando por la app." },
    ],
    ctaBlock: { title: "La primera clase va por nosotros", subtitle: "Sin permanencia minima", body: "Ven, entrena una sesion completa y decide con el cuerpo, no con el folleto.", cta: "Reservar clase gratis" },
    contact: { title: "Reserva tu cupo", subtitle: "Te confirmamos el mismo dia", body: "Dinos en que franja horaria prefieres entrenar y agenda tu evaluacion inicial." },
    hours: "Lunes a viernes 5:00-21:00 · Sabados 7:00-12:00",
  },
  {
    style: "Horizon",
    businessName: "Ruta Verde",
    businessType: "Ecoturismo",
    goal: "book_appointments",
    location: "San Gil, Colombia",
    phone: "+57 7 724-8890",
    email: "aventura@rutaverde.co",
    imageTheme: "mountain hiking landscape river canyon nature panoramic colombia",
    tagline: "Senderismo y rios en el canon del Chicamocha",
    heroBody: "Caminatas guiadas, descensos de rio y travesias de varios dias con guias locales certificados. Grupos pequenos, ritmo humano y montana de verdad.",
    heroCta: "Ver salidas",
    services: [
      { name: "Caminata del canon", description: "Travesia de un dia por el borde del Chicamocha con almuerzo campesino incluido.", price: "COP 185,000" },
      { name: "Rafting rio Fonce", description: "Descenso de dos horas apto para principiantes, con equipo completo y fotografia.", price: "COP 120,000" },
      { name: "Travesia de tres dias", description: "Circuito Barichara-Guane-Jordan durmiendo en posadas locales, todo incluido.", price: "COP 890,000" },
      { name: "Salidas privadas", description: "Rutas a la medida para familias, parejas o equipos de trabajo, con guia exclusivo.", price: "Desde COP 350,000" },
    ],
    benefits: [
      { title: "Guias locales certificados", description: "Todo el equipo es de la region y tiene certificacion de guianza y rescate vigente." },
      { title: "Grupos de maximo diez", description: "Se camina conversando, no en fila india de cincuenta personas." },
      { title: "Seguro incluido", description: "Todas las salidas incluyen seguro de accidentes y protocolo de evacuacion." },
      { title: "Economia local", description: "Posadas, comidas y transporte se contratan con familias de la zona." },
    ],
    locationText: "Salimos desde nuestra base en San Gil, Santander, a tres cuadras del parque principal. Recogidas en Barichara con reserva previa.",
    ctaBlock: { title: "La montana no se pospone", subtitle: "Salidas todos los fines de semana", body: "Reserva con una semana de anticipacion y asegura tu cupo en la proxima travesia.", cta: "Reservar cupo" },
    contact: { title: "Arma tu salida", subtitle: "Respondemos el mismo dia", body: "Cuentanos cuantos son, que fechas tienen y que tanto han caminado antes. Nosotros armamos el plan." },
    hours: "Todos los dias 7:00-19:00",
  },
  {
    style: "Market",
    businessName: "Mercado Once",
    businessType: "Restaurante",
    goal: "book_appointments",
    location: "Barranquilla, Colombia",
    phone: "+57 5 385-6674",
    email: "reservas@mercadoonce.co",
    imageTheme: "fresh market cuisine restaurant colorful dishes caribbean food",
    tagline: "Cocina de mercado con producto del Caribe",
    heroBody: "El menu se escribe cada manana segun lo que llega del mercado y de los pescadores de Puerto Colombia. Cocina abierta, mesa compartida y cero congelador.",
    heroCta: "Reservar mesa",
    about: { subtitle: "La cocina", body: "Mercado Once abrio en 2022 frente a la plaza de mercado que le da nombre. La despensa se compra a diario, el pescado llega entero y el menu de mediodia cambia todos los dias. Los sabados hay un unico menu largo de ocho pasos." },
    services: [
      { name: "Menu del mediodia", description: "Tres pasos que cambian a diario segun mercado: entrada, fuerte y postre de temporada.", price: "COP 48,000" },
      { name: "Menu largo de sabado", description: "Ocho pasos de producto caribeno con opcion de maridaje de vinos naturales.", price: "COP 185,000" },
      { name: "Barra de crudos", description: "Ceviches, tiraditos y ostras del dia, disponibles de jueves a sabado en la noche.", price: "COP 32,000-58,000" },
      { name: "Eventos y mesa completa", description: "El salon para veinticuatro personas con menu disenado con el chef.", price: "Desde COP 2,900,000" },
    ],
    benefits: [
      { title: "Compra diaria", description: "No hay congelador de proteinas: lo que ves en la carta llego esta manana." },
      { title: "Cocina abierta", description: "Toda la preparacion ocurre a la vista, en la barra central del salon." },
      { title: "Productores con nombre", description: "La carta dice quien pesco, quien cosecho y de que finca viene cada plato." },
      { title: "Vinos naturales", description: "Carta corta de productores pequenos de America del Sur, rotando cada mes." },
    ],
    locationText: "Carrera 44 #53-28, frente a la plaza de mercado. Parqueadero aliado en la esquina y reserva recomendada de jueves a sabado.",
    contact: { title: "Reserva tu mesa", subtitle: "Mesas de 2 a 6 personas", body: "Para el menu largo de sabado reserva con una semana de anticipacion. Avisanos alergias y restricciones al reservar." },
    hours: "Martes a domingo 12:00-15:30 · Jueves a sabado 19:00-23:00",
  },
  {
    style: "Showcase",
    businessName: "Nubia",
    businessType: "Software de facturacion",
    goal: "quote_forms",
    location: "Bogota, Colombia",
    phone: "+57 1 508-3320",
    email: "ventas@nubia.app",
    imageTheme: "modern software dashboard startup office clean product interface",
    tagline: "Facturacion electronica sin dolor para pymes",
    heroBody: "Nubia emite, valida y archiva tu facturacion electronica ante la DIAN en segundos. Sin instalar nada, sin contador de guardia y con soporte que responde de verdad.",
    heroCta: "Probar 30 dias gratis",
    about: { subtitle: "El producto", body: "Nacimos en 2023 dentro de una firma contable que sufria los mismos errores de siempre: facturas rechazadas, anexos perdidos y cierres eternos. Hoy mas de novecientas pymes facturan con Nubia cada mes." },
    services: [
      { name: "Plan Independiente", description: "Hasta 60 documentos mensuales, un usuario y soporte por chat.", price: "COP 49,000 mensual" },
      { name: "Plan Pyme", description: "Documentos ilimitados, cinco usuarios, nomina electronica y reportes de cartera.", price: "COP 149,000 mensual" },
      { name: "Plan Contador", description: "Multi-empresa para firmas contables: hasta 40 NIT bajo una sola cuenta.", price: "COP 390,000 mensual" },
      { name: "Migracion asistida", description: "Importamos tus clientes, productos y consecutivos desde tu sistema anterior.", price: "Incluida en planes anuales" },
    ],
    process: [
      { title: "Conecta tu NIT", description: "Registro guiado ante la DIAN en menos de quince minutos, con verificacion incluida." },
      { title: "Factura desde el dia uno", description: "Plantillas listas, catalogo importado y numeracion configurada automaticamente." },
      { title: "Cierra el mes en orden", description: "Reportes de ventas, cartera e impuestos listos para tu contador, exportables a Excel." },
    ],
    ctaBlock: { title: "Deja de pelear con la facturacion", subtitle: "30 dias gratis, sin tarjeta", body: "Crea tu cuenta, emite tu primera factura hoy y decide despues.", cta: "Crear cuenta gratis" },
    contact: { title: "Habla con ventas", subtitle: "Demos de veinte minutos", body: "Cuentanos cuantos documentos emites al mes y que sistema usas hoy; te mostramos Nubia funcionando con tus datos." },
    hours: "Soporte: lunes a viernes 8:00-20:00",
  },
  {
    style: "Boutique",
    businessName: "Voltaire",
    businessType: "Boutique de moda",
    goal: "sell_products",
    location: "Cartagena, Colombia",
    phone: "+57 5 664-7712",
    email: "hola@voltaire.co",
    imageTheme: "fashion boutique elegant clothing linen store colonial cartagena",
    tagline: "Moda de autor en lino y algodon para el tropico",
    heroBody: "Piezas de produccion limitada disenadas y confeccionadas en Cartagena: lino europeo, algodon organico y cortes que respiran. Coleccion nueva cada estacion, nunca mas de cuarenta unidades por diseno.",
    heroCta: "Ver coleccion",
    about: { subtitle: "La marca", body: "Voltaire empezo en 2018 como un taller de tres costureras en Getsemani. Seguimos produciendo todo a quince cuadras de la tienda, pagando por prenda terminada y firmando cada pieza con el nombre de quien la confecciono." },
    services: [
      { name: "Coleccion de temporada", description: "Vestidos, camisas y pantalones de lino en tirajes de maximo cuarenta unidades.", price: "COP 280,000-690,000" },
      { name: "Linea esencial", description: "Basicos permanentes en algodon organico: camisetas, camisas blancas y pantalon recto.", price: "COP 160,000-320,000" },
      { name: "Hechura a medida", description: "Cualquier pieza de la coleccion ajustada a tus medidas, lista en dos semanas.", price: "+30% sobre precio de coleccion" },
      { name: "Envios nacionales", description: "Entrega en 2 a 4 dias habiles a todo el pais, con cambios gratis en la primera semana.", price: "Gratis desde COP 400,000" },
    ],
    benefits: [
      { title: "Produccion local", description: "Todo se corta y cose en nuestro taller de Getsemani, sin maquila externa." },
      { title: "Tirajes limitados", description: "Maximo cuarenta unidades por diseno; cuando se acaba, no se repite." },
      { title: "Materiales certificados", description: "Lino europeo y algodon organico con certificacion de origen." },
      { title: "Cambios sin drama", description: "Siete dias para cambios y devoluciones, en tienda o por mensajeria." },
    ],
    faq: [
      { question: "Tienen tienda fisica?", answer: "Si, en el centro historico de Cartagena, Calle del Arsenal #8b-42. La coleccion completa esta en tienda y en linea." },
      { question: "Hacen envios internacionales?", answer: "Por ahora solo dentro de Colombia. Para envios al exterior escribenos y lo cotizamos por DHL." },
      { question: "Como se cuida el lino?", answer: "Lavado a mano o ciclo suave en frio, secado a la sombra. Cada prenda incluye instrucciones en la etiqueta." },
    ],
    contact: { title: "Escribenos", subtitle: "Atencion personal por WhatsApp", body: "Preguntas de tallas, disponibilidad o hechura a medida: te respondemos en horario de tienda." },
    hours: "Lunes a sabado 10:00-20:00 · Domingos 11:00-17:00",
  },
  {
    style: "Stack",
    businessName: "Ferretec",
    businessType: "Suministros industriales",
    goal: "quote_forms",
    location: "Bucaramanga, Colombia",
    phone: "+57 7 697-2280",
    email: "ventas@ferretec.co",
    imageTheme: "industrial supplies warehouse tools hardware organized shelves",
    tagline: "Suministro industrial con inventario real y entrega en 24 horas",
    heroBody: "Rodamientos, herramienta, EPP y consumibles de soldadura para plantas y talleres de Santander. Catalogo de once mil referencias con existencias visibles en linea.",
    heroCta: "Pedir cotizacion",
    services: [
      { name: "Rodamientos y transmision", description: "SKF, NTN y Timken originales con certificado, desde stock local.", price: "Catalogo en linea" },
      { name: "Herramienta industrial", description: "Manual, electrica y neumatica de las marcas que aguantan turno completo.", price: "Catalogo en linea" },
      { name: "EPP certificado", description: "Proteccion personal con certificacion vigente y tallas completas en bodega.", price: "Descuentos por volumen" },
      { name: "Cuenta empresarial", description: "Credito a 30 dias, precios pactados y reposicion automatica de consumibles.", price: "Sin costo de apertura" },
    ],
    process: [
      { title: "Cotiza por referencia", description: "Envia tu listado por correo o WhatsApp; respondemos con precio y existencia en maximo dos horas habiles." },
      { title: "Aprueba y programa", description: "Confirmas la orden y eliges franja de entrega o recogida en bodega." },
      { title: "Recibe en 24 horas", description: "Entrega en el area metropolitana al dia siguiente, con factura electronica y certificados." },
    ],
    benefits: [
      { title: "Inventario visible", description: "Las existencias del catalogo en linea se actualizan cada hora contra bodega." },
      { title: "Originales certificados", description: "Solo distribuimos marcas con representacion oficial; cada pieza sale con certificado." },
      { title: "Entrega 24 horas", description: "Flota propia en el area metropolitana de Bucaramanga y envios nacionales por transportadora." },
      { title: "Asesoria tecnica", description: "Ingenieros de planta te ayudan a homologar referencias descontinuadas." },
    ],
    faq: [
      { question: "Venden al detal?", answer: "Si, la tienda de bodega atiende publico general. Los precios por volumen aplican desde diez unidades." },
      { question: "Manejan credito empresarial?", answer: "Cuentas a 30 dias con estudio de un dia habil para empresas constituidas." },
      { question: "Que pasa si una referencia no esta en stock?", answer: "La importamos con tiempo de entrega confirmado por escrito antes de que apruebes la orden." },
    ],
    ctaBlock: { title: "Tu planta no puede esperar", subtitle: "Cotizaciones en dos horas", body: "Envia tu listado de referencias y recibe precio, existencia y tiempo de entrega en el mismo dia.", cta: "Enviar listado" },
    contact: { title: "Pide tu cotizacion", subtitle: "Respuesta en dos horas habiles", body: "Adjunta tu listado de referencias o describe lo que necesitas; un asesor tecnico te responde con existencias reales." },
    hours: "Lunes a viernes 7:30-17:30 · Sabados 8:00-13:00",
  },
  {
    style: "Corner",
    businessName: "Cafe Esquina",
    businessType: "Cafeteria",
    goal: "professional_presence",
    location: "Medellin, Colombia",
    phone: "+57 4 311-2245",
    email: "hola@cafeesquina.co",
    imageTheme: "cozy neighborhood coffee shop corner warm morning pastries",
    tagline: "El cafe de la cuadra en Laureles",
    heroBody: "Cafe de origen antioqueno, pan horneado en casa y mesas donde todavia se conversa. Abrimos a las siete con el primer horneo del dia.",
    heroCta: "Como llegar",
    about: { subtitle: "La esquina", body: "Desde 2017 tostamos cafe de fincas de Ciudad Bolivar y Jardin en lotes pequenos. La panaderia arranca a las cuatro de la manana y lo que ves en vitrina se horneo hoy. Los vecinos tienen taza propia en la pared." },
    services: [
      { name: "Barra de cafe", description: "Espresso, metodos de filtrado y bebidas frias con cafe de dos fincas antioquenas.", price: "COP 6,000-14,000" },
      { name: "Panaderia de casa", description: "Croissants, pan de masa madre y tortas horneadas cada manana en el local.", price: "COP 4,500-18,000" },
      { name: "Desayunos y brunch", description: "Carta corta de huevos, bowls y tostadas hasta el mediodia, todos los dias.", price: "COP 16,000-28,000" },
      { name: "Cafe en grano", description: "Bolsas de 250 y 500 gramos tostadas cada semana, molidas al gusto.", price: "COP 32,000-58,000" },
    ],
    locationText: "Circular 74b con calle 39b, esquina del parque de Laureles. Llegan facil en metro (estacion Floresta) y hay parqueadero de bicicletas en la puerta.",
    benefits: [
      { title: "Tueste propio", description: "Compramos cafe verde directamente a dos familias caficultoras y tostamos cada semana." },
      { title: "Horneo diario", description: "La vitrina se llena a las 7:00 y a las 14:00; lo del dia no se guarda para manana." },
      { title: "Precios de barrio", description: "Un espresso bien hecho no deberia costar como una cena. Aqui no pasa." },
      { title: "Espacio para quedarse", description: "Wifi estable, mesas grandes y enchufes: nadie te mira feo por quedarte a trabajar." },
    ],
    ctaBlock: { title: "Nos vemos en la esquina", subtitle: "Abierto todos los dias", body: "El primer horneo sale a las siete y los domingos hay brunch extendido hasta las dos.", cta: "Ver ubicacion" },
    contact: { title: "Escribenos", subtitle: "Pedidos y reservas de mesa grande", body: "Para tortas por encargo o reservar la mesa comunal escribenos con dos dias de anticipacion." },
    hours: "Lunes a sabado 7:00-19:00 · Domingos 8:00-14:00",
  },
  {
    style: "Neighbor",
    businessName: "Fundacion Vecinos",
    businessType: "Organizacion comunitaria",
    goal: "professional_presence",
    location: "Bogota, Colombia",
    phone: "+57 1 289-4471",
    email: "contacto@fundacionvecinos.org",
    imageTheme: "community volunteers neighborhood garden people working together",
    tagline: "Trabajo comunitario en el sur de Bogota desde 2009",
    heroBody: "Refuerzo escolar, huertas urbanas y acompanamiento a adultos mayores en San Cristobal. Todo lo hacemos con vecinos voluntarios y donaciones locales.",
    heroCta: "Quiero ayudar",
    about: { subtitle: "Quienes somos", body: "La fundacion nacio en 2009 cuando doce familias del barrio convirtieron un lote baldio en huerta comunitaria. Hoy somos ochenta voluntarios activos, tres programas permanentes y una sede que construyo el mismo barrio." },
    services: [
      { name: "Refuerzo escolar", description: "Apoyo en tareas y lectura para ninos de primaria, de lunes a jueves en la tarde.", price: "Gratuito" },
      { name: "Huertas urbanas", description: "Cuatro huertas comunitarias que alimentan el comedor y ensenan agricultura urbana.", price: "Participacion abierta" },
      { name: "Adultos mayores", description: "Visitas semanales, jornadas de salud y almuerzo comunitario los viernes.", price: "Gratuito" },
      { name: "Escuela de oficios", description: "Talleres de carpinteria, costura y panaderia para jovenes del barrio.", price: "Inscripcion simbolica" },
    ],
    benefits: [
      { title: "Del barrio y para el barrio", description: "Todos los programas los proponen y ejecutan los mismos vecinos." },
      { title: "Cuentas claras", description: "Publicamos ingresos y gastos cada trimestre en cartelera y en la web." },
      { title: "Voluntariado flexible", description: "Desde dos horas al mes: cada quien aporta el tiempo que puede." },
      { title: "Quince anos de trabajo", description: "Tres programas permanentes que no han parado desde 2009." },
    ],
    locationText: "Nuestra sede esta en el barrio La Victoria, San Cristobal, carrera 3 este #38-15 sur. Los sabados en la manana hay jornada abierta para conocer los programas.",
    contact: { title: "Suma tus manos", subtitle: "Voluntariado y donaciones", body: "Cuentanos que sabes hacer y cuanto tiempo tienes. Tambien recibimos donaciones en especie: mercados, libros y herramienta." },
    hours: "Lunes a viernes 14:00-18:00 · Sabados 9:00-13:00",
  },
  {
    style: "Homestead",
    businessName: "Vivero La Loma",
    businessType: "Vivero y paisajismo",
    goal: "quote_forms",
    location: "Rionegro, Colombia",
    phone: "+57 4 561-7738",
    email: "vivero@laloma.co",
    imageTheme: "plant nursery greenhouse garden landscaping green mountains countryside",
    tagline: "Vivero de altura y paisajismo para el Oriente antioqueno",
    heroBody: "Tres hectareas de vivero a 2,100 metros: nativas, frutales y jardines disenados para el clima de la region. Sembramos lo que si se da aqui.",
    heroCta: "Cotizar jardin",
    about: { subtitle: "La finca", body: "La Loma es un negocio familiar de tercera generacion. Empezo como cultivo de hortensias en 1987 y hoy produce mas de doscientas especies con enfoque en nativas del bosque altoandino. El diseno de jardines lo lidera la nieta de los fundadores, ingeniera forestal." },
    services: [
      { name: "Plantas y arboles", description: "Nativas, frutales de clima frio, ornamentales y aromaticas producidas en la finca.", price: "Desde COP 8,000" },
      { name: "Diseno de jardines", description: "Levantamiento, plano de siembra y seleccion de especies segun suelo y luz de tu lote.", price: "Desde COP 850,000" },
      { name: "Instalacion y siembra", description: "Preparacion de suelo, siembra y tutorado con garantia de prendimiento de tres meses.", price: "Cotizacion por proyecto" },
      { name: "Mantenimiento mensual", description: "Poda, fertilizacion organica y monitoreo fitosanitario para jardines y fincas.", price: "Desde COP 280,000 mensual" },
    ],
    locationText: "Kilometro 4 via Rionegro-El Carmen, vereda La Mosquita. Abierto al publico de martes a domingo; los domingos hay recorrido guiado por el vivero a las 10:00.",
    faq: [
      { question: "Hacen envios de plantas?", answer: "Entregamos en todo el Oriente antioqueno y el Valle de Aburra. Arboles de mas de dos metros requieren visita previa." },
      { question: "Que garantia tiene la siembra?", answer: "Tres meses de garantia de prendimiento siempre que se siga el plan de riego que entregamos por escrito." },
      { question: "Atienden proyectos grandes?", answer: "Si, trabajamos con constructoras y municipios en compensaciones y siembras masivas de nativas." },
    ],
    ctaBlock: { title: "Tu lote puede ser bosque", subtitle: "Visita tecnica en la region", body: "Agendamos la visita, medimos luz y suelo, y te entregamos propuesta con especies que si prosperan aqui.", cta: "Agendar visita" },
    contact: { title: "Cotiza tu proyecto", subtitle: "Visitas de miercoles a viernes", body: "Cuentanos donde queda tu lote o jardin, que area tiene y que suenas ver crecer ahi." },
    hours: "Martes a domingo 8:00-17:00",
  },
  {
    style: "Storefront",
    businessName: "Pinturas Robles",
    businessType: "Pintura residencial",
    goal: "quote_forms",
    location: "Pereira, Colombia",
    phone: "+57 6 335-8812",
    email: "cotizaciones@pinturasrobles.co",
    imageTheme: "professional house painters ladder paint cans residential work",
    tagline: "Pintura residencial y comercial con acabado garantizado",
    heroBody: "Veinte anos pintando casas, apartamentos y locales en Pereira y Dosquebradas. Presupuesto cerrado por escrito, obra limpia y garantia de dos anos sobre el acabado.",
    heroCta: "Cotizar gratis",
    services: [
      { name: "Pintura interior", description: "Muros, techos y carpinteria con vinilos y esmaltes de primera linea. Incluye resane y proteccion de pisos.", price: "Desde COP 14,000 por m2" },
      { name: "Fachadas", description: "Lavado, impermeabilizacion y pintura de fachadas con andamiaje certificado.", price: "Cotizacion en sitio" },
      { name: "Locales y oficinas", description: "Trabajo nocturno y de fin de semana para no parar tu operacion.", price: "Presupuesto cerrado" },
      { name: "Estucos y texturas", description: "Estuco veneciano, cemento pulido y texturas decorativas con muestrario fisico.", price: "Desde COP 38,000 por m2" },
    ],
    locationText: "Atendemos Pereira, Dosquebradas y Santa Rosa de Cabal. La visita de cotizacion es gratuita y se agenda en franjas de manana o tarde.",
    about: { subtitle: "El equipo", body: "Somos una cuadrilla estable de ocho pintores liderada por Hernan Robles, maestro pintor con veinte anos de oficio. No subcontratamos: la gente que cotiza es la misma que pinta, y por eso la garantia la firmamos sin letra pequena." },
    benefits: [
      { title: "Presupuesto cerrado", description: "El precio que firmas es el precio que pagas. Los imprevistos corren por nuestra cuenta." },
      { title: "Obra limpia", description: "Protegemos pisos y muebles, y entregamos el espacio aseado cada dia de trabajo." },
      { title: "Garantia de dos anos", description: "Cubrimos desprendimientos y fallas de acabado por escrito." },
      { title: "Pintura certificada", description: "Trabajamos con las lineas premium de los fabricantes y entregamos las fichas tecnicas." },
    ],
    faq: [
      { question: "Cuanto demora pintar un apartamento?", answer: "Un apartamento de 80 m2 toma entre tres y cinco dias habiles segun el estado de los muros." },
      { question: "Debo desocupar el espacio?", answer: "No es necesario. Trabajamos por zonas y protegemos todo el mobiliario con plastico y carton." },
      { question: "La cotizacion tiene costo?", answer: "No. Visitamos, medimos y entregamos presupuesto detallado por escrito sin ningun compromiso." },
    ],
    contact: { title: "Pide tu cotizacion", subtitle: "Visita gratuita en 48 horas", body: "Dinos que espacio quieres pintar y en que barrio esta. Te llamamos para agendar la visita de medicion." },
    hours: "Lunes a sabado 7:00-18:00",
  },
  {
    style: "Ledger",
    businessName: "Cifra Contadores",
    businessType: "Contaduria",
    goal: "quote_forms",
    location: "Bogota, Colombia",
    phone: "+57 1 623-9955",
    email: "info@cifracontadores.co",
    imageTheme: "professional accounting office minimal desk documents order",
    tagline: "Contabilidad clara para empresas que quieren dormir tranquilas",
    heroBody: "Llevamos la contabilidad, los impuestos y la nomina de ciento veinte pymes con una regla simple: cero sorpresas con la DIAN y reportes que un gerente entiende sin traductor.",
    heroCta: "Solicitar propuesta",
    about: { subtitle: "La firma", body: "Cifra la fundaron dos contadoras publicas en 2014. El equipo actual es de once personas entre contadores, auxiliares y un abogado tributarista. Cada cliente tiene un contador titular asignado y las cifras se entregan el mismo dia habil de cada mes, sin excepcion." },
    services: [
      { name: "Contabilidad mensual", description: "Registro, conciliaciones, estados financieros y entrega puntual el quinto dia habil.", price: "Desde COP 850,000 mensual" },
      { name: "Impuestos", description: "Declaraciones nacionales y distritales, planeacion tributaria y respuesta a requerimientos.", price: "Incluido en plan mensual" },
      { name: "Nomina electronica", description: "Liquidacion, seguridad social y nomina electronica DIAN hasta cincuenta empleados.", price: "Desde COP 320,000 mensual" },
      { name: "Revisoria fiscal", description: "Revisoria para copropiedades y empresas obligadas, con dictamen y acompanamiento a asamblea.", price: "Cotizacion segun entidad" },
    ],
    benefits: [
      { title: "Contador titular", description: "Una persona con nombre responde por tu contabilidad, no un correo generico." },
      { title: "Entrega el dia cinco", description: "Estados financieros el quinto dia habil de cada mes, hace diez anos sin fallar." },
      { title: "Cero sanciones", description: "Ningun cliente de la firma ha pagado sancion por presentacion extemporanea." },
      { title: "Reportes legibles", description: "Un tablero de tres paginas con lo que importa: caja, cartera, impuestos por venir." },
    ],
    faq: [
      { question: "Trabajan con mi software contable?", answer: "Operamos Siigo, World Office y Alegra. Si usas otro sistema, evaluamos la migracion sin costo." },
      { question: "Que necesito para empezar?", answer: "RUT, camara de comercio, ultimo cierre contable y accesos de facturacion. La transicion toma dos semanas." },
      { question: "Atienden personas naturales?", answer: "Solo declaraciones de renta de los socios de nuestras empresas cliente." },
    ],
    contact: { title: "Solicita tu propuesta", subtitle: "Respuesta en dos dias habiles", body: "Cuentanos a que se dedica tu empresa, cuantos empleados tiene y que sistema contable usas hoy." },
    hours: "Lunes a viernes 8:00-17:00",
  },
  {
    style: "Blank",
    businessName: "Estudio Nulo",
    businessType: "Consultoria de marca",
    goal: "professional_presence",
    location: "Remoto",
    phone: "",
    email: "hola@estudionulo.com",
    imageTheme: "minimal white studio desk single object clean",
    tagline: "Estrategia de marca. Nada mas.",
    heroBody: "Un consultor, seis proyectos al ano, un solo entregable: la estrategia que define que dice tu marca, a quien y por que deberia importarle.",
    heroCta: "Escribir",
    services: [
      { name: "Diagnostico", description: "Dos semanas de inmersion: entrevistas, mercado y una lectura honesta de donde esta parada tu marca.", price: "USD 2,400" },
      { name: "Estrategia completa", description: "Seis semanas: posicionamiento, narrativa, arquitectura de mensajes y hoja de ruta de doce meses.", price: "USD 7,800" },
      { name: "Consejo mensual", description: "Dos llamadas al mes para decidir con criterio lo que la estrategia dejo planteado.", price: "USD 600 mensual" },
    ],
    benefits: [
      { title: "Seis proyectos al ano", description: "Atencion completa del consultor, sin equipo junior haciendo el trabajo." },
      { title: "Un entregable util", description: "Cuarenta paginas que tu equipo usa, no un PDF decorativo de doscientas." },
      { title: "Sin humo", description: "Si el problema no es de marca, se dice en la primera llamada y no se cobra." },
    ],
    contact: { title: "Escribir", subtitle: "Un correo basta", body: "Cuenta que hace tu empresa y que decision tienes atascada. Respuesta en tres dias." },
    hours: "",
  },
  {
    style: "Serif",
    businessName: "Elena Ruiz",
    businessType: "Psicologia clinica",
    goal: "book_appointments",
    location: "Ciudad de Mexico",
    phone: "+52 55 8021-4437",
    email: "consulta@elenaruiz.mx",
    imageTheme: "calm therapy office plants soft light armchair peaceful",
    tagline: "Psicoterapia para adultos, presencial y en linea",
    heroBody: "Acompano procesos de ansiedad, duelo y transiciones de vida desde el enfoque cognitivo-conductual, con quince anos de practica clinica y consulta en la colonia Condesa.",
    heroCta: "Agendar primera sesion",
    about: { subtitle: "Sobre mi", body: "Soy psicologa clinica por la UNAM con maestria en terapia cognitivo-conductual y formacion en terapia de aceptacion y compromiso. Atiendo adultos en procesos individuales; la primera sesion es de evaluacion y sirve para decidir, con libertad, si soy la terapeuta adecuada para ti." },
    services: [
      { name: "Terapia individual", description: "Sesiones semanales de cincuenta minutos, presenciales en Condesa o por videollamada.", price: "MXN 1,100" },
      { name: "Primera sesion de evaluacion", description: "Revision de motivo de consulta, historia y objetivos del proceso.", price: "MXN 900" },
      { name: "Acompanamiento en duelo", description: "Proceso estructurado de doce a dieciseis sesiones para perdidas significativas.", price: "MXN 1,100 por sesion" },
    ],
    contact: { title: "Agenda tu sesion", subtitle: "Horarios de tarde y noche", body: "Escribeme contando brevemente que te trae a terapia y si prefieres modalidad presencial o en linea." },
    hours: "Lunes a jueves 14:00-21:00",
  },
  {
    style: "Mono",
    businessName: "Datalab",
    businessType: "Consultoria de datos",
    goal: "quote_forms",
    location: "Bogota, Colombia",
    phone: "+57 1 744-6690",
    email: "equipo@datalab.co",
    imageTheme: "data engineering terminal code screens minimal dark office",
    tagline: "Pipelines de datos que no se rompen a las 3 a.m.",
    heroBody: "Disenamos y operamos infraestructura de datos para empresas medianas: warehouses, pipelines y tableros que el equipo de negocio consulta sin pedir permiso a ingenieria.",
    heroCta: "Agendar llamada tecnica",
    services: [
      { name: "Arquitectura de datos", description: "Diseno de warehouse y stack de ingesta sobre BigQuery, Snowflake o Postgres.", price: "Desde USD 6,000" },
      { name: "Pipelines gestionados", description: "Construccion y operacion de ETL/ELT con monitoreo, alertas y SLA de recuperacion.", price: "Desde USD 1,800 mensual" },
      { name: "Tableros de negocio", description: "Metricas de ventas, operacion y finanzas en Metabase o Looker Studio, con capacitacion.", price: "USD 3,200 por dominio" },
      { name: "Auditoria de stack", description: "Dos semanas de revision: costos, cuellos de botella y plan de mejora priorizado.", price: "USD 2,500" },
    ],
    faq: [
      { question: "Trabajan con nuestro equipo interno?", answer: "Si, el modelo preferido es construir junto a tu equipo y dejar la operacion documentada y transferida." },
      { question: "Que pasa si ya tenemos un stack armado?", answer: "La auditoria parte de lo que existe. Solo recomendamos migrar cuando los numeros lo justifican." },
      { question: "Firman acuerdos de confidencialidad?", answer: "Siempre. NDA antes de la primera llamada tecnica si tu empresa lo requiere." },
    ],
    about: { subtitle: "El equipo", body: "Cuatro ingenieros de datos con pasado en fintech y retail. Sin gerentes de cuenta: quien te atiende la llamada es quien escribe el codigo. Documentamos todo en repositorios que quedan en tu organizacion desde el dia uno." },
    ctaBlock: { title: "Los datos ya los tienes", subtitle: "Falta que trabajen para ti", body: "Una llamada tecnica de treinta minutos basta para saber si podemos ayudarte y cuanto costaria.", cta: "Agendar llamada" },
    contact: { title: "Hablemos de tu stack", subtitle: "Llamada tecnica sin costo", body: "Cuentanos que fuentes de datos tienes, que herramientas usas hoy y que pregunta de negocio no logras responder." },
    hours: "Lunes a viernes 9:00-18:00",
  },
  {
    style: "Blueprint",
    businessName: "Obra Firme",
    businessType: "Construccion",
    goal: "quote_forms",
    location: "Medellin, Colombia",
    phone: "+57 4 322-7180",
    email: "proyectos@obrafirme.co",
    imageTheme: "construction site blueprint workers renovation building process",
    tagline: "Remodelaciones y obra nueva con cronograma cumplido",
    heroBody: "Construimos y remodelamos viviendas y locales en el Valle de Aburra con un metodo simple: presupuesto detallado, cronograma por etapas y un residente que responde el telefono.",
    heroCta: "Cotizar obra",
    process: [
      { title: "Visita y anteproyecto", description: "Levantamiento del espacio, revision estructural basica y propuesta preliminar con orden de magnitud de costos." },
      { title: "Presupuesto por capitulos", description: "Cada capitulo de obra con cantidades, precios unitarios y cronograma semana a semana. Firmas sabiendo que pagas." },
      { title: "Ejecucion por etapas", description: "Cortes de obra quincenales con registro fotografico y acta; los pagos siguen el avance real." },
      { title: "Entrega y postventa", description: "Lista de chequeo firmada, manual de acabados y seis meses de postventa con visitas programadas." },
    ],
    benefits: [
      { title: "Cronograma con fecha real", description: "El 92% de nuestras obras de los ultimos tres anos entregaron en la fecha pactada." },
      { title: "Residente asignado", description: "Un ingeniero residente por obra, con telefono directo y reporte quincenal." },
      { title: "Precios unitarios claros", description: "Presupuesto por capitulos con cantidades: los adicionales se pactan antes, no despues." },
      { title: "Personal formalizado", description: "Toda la cuadrilla con seguridad social y ARL al dia, verificable en cada corte." },
    ],
    services: [
      { name: "Remodelacion integral", description: "Apartamentos y casas: demolicion, redes, acabados y carpinteria con diseno incluido.", price: "Desde COP 1,450,000 por m2" },
      { name: "Cocinas y banos", description: "Renovacion completa en tres a cinco semanas con materiales seleccionados en showroom aliado.", price: "Desde COP 18,000,000" },
      { name: "Locales comerciales", description: "Adecuacion de locales con licencias, redes y acabados listos para operar.", price: "Cotizacion por proyecto" },
      { name: "Obra nueva menor", description: "Ampliaciones, segundos pisos y estructuras livianas con calculo estructural certificado.", price: "Cotizacion por proyecto" },
    ],
    about: { subtitle: "La empresa", body: "Obra Firme la dirige un equipo de dos ingenieros civiles y una arquitecta con veinte anos sumados en constructoras grandes. Nos independizamos para hacer obra mediana con estandares de obra grande: actas, cortes, ARL y cronogramas que se cumplen." },
    faq: [
      { question: "Manejan licencias de construccion?", answer: "Si, gestionamos licencias y permisos ante curaduria cuando el alcance de la obra lo exige." },
      { question: "Puedo habitar la casa durante la remodelacion?", answer: "En remodelaciones por etapas si; lo definimos en el cronograma para aislar zonas de trabajo." },
      { question: "Como se pactan los adicionales?", answer: "Cualquier cambio se cotiza por escrito con precio unitario y dias de impacto antes de ejecutarse." },
    ],
    ctaBlock: { title: "Tu obra con fecha de entrega", subtitle: "Visita tecnica esta semana", body: "Agenda la visita, recibe el anteproyecto y decide con numeros sobre la mesa.", cta: "Agendar visita" },
    contact: { title: "Cotiza tu obra", subtitle: "Anteproyecto en una semana", body: "Cuentanos que quieres construir o remodelar, en que barrio esta y para cuando lo necesitas." },
    hours: "Lunes a viernes 7:00-17:00 · Sabados 8:00-12:00",
  },
];

// ── Constructores de secciones desde el sectionPlan del preset ───────────────

function buildSections(def) {
  const plan = getDesignPreset(def.style).sectionPlan;
  return plan.map((type, order) => {
    const builder = BUILDERS[type];
    if (!builder) throw new Error(`Sin constructor para la seccion "${type}" (${def.style})`);
    return { order, ...builder(def) };
  });
}

const BUILDERS = {
  hero: (d) => ({
    type: "hero", title: d.businessName, isVisible: true,
    content: { subtitle: d.tagline, body: d.heroBody, ctaText: d.heroCta, ctaLink: "#contact", imagePrompt: d.imageTheme },
    settings: {},
  }),
  services: (d) => ({
    type: "services", title: "Servicios", isVisible: true,
    content: { subtitle: `Lo que hacemos en ${d.businessName}`, body: "", ctaText: d.heroCta, ctaLink: "#contact", imagePrompt: "" },
    settings: { items: d.services },
  }),
  benefits: (d) => ({
    type: "benefits", title: `Por que ${d.businessName}`, isVisible: true,
    content: { subtitle: "Razones concretas, sin adornos", body: "", ctaText: "", ctaLink: "", imagePrompt: "" },
    settings: { items: d.benefits ?? [] },
  }),
  process: (d) => ({
    type: "process", title: "Como trabajamos", isVisible: true,
    content: { subtitle: "Un metodo claro de principio a fin", body: "", ctaText: "", ctaLink: "", imagePrompt: "" },
    settings: { items: d.process ?? [] },
  }),
  about_us: (d) => ({
    type: "about_us", title: d.about?.subtitle ?? "Nosotros", isVisible: true,
    content: { subtitle: d.businessType, body: d.about?.body ?? d.heroBody, ctaText: "", ctaLink: "", imagePrompt: d.imageTheme },
    settings: {},
  }),
  gallery: (d) => ({
    type: "gallery", title: "Galeria", isVisible: true,
    content: { subtitle: `${d.businessName} en imagenes`, body: "", ctaText: "", ctaLink: "", imagePrompt: d.imageTheme },
    settings: {},
  }),
  faq: (d) => ({
    type: "faq", title: "Preguntas frecuentes", isVisible: true,
    content: { subtitle: "Lo que suelen preguntarnos antes de empezar", body: "", ctaText: "", ctaLink: "", imagePrompt: "" },
    settings: { items: d.faq ?? [] },
  }),
  location: (d) => ({
    type: "location", title: "Donde estamos", isVisible: true,
    content: { subtitle: d.location, body: d.locationText ?? `Atendemos en ${d.location}.`, ctaText: "Como llegar", ctaLink: "#contact", imagePrompt: "" },
    settings: {},
  }),
  cta: (d) => ({
    type: "cta", title: d.ctaBlock?.title ?? `Trabajemos juntos`, isVisible: true,
    content: {
      subtitle: d.ctaBlock?.subtitle ?? d.tagline,
      body: d.ctaBlock?.body ?? `Escribenos y empecemos: ${d.email}`,
      ctaText: d.ctaBlock?.cta ?? d.heroCta, ctaLink: "#contact", imagePrompt: "",
    },
    settings: {},
  }),
  contact: (d) => ({
    type: "contact", title: d.contact.title, isVisible: true,
    content: { subtitle: d.contact.subtitle, body: d.contact.body, ctaText: d.heroCta, ctaLink: "", imagePrompt: "" },
    settings: {},
  }),
  footer: (d) => ({
    type: "footer", title: d.businessName, isVisible: true,
    content: {
      subtitle: `${d.businessType} · ${d.location}`,
      body: [d.hours, d.phone, d.email].filter(Boolean).join(" · "),
      ctaText: "", ctaLink: "", imagePrompt: "",
    },
    settings: {},
  }),
};

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const targetEmail = process.env.SEED_USER_EMAIL || "info@cluster.marketing";
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: targetEmail }, { username: "admin" }] },
    select: { id: true, email: true },
  });
  if (!user) console.warn(`Aviso: no existe usuario ${targetEmail}; los sitios quedaran sin dueno.`);

  const created = [];
  for (const def of SITES) {
    const preset = getDesignPreset(def.style);
    if (preset.id !== def.style) throw new Error(`El estilo ${def.style} no existe en el catalogo.`);
    const palette = getPalette(preset.paletteId, def.businessName);
    const sections = buildSections(def);

    const site = await prisma.site.create({
      data: {
        userId: user?.id ?? null,
        businessName: def.businessName,
        businessType: def.businessType,
        goal: def.goal,
        visualStyle: def.style,
        location: def.location === "Remoto" ? null : def.location,
        phone: def.phone || null,
        email: def.email,
        domain: null,
        publicSlug: slug(def.businessName),
        language: "es",
        status: "PUBLISHED",
        publishedAt: new Date(),
        primaryColor: palette.primary,
        secondaryColor: palette.secondary,
        accentColor: palette.accent,
        blueprintJson: { site: { visualStyle: { name: def.style, colors: { ...palette } } } },
        sections: {
          create: sections.map((s) => ({
            type: s.type, title: s.title, order: s.order,
            isVisible: s.isVisible, content: s.content, settingsJson: s.settings,
          })),
        },
      },
      select: { id: true, businessName: true, visualStyle: true, publicSlug: true },
    });
    created.push(site);
    console.log(`${site.visualStyle.padEnd(11)} ${site.businessName.padEnd(22)} /builder/${site.id}`);
  }

  console.log(`\n${created.length} sitios creados para ${user?.email ?? "(sin dueno)"}. Visibles en /admin/sites.`);
}

main()
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(() => prisma.$disconnect());
