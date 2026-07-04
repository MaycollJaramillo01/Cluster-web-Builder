"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, ExternalLink, Globe2, ShieldCheck, TimerReset, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dnsRecordsForDomain, type DnsRecord } from "@/lib/site/domain-dns";

type DomainState = "idle" | "pending" | "verified" | "error";

export function DomainForm({ siteId, initialDomain, verified, proAccess }: { siteId: string; initialDomain: string; verified: boolean; proAccess: boolean }) {
  const [domain, setDomain] = useState(initialDomain);
  const [state, setState] = useState<DomainState>(verified ? "verified" : initialDomain ? "pending" : "idle");
  const [records, setRecords] = useState<DnsRecord[]>(initialDomain ? dnsRecordsForDomain(initialDomain, []) : []);
  const [message, setMessage] = useState(verified ? "El dominio está conectado y protegido con SSL." : initialDomain ? "El DNS todavía está pendiente." : "");
  const [loading, setLoading] = useState<"PUT" | "POST" | "DELETE" | null>(null);
  const [copied, setCopied] = useState("");

  if (!proAccess) return <div className="mt-8 rounded-2xl border border-violet-200 bg-violet-50 p-6 text-zinc-900">
    <ShieldCheck className="h-7 w-7 text-violet-700" />
    <h2 className="mt-4 text-xl font-semibold">Conecta tu dominio con Cluster Pro</h2>
    <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600">Tu sitio puede seguir usando el enlace gratuito. El plan Pro permite conectar un dominio comprado en cualquier proveedor e incluye SSL.</p>
    <Button asChild className="mt-5"><Link href={`/billing?from=${encodeURIComponent(`/builder/${siteId}/domain`)}`}>Ver planes</Link></Button>
  </div>;

  async function request(method: "PUT" | "POST" | "DELETE") {
    setLoading(method);
    setMessage("");
    const response = await fetch(`/api/sites/${siteId}/domain`, { method, headers: { "Content-Type": "application/json" }, body: method === "PUT" ? JSON.stringify({ domain }) : undefined });
    const data = await response.json().catch(() => ({})) as { error?: string; domain?: string; verified?: boolean; records?: DnsRecord[]; providerConfigured?: boolean; upgradeRequired?: boolean };
    setLoading(null);
    if (!response.ok) {
      setState("error");
      return setMessage(data.error || "No pudimos actualizar el dominio.");
    }
    if (method === "DELETE") {
      setDomain(""); setRecords([]); setState("idle"); setMessage("Dominio eliminado. El sitio continúa disponible en su enlace gratuito.");
      return;
    }
    const nextDomain = data.domain || domain;
    setDomain(nextDomain);
    setRecords(data.records?.length ? data.records : dnsRecordsForDomain(nextDomain, []));
    if (data.verified) {
      setState("verified");
      setMessage("Dominio conectado. El sitio ya usa HTTPS y está listo para recibir visitas.");
    } else {
      setState("pending");
      setMessage(data.providerConfigured ? "Guarda estos registros donde compraste el dominio y vuelve a verificar." : "La conexión con Vercel no está configurada. El dominio quedó guardado, pero todavía no puede verificarse.");
    }
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(""), 1800);
  }

  return <div className="mt-8 space-y-6">
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <Globe2 className="mt-0.5 h-5 w-5 text-violet-700" />
        <div className="min-w-0 flex-1">
          <label htmlFor="custom-domain" className="block text-sm font-semibold text-zinc-900">Dominio que ya compraste</label>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">Escríbelo sin https, barras ni páginas adicionales.</p>
          <Input id="custom-domain" className="mt-3" value={domain} disabled={state === "verified"} onChange={(event) => setDomain(event.target.value.trim().toLowerCase())} placeholder="www.minegocio.com" autoCapitalize="none" autoCorrect="off" />
          <div className="mt-4 flex flex-wrap gap-3">
            {state !== "verified" && <Button disabled={Boolean(loading) || !domain} onClick={() => void request("PUT")}>{loading === "PUT" ? "Conectando..." : initialDomain ? "Actualizar dominio" : "Conectar dominio"}</Button>}
            {(state === "pending" || state === "error") && <Button variant="outline" disabled={Boolean(loading)} onClick={() => void request("POST")}>{loading === "POST" ? "Verificando..." : "Verificar conexión"}</Button>}
            {domain && <Button variant="outline" className="text-red-700 hover:bg-red-50" disabled={Boolean(loading)} onClick={() => { if (window.confirm("¿Quitar este dominio del sitio?")) void request("DELETE"); }}><Trash2 className="mr-2 h-4 w-4" />Quitar</Button>}
          </div>
        </div>
      </div>
    </section>

    {state !== "idle" && <section className={`rounded-2xl border p-5 ${state === "verified" ? "border-emerald-200 bg-emerald-50" : state === "error" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
      <div className="flex gap-3">
        {state === "verified" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" /> : <TimerReset className={`h-5 w-5 shrink-0 ${state === "error" ? "text-red-700" : "text-amber-700"}`} />}
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">{state === "verified" ? "Dominio activo" : state === "error" ? "Necesita atención" : "Esperando al DNS"}</h2>
          <p role="status" className="mt-1 text-sm leading-relaxed text-zinc-700">{message}</p>
          {state === "verified" && <a className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 underline underline-offset-4" href={`https://${domain}`} target="_blank" rel="noreferrer">Abrir sitio <ExternalLink className="h-4 w-4" /></a>}
        </div>
      </div>
    </section>}

    {state === "pending" && <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-zinc-900">Conecta el dominio en 3 pasos</h2>
      <ol className="mt-4 space-y-5 text-sm text-zinc-700">
        <li><strong className="block text-zinc-900">Abre el panel donde compraste el dominio</strong><span>Busca una opción llamada DNS, registros DNS o zona DNS.</span></li>
        <li><strong className="block text-zinc-900">Copia los registros de abajo</strong><span>Crea un registro por cada fila. Si ya existe uno con el mismo nombre, reemplázalo.</span></li>
        <li><strong className="block text-zinc-900">Vuelve y pulsa Verificar conexión</strong><span>Los cambios suelen aparecer en minutos, pero algunos proveedores pueden tardar hasta 48 horas.</span></li>
      </ol>
      <div className="mt-5 space-y-3">
        {records.map((record) => <div key={`${record.type}-${record.name}-${record.value}`} className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-[90px_1fr_1.7fr]">
          <DnsValue label="Tipo" value={record.type} copied={copied} copy={copy} />
          <DnsValue label="Nombre" value={record.name} copied={copied} copy={copy} />
          <DnsValue label="Valor" value={record.value} copied={copied} copy={copy} />
        </div>)}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-zinc-500">Cluster no vende ni renueva dominios. Solo conecta uno que ya te pertenece.</p>
    </section>}
  </div>;
}

function DnsValue({ label, value, copied, copy }: { label: string; value: string; copied: string; copy: (value: string) => Promise<void> }) {
  return <div className="min-w-0">
    <span className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
    <button type="button" onClick={() => void copy(value)} className="mt-1 flex w-full items-center gap-2 text-left text-sm font-medium text-zinc-900" title={`Copiar ${label.toLowerCase()}`}>
      <code className="min-w-0 flex-1 break-all font-mono text-xs">{value}</code>
      {copied === value ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <Copy className="h-4 w-4 shrink-0 text-zinc-400" />}
    </button>
  </div>;
}
