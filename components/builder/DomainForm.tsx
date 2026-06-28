"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DomainForm({ siteId, initialDomain, verified }: { siteId: string; initialDomain: string; verified: boolean }) {
  const [domain, setDomain] = useState(initialDomain);
  const [status, setStatus] = useState(verified ? "Dominio activo con SSL." : initialDomain ? "Pendiente de verificación DNS." : "");
  const [loading, setLoading] = useState(false);

  async function request(method: "PUT" | "POST" | "DELETE") {
    setLoading(true);
    const response = await fetch(`/api/sites/${siteId}/domain`, { method, headers: { "Content-Type": "application/json" }, body: method === "PUT" ? JSON.stringify({ domain }) : undefined });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setStatus(data.error || "No se pudo actualizar el dominio.");
    if (method === "DELETE") { setDomain(""); return setStatus("Dominio eliminado."); }
    setStatus(data.verified ? "Dominio activo con SSL." : data.providerConfigured ? "Dominio agregado. Configura el DNS indicado por Vercel y vuelve a verificar." : "Vercel no está configurado en el servidor; el dominio quedó pendiente.");
  }

  return <div className="mt-8 space-y-4">
    <label htmlFor="custom-domain" className="block text-sm font-medium">Dominio</label>
    <Input id="custom-domain" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="www.minegocio.com" />
    <p className="text-xs text-muted-foreground">Usa CNAME para subdominios o el registro A indicado por Vercel para el dominio raíz.</p>
    <div className="flex flex-wrap gap-3">
      <Button disabled={loading || !domain} onClick={() => void request("PUT")}>Guardar dominio</Button>
      {domain && <Button variant="outline" disabled={loading} onClick={() => void request("POST")}>Verificar DNS</Button>}
      {domain && <Button variant="outline" disabled={loading} onClick={() => void request("DELETE")}>Eliminar</Button>}
    </div>
    {status && <p role="status" className="rounded border border-border bg-card p-3 text-sm">{status}</p>}
  </div>;
}
