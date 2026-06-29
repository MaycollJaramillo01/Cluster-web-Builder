"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";

import { BrandMark } from "@/components/brand/BrandMark";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") ?? "/dashboard";

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameRef.current?.value ?? "",
          password: passwordRef.current?.value ?? "",
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "No se pudo iniciar sesión.");
        return;
      }

      router.push(from.startsWith("/") && !from.startsWith("//") ? from : "/dashboard");
      router.refresh();
    } catch {
      setError("Error de red. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#0a0812] px-4">
      {/* Grid pattern background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-0 -translate-x-1/2 h-72 w-[600px] rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(139,92,246,0.10)" }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <BrandMark large />
          <div className="text-center">
            <p className="text-lg font-semibold text-white">Cluster</p>
            <p className="text-sm text-[#7a6d8e]">Publica tu sitio</p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-[#2d243d] bg-[#15121b] p-8"
          style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
        >
          <h1 className="mb-1 text-xl font-semibold text-white">
            Iniciar sesión
          </h1>
          <p className="mb-6 text-sm text-[#7a6d8e]">
            Inicia sesión para crear, editar y publicar tus proyectos.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#9d8fb5]"
              >
                Usuario
              </label>
              <input
                id="username"
                ref={usernameRef}
                name="username"
                type="text"
                autoComplete="username"
                autoFocus
                required
                placeholder="tu usuario"
                className="w-full rounded-lg border border-[#2d243d] bg-[#1d1a23] px-4 py-3 text-sm text-white placeholder:text-[#4a3f5a] focus:border-[#8b5cf6] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#9d8fb5]"
              >
                Contraseña
              </label>
              <input
                id="password"
                ref={passwordRef}
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#2d243d] bg-[#1d1a23] px-4 py-3 text-sm text-white placeholder:text-[#4a3f5a] focus:border-[#8b5cf6] focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-900/50 bg-red-950/60 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-[#8b5cf6] py-3 text-sm font-semibold text-white transition-[filter,opacity] duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Verificando…" : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[#4a3f5a]">
          © {new Date().getFullYear()} Cluster Marketing · Acceso privado
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
