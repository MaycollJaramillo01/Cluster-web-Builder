import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Globe2, Link2, Megaphone, MousePointerClick, Palette, ShieldCheck, Store, TimerReset } from "lucide-react";

import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Para negocios | Cluster",
  description: "Crea y publica el sitio de tu negocio sin experiencia en diseño, código ni dominios.",
};

const benefits = [
  { icon: Link2, title: "Un enlace para tu negocio", copy: "Publica con una dirección de Cluster y compártela de inmediato. Si luego quieres, conecta tu propio dominio con Cluster Pro." },
  { icon: Globe2, title: "Tu negocio abierto en internet", copy: "Tus servicios, contacto y ubicación quedan disponibles desde teléfono o computadora, a cualquier hora." },
  { icon: Megaphone, title: "Listo para tus anuncios", copy: "Usa el enlace del sitio en campañas de Meta Ads, Google o WhatsApp. Cluster crea el destino; tú decides cómo promocionarlo." },
  { icon: Store, title: "Tu espacio, sin un feed infinito", copy: "La atención está en tu marca. No compites con publicaciones, comentarios o recomendaciones de un algoritmo." },
  { icon: Palette, title: "Tu marca, tu apariencia", copy: "Agrega logo, colores, servicios, redes sociales y descripciones para que el sitio represente al negocio." },
  { icon: TimerReset, title: "Una primera versión en minutos", copy: "No necesitas contratar diseñador ni desarrollador para empezar. Describe, elige, revisa y publica." },
];

export default function BusinessPage() {
  return <MarketingChrome><main>
    <section className="relative overflow-hidden border-b border-border px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgb(139_92_246/0.22),transparent_32rem)]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_30rem] lg:items-center">
        <div>
          <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#8b5cf6]/40 bg-[#8b5cf6]/10 px-3 text-sm font-semibold text-[#d0bcff]"><Store className="h-4 w-4" /> Hecho para pequeños negocios</div>
          <h1 className="mt-7 max-w-5xl font-[var(--font-outfit)] text-5xl font-semibold leading-[.96] tracking-[-.055em] text-white sm:text-7xl">Todo lo que necesitas para vender en internet.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#c0b6c8]">Aunque nunca hayas creado una página. Cluster organiza la información, prepara el diseño y te guía hasta tener un sitio que puedas compartir.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg"><Link href="/builder">Crear mi sitio <ArrowRight /></Link></Button><Button asChild size="lg" variant="outline"><Link href="/help">Ver cómo funciona</Link></Button></div>
          <p className="mt-4 flex items-center gap-2 text-xs text-[#918797]"><ShieldCheck className="h-4 w-4 text-[#8ce8b9]" /> Puedes empezar sin tarjeta y sin registrarte.</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#504657] bg-[#15121b] shadow-[0_30px_90px_rgb(0_0_0/.4)]">
          <div className="border-b border-[#3d3545] bg-[#1e1a24] px-5 py-4"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#a99fad]">Tu parte es sencilla</p></div>
          <div className="p-5 sm:p-6"><div className="rounded-xl border border-[#4a4053] bg-[#0f0d15] p-5"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#9d7cff]">Tú nos cuentas</p><ul className="mt-4 space-y-3 text-sm text-[#ddd5e3]">{["Cómo se llama el negocio", "Qué productos o servicios ofrece", "Cómo pueden contactarte"].map((item) => <li key={item} className="flex gap-3"><MousePointerClick className="h-4 w-4 shrink-0 text-[#a078ff]" />{item}</li>)}</ul></div><div className="my-3 flex justify-center"><ArrowRight className="h-5 w-5 rotate-90 text-[#756b7f]" /></div><div className="rounded-xl bg-[#2a1d40] p-5"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#c3a9ff]">Cluster prepara</p><ul className="mt-4 space-y-3 text-sm text-[#eee7f4]">{["El contenido organizado", "Hasta seis diseños para elegir", "Formulario, redes y enlace público"].map((item) => <li key={item} className="flex gap-3"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#8ce8b9]" />{item}</li>)}</ul></div></div>
        </div>
      </div>
    </section>

    <section className="bg-[#f4f2f7] px-5 py-20 text-[#17131b] sm:px-8 sm:py-28" aria-labelledby="business-benefits-title">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 border-b border-[#d2cbd8] pb-10 lg:grid-cols-2 lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#6d35db]">Lo esencial, ya resuelto</p><h2 id="business-benefits-title" className="mt-4 max-w-3xl font-[var(--font-outfit)] text-4xl font-semibold leading-[1] tracking-[-.045em] sm:text-6xl">Tu negocio en internet, explicado sin tecnicismos.</h2></div><p className="max-w-xl text-base leading-7 text-[#665d6c] lg:justify-self-end">No tienes que aprender diseño web para tomar buenas decisiones. Cada opción dice claramente qué cambia y para qué sirve.</p></div>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-[#d3ccd8] bg-[#d3ccd8] md:grid-cols-2 lg:grid-cols-3">{benefits.map(({ icon: Icon, title, copy }, index) => <article key={title} className={`min-h-[18rem] p-7 sm:p-8 ${index === 2 ? "bg-[#241a31] text-white" : "bg-white"}`}><div className="flex items-center justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-full ${index === 2 ? "bg-[#8b5cf6]" : "bg-[#eee8f5] text-[#6330c4]"}`}><Icon className="h-5 w-5" /></span><span className={`font-mono text-xs ${index === 2 ? "text-[#b9a7c8]" : "text-[#8b818f]"}`}>0{index + 1}</span></div><h3 className="mt-10 font-[var(--font-outfit)] text-2xl font-semibold tracking-[-.03em]">{title}</h3><p className={`mt-3 text-sm leading-6 ${index === 2 ? "text-[#c7bdce]" : "text-[#665d6c]"}`}>{copy}</p></article>)}</div>
        <p className="mt-5 text-xs leading-5 text-[#786f7e]">Cluster no administra ni paga campañas publicitarias. Te entrega un sitio preparado para usar como destino de tus anuncios.</p>
      </div>
    </section>

    <section className="border-y border-border bg-[#0f0d15] px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#a078ff]">No tienes que aprenderlo</p><h2 className="mt-4 font-[var(--font-outfit)] text-4xl font-semibold leading-[1] tracking-[-.045em] text-white sm:text-6xl">Nos ocupamos de la parte técnica.</h2><p className="mt-5 max-w-md text-base leading-7 text-[#aaa0b1]">Tú conoces el negocio. Eso es lo importante.</p></div><div className="border-t border-[#493f51]">{[
        ["Diseño responsive", "El sitio se adapta automáticamente a teléfonos, tablets y computadoras."],
        ["Hosting y seguridad", "Cuando publicas, Cluster mantiene el sitio disponible y protegido."],
        ["Formularios de contacto", "Las consultas llegan al panel del proyecto para que puedas responderlas."],
        ["SEO básico", "El título, la descripción y la información principal quedan preparados para buscadores."],
      ].map(([title, copy], index) => <div key={title} className="grid gap-3 border-b border-[#493f51] py-6 sm:grid-cols-[3rem_13rem_1fr]"><span className="font-mono text-xs text-[#7f7488]">0{index + 1}</span><h3 className="font-semibold text-[#eee8f2]">{title}</h3><p className="text-sm leading-6 text-[#aaa0b1]">{copy}</p></div>)}</div></div>
    </section>

    <section className="bg-[#8b5cf6] px-5 py-16 text-white sm:px-8 sm:py-20"><div className="mx-auto flex max-w-7xl flex-col gap-7 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-white/70">Sin experiencia previa</p><h2 className="mt-3 max-w-3xl font-[var(--font-outfit)] text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Empieza contando qué hace tu negocio.</h2></div><Button asChild size="lg" variant="secondary" className="min-h-12 shrink-0"><Link href="/builder">Crear mi sitio <ArrowRight /></Link></Button></div>
    </section>
  </main></MarketingChrome>;
}
