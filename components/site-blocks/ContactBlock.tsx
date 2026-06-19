import type { BlockProps } from "./types";
import { getThemeSurface } from "@/lib/site/theme-surface";

export function ContactBlock({ section, theme, preset, site }: BlockProps) {
  const inputStyle = { borderRadius: "var(--site-btn-radius)" };
  const surface = getThemeSurface(theme);

  return (
    <section id="contact" className="px-6 py-20 sm:py-24" style={{ backgroundColor: surface.section }}>
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
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
          {section.body && <p className="mt-4" style={{ color: surface.muted }}>{section.body}</p>}
          <ul className="mt-7 space-y-4" style={{ color: surface.muted }}>
            {site.phone && (
              <li className="flex items-start gap-3">
                <Dot color={theme.primary} />
                <span>
                  <strong style={{ color: theme.primary }}>Telefono:</strong> {site.phone}
                </span>
              </li>
            )}
            {site.email && (
              <li className="flex items-start gap-3">
                <Dot color={theme.primary} />
                <span>
                  <strong style={{ color: theme.primary }}>Email:</strong> {site.email}
                </span>
              </li>
            )}
            {site.location && (
              <li className="flex items-start gap-3">
                <Dot color={theme.primary} />
                <span>
                  <strong style={{ color: theme.primary }}>Ubicacion:</strong> {site.location}
                </span>
              </li>
            )}
          </ul>
        </div>

        <form
          className={`space-y-4 border bg-white p-7 ${preset.cardShadow}`}
          style={{ borderRadius: "var(--site-radius)" }}
        >
          <div>
            <label className="text-sm font-medium text-slate-700">Nombre</label>
            <input className="mt-1 w-full border px-3 py-2.5 text-sm" placeholder="Tu nombre" style={inputStyle} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input className="mt-1 w-full border px-3 py-2.5 text-sm" placeholder="tu@email.com" style={inputStyle} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Mensaje</label>
            <textarea className="mt-1 w-full border px-3 py-2.5 text-sm" rows={3} placeholder="En que podemos ayudarte?" style={inputStyle} />
          </div>
          <button
            type="button"
            className="w-full py-3 text-sm font-semibold text-white transition-[filter] duration-200 hover:brightness-95"
            style={{ backgroundColor: theme.primary, borderRadius: "var(--site-btn-radius)" }}
          >
            {section.ctaText || "Enviar"}
          </button>
        </form>
      </div>
    </section>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="mt-2 h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: color }} />;
}
