import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, CheckCircle2, CircleHelp, Globe2, MessageSquareText, PencilLine, Rocket, ShieldCheck } from "lucide-react";

import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { PricingShowcasePage } from "@/components/marketing/PricingShowcasePage";
import { Button } from "@/components/ui/button";

const pages = {
  domains: { title: "Tu dominio, conectado sin complicaciones", description: "Publica primero con un enlace gratuito y conecta tu dominio cuando estés listo." },
  pricing: { title: "Empieza gratis. Mejora cuando lo necesites.", description: "Prueba el constructor sin tarjeta. Cluster Pro reúne dominio, hosting y mayor capacidad de IA en un solo plan." },
  help: { title: "Cómo funciona Cluster", description: "Crea el primer borrador, elige un diseño y publica cuando el sitio represente a tu negocio." },
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
  if (slug === "help") return <MarketingChrome><Help /></MarketingChrome>;
  if (slug === "pricing") return <MarketingChrome><Pricing /></MarketingChrome>;
  return <MarketingChrome><main><Hero title={page.title} description={page.description} />{renderPage(slug)}</main></MarketingChrome>;
}

function Hero({ title, description }: { title: string; description: string }) {
  return <section className="border-b border-border px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto max-w-5xl text-center"><h1 className="font-[var(--font-outfit)] text-4xl font-semibold tracking-[-.04em] sm:text-6xl">{title}</h1><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{description}</p></div></section>;
}

function renderPage(slug: Exclude<Slug, "help" | "pricing">) {
  if (slug === "domains") return <Domains />;
  return <Legal slug={slug} />;
}

function Domains() {
  return <section className="px-5 py-16 sm:px-8"><div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">{[
    ["1", "Publica gratis", "Obtén primero una URL pública de Cluster."],
    ["2", "Conecta tu dominio", "Agrega el dominio desde el editor con Cluster Pro."],
    ["3", "Activa DNS y SSL", "La verificación y el certificado se gestionan automáticamente."],
  ].map(([step, title, copy]) => <article key={step} className="rounded-xl border border-border bg-card p-6"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2c2141] font-bold text-[#d0bcff]">{step}</span><h2 className="mt-5 text-xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></article>)}</div><div className="mt-10 text-center"><Button asChild size="lg"><Link href="/builder"><Globe2 /> Crear sitio primero</Link></Button><p className="mt-3 text-xs text-muted-foreground">Cluster todavía no vende ni transfiere dominios; actualmente permite conectarlos.</p></div></section>;
}

function Pricing() {
  return <PricingShowcasePage />;
}

function Help() {
  const questions = [
    ["¿Puedo probar sin registrarme?", "Sí. Solo pedimos acceso cuando guardas mejoras, publicas o descargas."],
    ["¿Cómo cambio el diseño?", "Abre el editor y ajusta secciones, bloques, colores y tipografía."],
    ["¿Cómo publico?", "Guarda los cambios e inicia sesión al usar Publicar."],
    ["¿Dónde llegan los formularios?", "Los contactos aparecen en la sección Contactos de cada proyecto."],
    ["¿Puedo usar mi dominio?", "Sí, con Cluster Pro desde la opción Dominio del proyecto."],
    ["¿Puedo descargar el sitio?", "Sí. La descarga entrega un ZIP estático desde el editor."],
  ];
  const steps = [
    { number: "01", icon: MessageSquareText, title: "Cuéntanos qué necesitas", copy: "Escribe una idea breve o completa la guía con los datos reales de tu negocio." },
    { number: "02", icon: PencilLine, title: "Recibe una base editable", copy: "Cluster compone el sitio desde bloques y lo abre directamente en el editor visual." },
    { number: "03", icon: Rocket, title: "Edita y publica", copy: "Ajusta contenido, colores y secciones. Inicia sesión solo cuando quieras guardar, descargar o publicar." },
  ];

  return <main>
    <section className="relative overflow-hidden border-b border-border px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_18%,rgb(139_92_246/0.2),transparent_28rem)]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,.8fr)] lg:items-center">
        <div>
          <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#8b5cf6]/40 bg-[#8b5cf6]/10 px-3 text-sm font-semibold text-[#d0bcff]">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Sin registro para empezar
          </div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#a078ff]">Cómo funciona Cluster</p>
          <h1 className="mt-4 max-w-4xl font-[var(--font-outfit)] text-5xl font-semibold leading-[0.96] tracking-[-0.055em] text-[#f7f2fb] sm:text-7xl">
            De una idea a un sitio que ya puedes usar.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#b8afc2] sm:text-lg sm:leading-8">
            No empiezas frente a un lienzo vacío. Cluster convierte la información de tu negocio en diseños completos, editables y listos para publicar.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg"><Link href="/builder">Crear mi sitio <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/para-negocios">Ver qué incluye <CheckCircle2 /></Link></Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-4 rounded-[2rem] bg-[#8b5cf6]/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-[#554a61] bg-[#15121b] shadow-[0_32px_90px_rgb(0_0_0/0.4)]">
            <div className="flex items-center justify-between border-b border-[#3e3747] bg-[#1d1a23] px-5 py-4">
              <div className="flex gap-1.5" aria-hidden="true"><span className="h-2.5 w-2.5 rounded-full bg-[#6d6477]" /><span className="h-2.5 w-2.5 rounded-full bg-[#6d6477]" /><span className="h-2.5 w-2.5 rounded-full bg-[#a078ff]" /></div>
              <span className="text-xs font-semibold text-[#aca2b8]">Nuevo proyecto</span>
            </div>
            <div className="p-5 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9d7cff]">Tu brief</p>
              <div className="mt-3 rounded-xl border border-[#51475e] bg-[#0f0d15] p-4 text-sm leading-6 text-[#ded6e5]">
                “Sitio web para un restaurante familiar con menú, reservas y un estilo cálido.”
              </div>
              <div className="mt-6 space-y-2.5">
                {[
                  ["Contenido organizado", "Listo"],
                  ["6 composiciones para elegir", "Listo"],
                  ["Formulario y contacto", "Activo"],
                ].map(([label, state]) => <div key={label} className="flex min-h-12 items-center justify-between gap-4 rounded-lg border border-[#3d3546] bg-[#211d27] px-4">
                  <span className="flex items-center gap-3 text-sm text-[#d8d0df]"><Check className="h-4 w-4 text-[#72dca8]" aria-hidden="true" />{label}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8ce8b9]">{state}</span>
                </div>)}
              </div>
              <div className="mt-5 flex min-h-12 items-center justify-between rounded-lg bg-[#8b5cf6] px-4 text-sm font-bold text-white">
                Abrir diseños <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="bg-[#f3f0f7] px-5 py-20 text-[#17131c] sm:px-8 sm:py-28" aria-labelledby="workflow-title">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 border-b border-[#d0c9d7] pb-10 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7047bd]">Un recorrido claro</p><h2 id="workflow-title" className="mt-4 max-w-3xl font-[var(--font-outfit)] text-4xl font-semibold leading-[1] tracking-[-0.045em] sm:text-6xl">Tres decisiones. Ningún lienzo vacío.</h2></div>
          <p className="max-w-xl text-base leading-7 text-[#625a68] lg:justify-self-end">Cada etapa entrega algo utilizable. Puedes revisar el contenido, comparar composiciones y entrar al editor antes de crear una cuenta.</p>
        </div>
        <div className="mt-10 grid border border-[#cec7d4] bg-[#cec7d4] gap-px lg:grid-cols-3">
          {steps.map(({ number, icon: Icon, title, copy }, index) => <article key={number} className={`min-h-[22rem] p-7 sm:p-9 ${index === 1 ? "bg-[#21192c] text-white" : "bg-[#faf8fc]"}`}>
            <div className="flex items-center justify-between"><span className={`font-mono text-sm ${index === 1 ? "text-[#b89cff]" : "text-[#7047bd]"}`}>{number} / 03</span><Icon className={`h-6 w-6 ${index === 1 ? "text-[#b89cff]" : "text-[#7047bd]"}`} aria-hidden="true" /></div>
            <h3 className="mt-20 font-[var(--font-outfit)] text-3xl font-semibold leading-tight tracking-[-0.035em]">{title}</h3>
            <p className={`mt-4 max-w-sm text-sm leading-6 ${index === 1 ? "text-[#c8bdcf]" : "text-[#655d6b]"}`}>{copy}</p>
          </article>)}
        </div>
      </div>
    </section>

    <section className="border-b border-border bg-[#0f0d15] px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div className="relative order-2 lg:order-1">
          <div className="rounded-2xl border border-[#493e56] bg-[#17131d] p-4 shadow-[0_24px_70px_rgb(0_0_0/0.35)] sm:p-6">
            <div className="flex items-center justify-between border-b border-[#3a3242] pb-4"><span className="flex items-center gap-2 text-sm font-semibold"><PencilLine className="h-4 w-4 text-[#a078ff]" /> Editor visual</span><span className="text-xs text-[#8ce8b9]">Cambios guardados</span></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {["Portada dividida", "Editorial", "Inmersivo", "Catálogo", "Negocio local", "Minimal"].map((item, index) => <div key={item} className={`min-h-24 rounded-lg border p-4 ${index === 2 ? "border-[#8b5cf6] bg-[#2b1d42]" : "border-[#403747] bg-[#201b26]"}`}><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9f91aa]">Diseño {index + 1}</span><p className="mt-5 text-sm font-semibold text-[#eee8f2]">{item}</p></div>)}
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a078ff]">Tú mantienes el control</p>
          <h2 className="mt-4 max-w-2xl font-[var(--font-outfit)] text-4xl font-semibold leading-[1] tracking-[-0.045em] text-white sm:text-6xl">La IA prepara. Tú decides qué se publica.</h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#b8afc2]">Cambia textos, orden, imágenes y paleta desde el editor. El formulario queda conectado a tu panel y las redes sociales abren los perfiles reales del negocio.</p>
          <ul className="mt-8 grid gap-3 text-sm text-[#d8d0df] sm:grid-cols-2">{["Vista previa antes de publicar", "Paleta respetada", "Contactos en un solo panel", "Descarga del código en ZIP"].map((item) => <li key={item} className="flex min-h-11 items-center gap-3 border-t border-[#3d3545] pt-3"><Check className="h-4 w-4 text-[#8ce8b9]" />{item}</li>)}</ul>
        </div>
      </div>
    </section>

    <section className="bg-[#15121b] px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="faq-title">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[22rem_1fr]">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a078ff]">Antes de empezar</p><h2 id="faq-title" className="mt-4 font-[var(--font-outfit)] text-4xl font-semibold tracking-[-0.04em] text-white">Preguntas concretas.</h2><p className="mt-4 text-sm leading-6 text-[#a99fae]">Lo necesario para probar el producto sin sorpresas.</p></div>
        <div className="border-t border-[#4a4251]">{questions.map(([question, answer], index) => <details key={question} className="group border-b border-[#4a4251] py-2">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-3 font-semibold text-[#eee8f2]"><span className="flex items-center gap-4"><span className="font-mono text-xs text-[#8f7d9c]">{String(index + 1).padStart(2, "0")}</span>{question}</span><CircleHelp className="h-5 w-5 shrink-0 text-[#a078ff] transition-transform duration-200 group-open:rotate-45" /></summary>
          <p className="max-w-2xl pb-5 pl-10 text-sm leading-7 text-[#b2a8bb]">{answer}</p>
        </details>)}</div>
      </div>
    </section>

    <section className="bg-[#8b5cf6] px-5 py-16 text-white sm:px-8 sm:py-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-7 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Tu primera versión empieza aquí</p><h2 className="mt-3 max-w-3xl font-[var(--font-outfit)] text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Describe el negocio. Compara. Publica.</h2></div><Button asChild size="lg" variant="secondary" className="min-h-12 shrink-0"><Link href="/builder">Crear mi sitio <ArrowRight /></Link></Button></div>
    </section>
  </main>;
}

function Legal({ slug }: { slug: Exclude<Slug, "domains" | "pricing" | "help"> }) {
  const content: Record<string, string[]> = {
    terms: ["Debes proporcionar información verdadera y utilizar Cluster conforme a la ley.", "Conservas la propiedad de tu contenido y autorizas su procesamiento para generar, alojar y publicar el sitio.", "El servicio puede cambiar o suspenderse para proteger su seguridad y funcionamiento."],
    privacy: ["Procesamos datos de cuenta, proyectos, contactos recibidos y datos técnicos necesarios para operar la plataforma.", "Usamos estos datos para autenticar usuarios, generar sitios, prestar hosting, procesar pagos y prevenir abuso.", "No vendemos datos personales. Los proveedores técnicos reciben únicamente lo necesario para prestar el servicio."],
    cookies: ["Usamos cookies de sesión indispensables para mantener el acceso y asociar borradores temporales.", "El almacenamiento del navegador conserva temporalmente los datos del constructor antes de generar el proyecto.", "No se requieren cookies publicitarias para utilizar el constructor."],
    "refund-policy": ["Puedes cancelar la renovación desde el portal de facturación.", "Las solicitudes de reembolso se revisan según el servicio consumido y la legislación aplicable.", "La cancelación no elimina inmediatamente los proyectos, pero las funciones Pro dejan de estar disponibles al terminar el periodo pagado."],
    "acceptable-use": ["No publiques contenido ilegal, engañoso, malicioso o que infrinja derechos de terceros.", "No uses Cluster para distribuir malware, phishing, spam o recopilar información sin consentimiento.", "Podemos suspender sitios que comprometan usuarios, infraestructura o proveedores."],
  };
  return <section className="px-5 py-16 sm:px-8"><article className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-7 sm:p-10"><div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-[#a078ff]" /><p className="text-sm text-muted-foreground">Última actualización: 28 de junio de 2026</p></div><div className="mt-8 space-y-6">{content[slug].map((paragraph) => <p key={paragraph} className="leading-7 text-[#cbc3d7]">{paragraph}</p>)}</div><p className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">Estas políticas son una base operativa y deben revisarse jurídicamente antes del lanzamiento comercial definitivo.</p></article></section>;
}
