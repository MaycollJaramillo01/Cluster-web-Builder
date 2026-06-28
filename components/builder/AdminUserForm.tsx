"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminUserForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo crear el usuario.");
      form.reset();
      setMessage("Usuario creado.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear el usuario.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-2">
      <Field label="Usuario"><Input name="username" minLength={3} maxLength={50} required autoComplete="off" /></Field>
      <Field label="Nombre"><Input name="name" maxLength={100} autoComplete="off" /></Field>
      <Field label="Email"><Input name="email" type="email" maxLength={160} autoComplete="off" /></Field>
      <Field label="Contraseña"><Input name="password" type="password" minLength={10} required autoComplete="new-password" /></Field>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium">Rol</span>
        <select name="role" defaultValue="EDITOR" className="flex h-11 w-full rounded border border-input bg-background px-3 text-sm">
          <option value="EDITOR">Editor</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </label>
      <div className="flex items-end gap-3"><Button type="submit" disabled={saving}>{saving ? "Creando…" : "Crear usuario"}</Button></div>
      {message && <p role="status" className="text-sm text-muted-foreground sm:col-span-2">{message}</p>}
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="space-y-1.5 text-sm"><span className="font-medium">{label}</span>{children}</label>;
}
