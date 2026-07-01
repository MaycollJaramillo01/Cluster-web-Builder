"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthFrame, authButtonClass, authInputClass } from "@/components/auth/AuthFrame";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password"), acceptTerms: form.get("acceptTerms") === "on" }) });
    const data = await response.json().catch(() => null);
    setLoading(false);
    if (!response.ok) return setError(data?.error || "No se pudo crear la cuenta.");
    const from = params.get("from");
    router.push(from?.startsWith("/") && !from.startsWith("//") ? from : "/dashboard");
    router.refresh();
  }
  return <form onSubmit={submit} className="space-y-5">
    <Field label="Nombre"><input name="name" required minLength={2} maxLength={100} autoComplete="name" className={authInputClass} /></Field>
    <Field label="Correo"><input name="email" required type="email" maxLength={160} autoComplete="email" className={authInputClass} /></Field>
    <Field label="Contraseña" hint="10 caracteres, mayúscula, minúscula y número"><input name="password" required type="password" minLength={10} maxLength={128} autoComplete="new-password" className={authInputClass} /></Field>
    <label className="flex gap-3 text-sm leading-6 text-[#c5b9d2]"><input name="acceptTerms" required type="checkbox" className="mt-1 h-5 w-5 accent-[#8b5cf6]" /><span>Acepto los <Link href="/terms" className="underline">términos</Link> y la <Link href="/privacy" className="underline">política de privacidad</Link>.</span></label>
    {error && <p role="alert" className="rounded-lg border border-red-900/60 bg-red-950/60 p-3 text-sm text-red-200">{error}</p>}
    <button disabled={loading} className={authButtonClass}>{loading ? "Creando cuenta…" : "Crear mi cuenta"}</button>
    <p className="text-center text-sm text-[#9d8fb5]">¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-[#bda6e8]">Inicia sesión</Link></p>
  </form>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span>{children}{hint && <span className="mt-1.5 block text-xs text-[#7a6d8e]">{hint}</span>}</label>; }

export default function RegisterPage() { return <AuthFrame title="Crea tu cuenta" description="Conserva tu borrador y continúa cuando quieras."><Suspense><RegisterForm /></Suspense></AuthFrame>; }
