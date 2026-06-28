"use client";

import { useState } from "react";
import type { BlockProps } from "./types";
import { getThemeSurface } from "@/lib/site/theme-surface";
import { getContrastText } from "@/lib/site/theme-surface";

export function ContactBlock({ section, theme, preset, site }: BlockProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const surface = getThemeSurface(theme);
  const fieldPrefix = `contact-${section.id}`;
  const inputRadius = preset.buttonRadius === "9999px" ? "0.5rem" : "var(--site-btn-radius)";

  const inputStyle = {
    borderRadius: inputRadius,
    border: `1px solid ${theme.text}22`,
    backgroundColor: `${theme.background}`,
    color: theme.text,
    outline: "none",
  };

  const labelStyle = {
    color: surface.muted,
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!site.publicSlug) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    const form = event.currentTarget;
    try {
      const response = await fetch(`/api/public/sites/${site.publicSlug}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (!response.ok) throw new Error();
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="px-6 py-20 sm:py-24" style={{ backgroundColor: surface.section }}>
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">

        {/* Left: info */}
        <div>
          {section.title && (
            <h2
              className="text-3xl font-bold sm:text-4xl"
              style={{
                color: theme.text,
                fontFamily: "var(--site-heading)",
                fontWeight: preset.headingWeight,
                textTransform: preset.uppercaseHeadings ? "uppercase" : "none",
              }}
            >
              {section.title}
            </h2>
          )}
          {section.body && (
            <p className="mt-4 leading-relaxed" style={{ color: surface.muted }}>
              {section.body}
            </p>
          )}

          {/* Contact details */}
          {(site.phone || site.email || site.location) && (
            <ul className="mt-8 space-y-4">
              {site.phone && (
                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: `${theme.primary}18`,
                      color: theme.primary,
                      borderRadius: "var(--site-radius)",
                    }}
                  >
                    T
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: theme.primary }}>
                      Teléfono
                    </p>
                    <a
                      href={`tel:${site.phone}`}
                      className="mt-0.5 text-sm transition-opacity hover:opacity-80"
                      style={{ color: theme.text }}
                    >
                      {site.phone}
                    </a>
                  </div>
                </li>
              )}
              {site.email && (
                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: `${theme.primary}18`,
                      color: theme.primary,
                      borderRadius: "var(--site-radius)",
                    }}
                  >
                    @
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: theme.primary }}>
                      Email
                    </p>
                    <a
                      href={`mailto:${site.email}`}
                      className="mt-0.5 text-sm transition-opacity hover:opacity-80"
                      style={{ color: theme.text }}
                    >
                      {site.email}
                    </a>
                  </div>
                </li>
              )}
              {site.location && (
                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: `${theme.primary}18`,
                      color: theme.primary,
                      borderRadius: "var(--site-radius)",
                    }}
                  >
                    ↗
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: theme.primary }}>
                      Ubicación
                    </p>
                    <p className="mt-0.5 text-sm" style={{ color: theme.text }}>
                      {site.location}
                    </p>
                  </div>
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Right: form */}
        <form
          onSubmit={submit}
          className={`space-y-5 p-7 sm:p-8 ${preset.cardShadow}`}
          style={{
            borderRadius: "var(--site-radius)",
            backgroundColor: surface.panel,
            border: `1px solid ${theme.text}10`,
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`${fieldPrefix}-name`}
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
                style={labelStyle}
              >
                Nombre
              </label>
              <input
                id={`${fieldPrefix}-name`}
                name="name"
                required
                maxLength={120}
                autoComplete="name"
                placeholder="Tu nombre"
                className="w-full px-3.5 py-2.5 text-sm transition-[border-color] focus:outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label
                htmlFor={`${fieldPrefix}-email`}
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
                style={labelStyle}
              >
                Email
              </label>
              <input
                id={`${fieldPrefix}-email`}
                name="email"
                type="email"
                required
                maxLength={160}
                autoComplete="email"
                placeholder="tu@email.com"
                className="w-full px-3.5 py-2.5 text-sm transition-[border-color] focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor={`${fieldPrefix}-phone`}
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
              style={labelStyle}
            >
              Teléfono <span className="normal-case font-normal opacity-60">(opcional)</span>
            </label>
            <input
              id={`${fieldPrefix}-phone`}
              name="phone"
              type="tel"
              maxLength={40}
              autoComplete="tel"
              placeholder="+52 55 1234 5678"
              className="w-full px-3.5 py-2.5 text-sm transition-[border-color] focus:outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor={`${fieldPrefix}-message`}
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
              style={labelStyle}
            >
              Mensaje
            </label>
            <textarea
              id={`${fieldPrefix}-message`}
              name="message"
              required
              maxLength={2000}
              rows={4}
              placeholder="¿En qué podemos ayudarte?"
              className="w-full resize-none px-3.5 py-2.5 text-sm transition-[border-color] focus:outline-none"
              style={inputStyle}
            />
          </div>

          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full py-3 text-sm font-semibold transition-[filter,opacity] duration-200 hover:brightness-95 active:opacity-90"
            style={{
              backgroundColor: theme.primary,
              color: getContrastText(theme.primary),
              borderRadius: inputRadius,
            }}
          >
            {status === "sending" ? "Enviando..." : section.ctaText || "Enviar mensaje"}
          </button>

          <p className="text-center text-xs" style={{ color: surface.muted, opacity: 0.6 }}>
            {status === "sent"
              ? "Mensaje enviado correctamente."
              : status === "error"
                ? site.publicSlug
                  ? "No se pudo enviar. Intenta de nuevo."
                  : "El formulario estará disponible al publicar."
                : "Responderemos a la brevedad posible."}
          </p>
        </form>
      </div>
    </section>
  );
}
