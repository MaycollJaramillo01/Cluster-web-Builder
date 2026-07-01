"use client";

import Link from "next/link";
import { Layout } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  siteId: string;
  businessName: string;
  phone: string;
  email: string;
  location: string;
  primary: string;
  secondary: string;
  accent: string;
  onBusinessNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onPrimaryChange: (value: string) => void;
  onSecondaryChange: (value: string) => void;
  onAccentChange: (value: string) => void;
};

const fieldClass = "border-border bg-[#120c1d] text-foreground placeholder:text-muted-foreground focus:border-[#8b5cf6] focus:ring-0 transition-colors";

export function EditorDesignPanel(props: Props) {
  return <div className="space-y-8">
    <SettingsGroup title="Negocio">
      <Field label="Nombre del negocio"><Input value={props.businessName} className={fieldClass} onChange={(event) => props.onBusinessNameChange(event.target.value)} /></Field>
      <Field label="Teléfono"><Input value={props.phone} className={fieldClass} placeholder="+52 55 1234 5678" onChange={(event) => props.onPhoneChange(event.target.value)} /></Field>
      <Field label="Email"><Input value={props.email} className={fieldClass} placeholder="hola@negocio.com" onChange={(event) => props.onEmailChange(event.target.value)} /></Field>
      <Field label="Ubicación"><Input value={props.location} className={fieldClass} placeholder="Ciudad, País" onChange={(event) => props.onLocationChange(event.target.value)} /></Field>
    </SettingsGroup>

    <SettingsGroup title="Paleta de colores">
      <p className="mb-4 text-xs text-muted-foreground">Los colores se aplican automáticamente a todo el sitio.</p>
      <ColorField label="Color primario" hint="Textos de acento y headings" value={props.primary} onChange={props.onPrimaryChange} />
      <ColorField label="Color secundario" hint="Fondos oscuros y nav" value={props.secondary} onChange={props.onSecondaryChange} />
      <ColorField label="Color de acento" hint="Botones y elementos destacados" value={props.accent} onChange={props.onAccentChange} />
    </SettingsGroup>

    <SettingsGroup title="Plantilla">
      <p className="mb-4 text-xs leading-5 text-muted-foreground">Cambia la composición sin perder tus textos ni colores.</p>
      <Button asChild variant="outline" className="w-full"><Link href={`/builder/${props.siteId}/templates`}><Layout /> Cambiar plantilla</Link></Button>
    </SettingsGroup>
  </div>;
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <section>
    <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#a078ff]">{title}</h2>
    <div className="space-y-4">{children}</div>
  </section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <Label className="block space-y-1.5 text-xs text-muted-foreground"><span>{label}</span>{children}</Label>;
}

function ColorField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-1.5">
    <div><Label className="text-xs text-muted-foreground">{label}</Label>{hint && <p className="mt-0.5 text-[11px] text-[#5e546b]">{hint}</p>}</div>
    <div className="flex items-center gap-2">
      <input type="color" aria-label={`${label} — selector visual`} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-11 cursor-pointer rounded border border-border bg-[#1d1a23] p-1" />
      <Input value={value} aria-label={`${label} — valor hexadecimal`} onChange={(event) => onChange(event.target.value)} className="h-11 font-mono text-xs" />
    </div>
  </div>;
}
