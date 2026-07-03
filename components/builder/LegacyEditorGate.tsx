"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LegacyEditorGate({ siteId, published }: { siteId: string; published: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const migrate = async () => {
    setBusy(true); setError("");
    const response = await fetch(`/api/sites/${siteId}/clone-v2`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error || "No se pudo crear la copia V2."); setBusy(false); return; }
    router.push(`/builder/${data.siteId}`);
  };
  return <main className="grid min-h-dvh place-items-center bg-[#0d0a12] p-6 text-white">
    <section className="max-w-xl rounded-2xl border border-[#3b3048] bg-[#17111f] p-8">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-violet-400">Sitio V1 protegido</p>
      <h1 className="mt-3 text-3xl font-semibold">Edita una copia con el constructor V2</h1>
      <p className="mt-4 leading-7 text-[#b9adbf]">{published ? "El sitio publicado seguirá visible y sin cambios mientras editas la nueva versión." : "Crearemos una copia normalizada sin modificar este proyecto original."} Conservaremos textos, imágenes, contacto y SEO.</p>
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      <button onClick={migrate} disabled={busy} className="mt-6 min-h-12 rounded-lg bg-violet-600 px-5 font-semibold disabled:opacity-60">{busy ? "Migrando…" : "Crear copia V2 y editar"}</button>
    </section>
  </main>;
}
