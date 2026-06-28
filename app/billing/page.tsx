import Link from "next/link";
import { Check, CreditCard } from "lucide-react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Plan | Cluster Web Builder" };

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/billing");
  const active = user.planStatus === "ACTIVE";
  const configured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
  const success = (await searchParams).success === "1";

  return <main className="min-h-dvh bg-background px-5 py-12 text-foreground">
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard" className="text-sm text-muted-foreground">← Volver al dashboard</Link>
      <div className="mt-8 rounded-xl border border-[#573878] bg-card p-7 sm:p-10">
        <div className="flex items-center gap-3"><CreditCard className="text-[#a078ff]" /><p className="text-sm font-bold uppercase tracking-widest text-[#a078ff]">Un solo plan</p></div>
        <h1 className="mt-4 text-4xl font-semibold">Cluster Pro</h1>
        <p className="mt-3 text-muted-foreground">Todo lo necesario para operar el sitio de tu negocio.</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">{["Dominio personalizado y SSL", "Hosting administrado", "100 generaciones con IA por hora", "Sin marca Cluster"].map((item) => <li key={item} className="flex gap-2"><Check className="h-5 w-5 text-emerald-400" />{item}</li>)}</ul>
        {success && <p className="mt-6 rounded bg-emerald-950 p-3 text-emerald-200">Pago recibido. La activación se confirma automáticamente.</p>}
        <div className="mt-8">
          {active ? <form action="/api/billing/portal" method="post"><Button type="submit">Administrar suscripción</Button></form>
            : <form action="/api/billing/checkout" method="post"><Button type="submit" disabled={!configured}>{configured ? "Activar Cluster Pro" : "Configura Stripe para cobrar"}</Button></form>}
          <p className="mt-3 text-xs text-muted-foreground">Estado: {user.planStatus}</p>
        </div>
      </div>
    </div>
  </main>;
}
