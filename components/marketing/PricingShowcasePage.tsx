import Link from "next/link";
import { BadgeCheck, Check, CreditCard, LockKeyhole, Palette, Sparkles, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

const included = ["Sitio generado con IA", "Hasta seis diseños para elegir", "Editor visual", "Formulario de contactos", "Subdominio público", "SEO y Open Graph"];
const pro = ["Dominio personalizado y SSL", "Hosting administrado", "100 generaciones por hora", "Sin marca Cluster", "Descarga ZIP", "Portal de facturación"];

export function PricingShowcasePage() {
  return <main>
    <section className="relative overflow-hidden border-b border-border px-5 py-16 sm:px-8 sm:py-24"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgb(139_92_246/0.22),transparent_34rem)]" /><div className="relative mx-auto max-w-5xl text-center"><div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#8b5cf6]/40 bg-[#8b5cf6]/10 px-3 text-sm font-semibold text-[#d0bcff]"><Sparkles className="h-4 w-4" /> Empieza sin tarjeta</div><h1 className="mt-7 font-[var(--font-outfit)] text-5xl font-semibold leading-[.96] tracking-[-.055em] text-white sm:text-7xl">Crea gratis.<br />Paga cuando estés listo.</h1><p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#b8afc2] sm:text-lg">Construye y revisa el sitio antes de contratar. Cluster Pro se activa cuando necesitas dominio, hosting y mayor capacidad.</p></div></section>

    <section className="bg-[#f4f2f7] px-5 py-16 text-[#16121b] sm:px-8 sm:py-24"><div className="mx-auto max-w-5xl">
      <div className="overflow-hidden rounded-3xl border border-[#d6d0dc] bg-white shadow-[0_28px_90px_rgb(45_28_58/.12)]">
        <div className="border-b border-[#ddd7e2] bg-[#faf9fb] p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#665b6f]">Todo proyecto incluye</p><div className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">{included.map((item) => <p key={item} className="flex items-center gap-3 text-sm"><Check className="h-4 w-4 shrink-0 text-[#6d35db]" />{item}</p>)}</div></div>
        <div className="p-5 sm:p-8"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#efe9ff] text-[#6d35db]"><CreditCard className="h-5 w-5" /></span><div><h2 className="font-[var(--font-outfit)] text-xl font-semibold">Elige cuándo mejorar</h2><p className="mt-1 text-sm text-[#706776]">Sin cargos durante la creación. El importe vigente aparece antes de confirmar.</p></div></div>
          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            <article className="flex min-h-[22rem] flex-col rounded-2xl border border-[#d9d3df] bg-white p-6"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#6b6270]">Gratis</p><p className="mt-4 font-[var(--font-outfit)] text-5xl font-semibold tracking-[-.05em]">$0</p><p className="mt-2 text-sm text-[#706776]">Para crear, editar y revisar el proyecto.</p><ul className="mt-6 space-y-3 text-sm">{["Generador y editor", "Vista previa completa", "Paleta personalizada"].map((item) => <li key={item} className="flex gap-2"><Check className="h-4 w-4 text-[#6d35db]" />{item}</li>)}</ul><Button asChild variant="outline" className="mt-auto w-full"><Link href="/builder">Empezar gratis</Link></Button></article>
            <article className="relative flex min-h-[22rem] flex-col rounded-2xl border-2 border-[#7447e8] bg-[#f8f5ff] p-6 shadow-[0_0_0_4px_rgb(116_71_232/.08)]"><span className="absolute right-5 top-5 rounded-full bg-[#e9e0ff] px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#6330c4]">Para publicar</span><p className="text-xs font-bold uppercase tracking-[.15em] text-[#6330c4]">Cluster Pro</p><p className="mt-4 font-[var(--font-outfit)] text-4xl font-semibold tracking-[-.045em]">Precio en checkout</p><p className="mt-2 text-sm text-[#706776]">Stripe muestra el importe y la periodicidad antes de cobrar.</p><ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-1">{pro.map((item) => <li key={item} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-[#6d35db]" />{item}</li>)}</ul><Button asChild className="mt-auto w-full"><Link href="/billing">Ver precio y activar</Link></Button></article>
          </div>
          <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-[#e0dae5] pt-5 text-xs text-[#706776] sm:flex-row"><span className="flex items-center gap-2"><LockKeyhole className="h-4 w-4" /> Pago seguro administrado por Stripe</span><span>Sin importes inventados ni cargos antes de confirmar</span></div>
        </div>
      </div>

      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[#d5ceda] bg-[#d5ceda] sm:grid-cols-3">{[
        { icon: Zap, title: "Genera antes de pagar", copy: "Comprueba el resultado con tus datos reales." },
        { icon: Palette, title: "Tu diseño se conserva", copy: "La paleta y el contenido siguen siendo tuyos." },
        { icon: BadgeCheck, title: "Mejora sin reconstruir", copy: "Activa Pro sobre el mismo proyecto." },
      ].map(({ icon: Icon, title, copy }) => <article key={title} className="bg-white p-6"><Icon className="h-5 w-5 text-[#6d35db]" /><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#706776]">{copy}</p></article>)}</div>
    </div></section>
  </main>;
}
