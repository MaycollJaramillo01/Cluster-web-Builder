"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthFrame, authButtonClass, authInputClass } from "@/components/auth/AuthFrame";

function ResetForm() {
  const router = useRouter(); const params = useSearchParams(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget); const password = String(form.get("password") || ""); const confirmation = String(form.get("confirmation") || "");
    if (password !== confirmation) { setLoading(false); return setError("Las contraseñas no coinciden."); }
    const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: params.get("token"), password }) });
    const data = await response.json().catch(() => null); setLoading(false);
    if (!response.ok) return setError(data?.error || "No se pudo cambiar la contraseña.");
    router.push("/dashboard"); router.refresh();
  }
  return <form onSubmit={submit} className="space-y-5">
    <label className="block"><span className="mb-2 block text-sm font-semibold">Contraseña nueva</span><input name="password" required type="password" minLength={10} autoComplete="new-password" className={authInputClass} /></label>
    <label className="block"><span className="mb-2 block text-sm font-semibold">Confirmar contraseña</span><input name="confirmation" required type="password" minLength={10} autoComplete="new-password" className={authInputClass} /></label>
    {error && <p role="alert" className="rounded-lg border border-red-900/60 bg-red-950/60 p-3 text-sm text-red-200">{error}</p>}
    <button disabled={loading} className={authButtonClass}>{loading ? "Guardando…" : "Guardar contraseña"}</button>
  </form>;
}

export default function ResetPasswordPage() { return <AuthFrame title="Nueva contraseña" description="El enlace solo puede usarse una vez y vence en 30 minutos."><Suspense><ResetForm /></Suspense></AuthFrame>; }
