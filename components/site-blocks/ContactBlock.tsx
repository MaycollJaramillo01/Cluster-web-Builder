import type { BlockProps } from "./types";

export function ContactBlock({ section, theme, preset, site }: BlockProps) {
  const inputStyle = { borderRadius: "var(--site-btn-radius)" };
  return (
    <section id="contact" className="px-6 py-20 sm:py-24" style={{ backgroundColor: "#f8fafc" }}>
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
          {section.body && <p className="mt-4 text-slate-600">{section.body}</p>}
          <ul className="mt-7 space-y-4 text-slate-700">
            {site.phone && (
              <li className="flex items-center gap-3">
                <Dot color={theme.primary} />
                <span><strong style={{ color: theme.primary }}>Teléfono:</strong> {site.phone}</span>
              </li>
            )}
            {site.email && (
              <li className="flex items-center gap-3">
                <Dot color={theme.primary} />
                <span><strong style={{ color: theme.primary }}>Email:</strong> {site.email}</span>
              </li>
            )}
            {site.location && (
              <li className="flex items-center gap-3">
                <Dot color={theme.primary} />
                <span><strong style={{ color: theme.primary }}>Ubicación:</strong> {site.location}</span>
              </li>
            )}
          </ul>
        </div>

        {/* Placeholder form — submission is wired in a future phase.
            No event handlers so the block is safe in Server Components. */}
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
            <textarea className="mt-1 w-full border px-3 py-2.5 text-sm" rows={3} placeholder="¿En qué podemos ayudarte?" style={inputStyle} />
          </div>
          <button
            type="button"
            className="w-full py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.01]"
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
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
      style={{ backgroundColor: color }}
    >
      •
    </span>
  );
}
