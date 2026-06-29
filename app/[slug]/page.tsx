import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, CircleHelp, Globe2, LayoutTemplate, ShieldCheck } from "lucide-react";

import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { Button } from "@/components/ui/button";

const pages = {
  templates: { title: "Plantillas para empezar con dirección", description: "Elige una categoría; Cluster adapta el contenido, la paleta y hasta seis estilos a tu negocio." },
  domains: { title: "Tu dominio, conectado sin complicaciones", description: "Publica primero con un enlace gratuito y conecta tu dominio cuando estés listo." },
  pricing: { title: "Empieza gratis. Mejora cuando lo necesites.", description: "Prueba el constructor sin tarjeta. Cluster Pro reúne dominio, hosting y mayor capacidad de IA en un solo plan." },
  help: { title: "Ayuda directa para publicar", description: "Respuestas breves para crear, editar, publicar y administrar tu sitio." },
  terms: { title: "Términos de servicio", description: "Reglas básicas para utilizar Cluster." },
  privacy: { title: "Política de privacidad", description: "Qué datos procesa Cluster y para qué se utilizan." },
  cookies: { title: "Política de cookies", description: "Cómo se usa el almacenamiento necesario para operar la plataforma." },
  "refund-policy": { title: "Política de reembolsos", description: "Condiciones generales para cancelaciones y solicitudes de reembolso." },
  "acceptable-use": { title: "Política de uso aceptable", description: "Contenido y actividades que no están permitidos en Cluster." },
} as const;

type Slug = keyof typeof pages;

export function generateStaticParams() { return Object.keys(pages).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug as Slug;
  const page = pages[slug];
  return page ? { title: `${page.title} | Cluster`, description: page.description } : {};
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug as Slug;
  const page = pages[slug];
  if (!page) notFound();
  return <MarketingChrome><main><Hero title={page.title} description={page.description} />{renderPage(slug)}</main></MarketingChrome>;
}

function Hero({ title, description }: { title: string; description: string }) {
  return <section className="border-b border-border px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto max-w-5xl text-center"><h1 className="font-[var(--font-outfit)] text-4xl font-semibold tracking-[-.04em] sm:text-6xl">{title}</h1><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{description}</p></div></section>;
}

function renderPage(slug: Slug) {
  if (slug === "templates") return <Templates />;
  if (slug === "domains") return <Domains />;
  if (slug === "pricing") return <Pricing />;
  if (slug === "help") return <Help />;
  return <Legal slug={slug} />;
}

function Templates() {
  const categories = ["Restaurantes", "Servicios profesionales", "Belleza y bienestar", "Salud", "Tiendas locales", "Portafolios"];
  return <section className="px-5 py-16 sm:px-8"><div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-3">{categories.map((category, index) => <article key={category} className="overflow-hidden rounded-xl border border-border bg-card"><div className={`h-44 soft-grid p-5 ${index % 2 ? "bg-[#181329]" : "bg-[#211a2d]"}`}><div className="h-full rounded-lg border border-[#5b4774] bg-[#f7f3ed] p-4"><div className="h-2 w-1/3 bg-[#17131b]" /><div className="mt-8 h-4 w-4/5 bg-[#17131b]" /><div className="mt-2 h-4 w-3/5 bg-[#17131b]" /><div className="mt-5 h-8 w-24 rounded bg-[#8b5cf6]" /></div></div><div className="p-5"><LayoutTemplate className="h-5 w-5 text-[#a078ff]" /><h2 className="mt-3 text-xl font-semibold">{category}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Contenido y estructura adaptados a esta actividad.</p><Link href="/builder" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#d0bcff]">Crear con esta categoría <ArrowRight className="h-4 w-4" /></Link></div></article>)}</div></section>;
}

function Domains() {
  return <section className="px-5 py-16 sm:px-8"><div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">{[
    ["1", "Publica gratis", "Obtén primero una URL pública de Cluster."],
    ["2", "Conecta tu dominio", "Agrega el dominio desde el editor con Cluster Pro."],
    ["3", "Activa DNS y SSL", "La verificación y el certificado se gestionan automáticamente."],
  ].map(([step, title, copy]) => <article key={step} className="rounded-xl border border-border bg-card p-6"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2c2141] font-bold text-[#d0bcff]">{step}</span><h2 className="mt-5 text-xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></article>)}</div><div className="mt-10 text-center"><Button asChild size="lg"><Link href="/builder"><Globe2 /> Crear sitio primero</Link></Button><p className="mt-3 text-xs text-muted-foreground">Cluster todavía no vende ni transfiere dominios; actualmente permite conectarlos.</p></div></section>;
}

function Pricing() {
  return <section className="px-5 py-16 sm:px-8"><div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2"><article className="rounded-xl border border-border bg-card p-7"><p className="text-sm font-bold text-muted-foreground">Gratis</p><h2 className="mt-3 text-3xl font-semibold">Crea antes de pagar</h2><ul className="mt-6 space-y-3 text-sm">{["Generación con IA", "Editor visual", "Subdominio público", "Formulario de contactos", "Descarga ZIP"].map((item) => <li key={item} className="flex gap-2"><Check className="h-5 w-5 text-emerald-400" />{item}</li>)}</ul><Button asChild variant="outline" className="mt-8 w-full"><Link href="/builder">Probar gratis</Link></Button></article><article className="rounded-xl border border-[#6e46a5] bg-[#21182e] p-7 shadow-[var(--shadow-glow)]"><p className="text-sm font-bold text-[#d0bcff]">Un solo plan</p><h2 className="mt-3 text-3xl font-semibold">Cluster Pro</h2><p className="mt-2 text-sm text-muted-foreground">El precio vigente se muestra antes de confirmar el pago.</p><ul className="mt-6 space-y-3 text-sm">{["Dominio personalizado y SSL", "Hosting administrado", "100 generaciones por hora", "Sin marca Cluster"].map((item) => <li key={item} className="flex gap-2"><Check className="h-5 w-5 text-emerald-400" />{item}</li>)}</ul><Button asChild className="mt-8 w-full"><Link href="/billing">Ver Cluster Pro</Link></Button></article></div></section>;
}

function Help() {
  const questions = [
    ["¿Puedo probar sin registrarme?", "Sí. Solo pedimos acceso cuando guardas mejoras, publicas o descargas."],
    ["¿Cómo cambio el diseño?", "Abre Diseño → Plantilla dentro del editor."],
    ["¿Cómo publico?", "Guarda los cambios e inicia sesión al usar Publicar."],
    ["¿Dónde llegan los formularios?", "Los contactos aparecen en la sección Contactos de cada proyecto."],
    ["¿Puedo usar mi dominio?", "Sí, con Cluster Pro desde la opción Dominio del proyecto."],
    ["¿Puedo descargar el sitio?", "Sí. La descarga entrega un ZIP estático desde el editor."],
  ];
  return <section className="px-5 py-16 sm:px-8"><div className="mx-auto grid max-w-4xl gap-4">{questions.map(([question, answer]) => <details key={question} className="rounded-xl border border-border bg-card p-5"><summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 font-semibold"><CircleHelp className="h-5 w-5 shrink-0 text-[#a078ff]" />{question}</summary><p className="pl-8 pt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div></section>;
}

function Legal({ slug }: { slug: Exclude<Slug, "templates" | "domains" | "pricing" | "help"> }) {
  const content: Record<string, string[]> = {
    terms: ["Debes proporcionar información verdadera y utilizar Cluster conforme a la ley.", "Conservas la propiedad de tu contenido y autorizas su procesamiento para generar, alojar y publicar el sitio.", "El servicio puede cambiar o suspenderse para proteger su seguridad y funcionamiento."],
    privacy: ["Procesamos datos de cuenta, proyectos, contactos recibidos y datos técnicos necesarios para operar la plataforma.", "Usamos estos datos para autenticar usuarios, generar sitios, prestar hosting, procesar pagos y prevenir abuso.", "No vendemos datos personales. Los proveedores técnicos reciben únicamente lo necesario para prestar el servicio."],
    cookies: ["Usamos cookies de sesión indispensables para mantener el acceso y asociar borradores temporales.", "El almacenamiento del navegador conserva temporalmente los datos del constructor antes de generar el proyecto.", "No se requieren cookies publicitarias para utilizar el constructor."],
    "refund-policy": ["Puedes cancelar la renovación desde el portal de facturación.", "Las solicitudes de reembolso se revisan según el servicio consumido y la legislación aplicable.", "La cancelación no elimina inmediatamente los proyectos, pero las funciones Pro dejan de estar disponibles al terminar el periodo pagado."],
    "acceptable-use": ["No publiques contenido ilegal, engañoso, malicioso o que infrinja derechos de terceros.", "No uses Cluster para distribuir malware, phishing, spam o recopilar información sin consentimiento.", "Podemos suspender sitios que comprometan usuarios, infraestructura o proveedores."],
  };
  return <section className="px-5 py-16 sm:px-8"><article className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-7 sm:p-10"><div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-[#a078ff]" /><p className="text-sm text-muted-foreground">Última actualización: 28 de junio de 2026</p></div><div className="mt-8 space-y-6">{content[slug].map((paragraph) => <p key={paragraph} className="leading-7 text-[#cbc3d7]">{paragraph}</p>)}</div><p className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">Estas políticas son una base operativa y deben revisarse jurídicamente antes del lanzamiento comercial definitivo.</p></article></section>;
}
