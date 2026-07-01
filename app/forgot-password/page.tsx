"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthFrame, authButtonClass, authInputClass } from "@/components/auth/AuthFrame";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState(""); const [devUrl, setDevUrl] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    const email = new FormData(event.currentTarget).get("email");
    const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await response.json().catch(() => null); setLoading(false);
    setMessage(response.ok ? "Si existe una cuenta, enviamos un enlace válido durante 30 minutos." : data?.error || "No se pudo procesar la solicitud.");
    setDevUrl(data?.devResetUrl || "");
  }
  return <AuthFrame title="Recupera tu acceso" description="Te enviaremos un enlace seguro para crear una contraseña nueva.">
    <form onSubmit={submit} className="space-y-5"><label className="block"><span className="mb-2 block text-sm font-semibold">Correo</span><input name="email" type="email" required autoComplete="email" className={authInputClass} /></label>
      {message && <p aria-live="polite" className="rounded-lg border border-[#3d3549] bg-[#211a2c] p-3 text-sm leading-6 text-[#d8c8f8]">{message}</p>}
      {devUrl && <Link href={devUrl} className="block text-sm font-semibold text-[#bda6e8] underline">Abrir enlace de desarrollo</Link>}
      <button disabled={loading} className={authButtonClass}>{loading ? "Enviando…" : "Enviar enlace"}</button>
      <p className="text-center text-sm"><Link href="/login" className="text-[#bda6e8]">Volver al login</Link></p>
    </form>
  </AuthFrame>;
}
