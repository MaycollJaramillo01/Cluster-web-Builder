import { getItems } from "@/lib/site/section";
import { getThemeSurface } from "@/lib/site/theme-surface";
import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

function featureBullets(description: string | null | undefined): string[] {
  if (!description) return [];
  const byNewline = description.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  if (byNewline.length > 1) return byNewline;
  const bySemicolon = description.split(/;/).map((s) => s.trim()).filter(Boolean);
  if (bySemicolon.length > 1) return bySemicolon;
  return [description];
}

export function PricingBlock({ section, theme, preset }: BlockProps) {
  const items = getItems(section);
  const surface = getThemeSurface(theme);
  const style = preset.pricingStyle ?? "cards";

  if (items.length === 0) {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-5xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
          {section.body && <p className="mx-auto mt-6 max-w-2xl text-center" style={{ color: surface.muted }}>{section.body}</p>}
        </div>
      </section>
    );
  }

  // ── TABLE: feature comparison grid ───────────────────────────────────────
  if (style === "table") {
    const featured = Math.min(1, items.length - 1);
    return (
      <section className="px-4 py-20 sm:py-24" style={{ backgroundColor: surface.section }}>
        <div className="mx-auto max-w-5xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
          {section.body && <p className="mx-auto mt-4 max-w-2xl text-center" style={{ color: surface.muted }}>{section.body}</p>}
          <div className="mt-12 overflow-x-auto rounded-[var(--site-radius)] border" style={{ borderColor: `${theme.primary}22` }}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ backgroundColor: surface.panel }}>
                  <th className="p-5 text-xs font-bold uppercase tracking-[0.15em]" style={{ color: surface.muted, width: "35%" }}>Plan</th>
                  {items.map((item, i) => (
                    <th key={i} className="p-5 text-center" style={{ backgroundColor: i === featured ? `${theme.primary}12` : undefined }}>
                      <span className="block text-lg font-bold" style={{ color: i === featured ? theme.primary : theme.text, fontFamily: "var(--site-heading)" }}>
                        {String(item.name ?? item.title ?? `Plan ${i + 1}`)}
                      </span>
                      {item.price != null && (
                        <span className="mt-1 block text-2xl font-black" style={{ color: i === featured ? theme.primary : theme.text }}>
                          {String(item.price)}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: `${theme.text}10` }}>
                {items.map((item, i) => {
                  const bullets = featureBullets(String(item.description ?? ""));
                  return bullets.map((feat, fi) => (
                    <tr key={`${i}-${fi}`} style={{ backgroundColor: fi % 2 === 1 ? `${theme.text}04` : undefined }}>
                      <td className="p-4 text-sm" style={{ color: surface.muted }}>{feat}</td>
                      {items.map((_, col) => (
                        <td key={col} className="p-4 text-center" style={{ backgroundColor: col === featured ? `${theme.primary}06` : undefined }}>
                          <span className="text-base font-bold" style={{ color: col === i || col <= i ? theme.primary : `${theme.text}22` }}>
                            {col === i ? "—" : col < i ? "" : "✓"}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ));
                }).flat()}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  }

  // ── LIST: simple price list ───────────────────────────────────────────────
  if (style === "list") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-3xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
          {section.body && <p className="mx-auto mt-4 max-w-2xl text-center" style={{ color: surface.muted }}>{section.body}</p>}
          <div className="mt-12 divide-y" style={{ borderColor: `${theme.text}12` }}>
            {items.map((item, i) => (
              <div key={i} data-motion-item className="flex items-start justify-between gap-6 py-6">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight }}>
                    {String(item.name ?? item.title ?? `Servicio ${i + 1}`)}
                  </h3>
                  {item.description != null && (
                    <p className="mt-1.5 text-sm leading-relaxed" style={{ color: surface.muted }}>{String(item.description)}</p>
                  )}
                </div>
                {item.price != null && (
                  <span className="shrink-0 text-xl font-bold tabular-nums" style={{ color: theme.primary }}>
                    {String(item.price)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── FEATURED: one large plan + smaller row ───────────────────────────────
  if (style === "featured") {
    const [first, ...rest] = items;
    const firstName = String(first?.name ?? first?.title ?? "Plan Principal");
    const firstDesc = String(first?.description ?? "");
    const firstBullets = featureBullets(firstDesc);
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: surface.section }}>
        <div className="mx-auto max-w-5xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
          {section.body && <p className="mx-auto mt-4 max-w-2xl text-center" style={{ color: surface.muted }}>{section.body}</p>}
          {first && (
            <div data-motion-item className={`mt-12 border p-8 sm:p-10 ${preset.cardShadow}`} style={{ borderColor: theme.primary, borderRadius: "var(--site-radius)", backgroundColor: surface.panel }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: theme.primary }}>Mas popular</span>
                  <h3 className="mt-2 text-3xl font-bold" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight }}>
                    {firstName}
                  </h3>
                </div>
                {first.price != null && (
                  <div className="text-right">
                    <span className="block text-4xl font-black tabular-nums" style={{ color: theme.primary }}>{String(first.price)}</span>
                  </div>
                )}
              </div>
              {firstBullets.length > 0 && (
                <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                  {firstBullets.map((feat, fi) => (
                    <li key={fi} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: theme.primary }}>✓</span>
                      <span className="text-sm leading-relaxed" style={{ color: theme.text }}>{feat}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {rest.length > 0 && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((item, i) => {
                const name = String(item.name ?? item.title ?? `Plan ${i + 2}`);
                return (
                  <div key={i} data-motion-item className={`border p-6 ${preset.cardShadow}`} style={{ borderColor: `${theme.text}14`, borderRadius: "var(--site-radius)", backgroundColor: surface.panel }}>
                    <h3 className="font-semibold" style={{ color: theme.text, fontFamily: "var(--site-heading)" }}>{name}</h3>
                    {item.price != null && <p className="mt-2 text-2xl font-bold" style={{ color: theme.primary }}>{String(item.price)}</p>}
                    {item.description != null && <p className="mt-3 text-sm leading-relaxed" style={{ color: surface.muted }}>{String(item.description)}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    );
  }

  // ── MINIMAL: typographic price list ──────────────────────────────────────
  if (style === "minimal") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-4xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
          {section.body && <p className="mx-auto mt-4 max-w-2xl text-center" style={{ color: surface.muted }}>{section.body}</p>}
          <div className="mt-14 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <div key={i} data-motion-item className="border-t-2 pt-6" style={{ borderColor: i === 0 ? theme.primary : `${theme.primary}40` }}>
                {item.price != null && (
                  <p className="text-4xl font-black tabular-nums" style={{ color: theme.primary, fontFamily: "var(--site-heading)" }}>
                    {String(item.price)}
                  </p>
                )}
                <h3 className="mt-3 text-lg font-semibold" style={{ color: theme.text, fontFamily: "var(--site-heading)" }}>
                  {String(item.name ?? item.title ?? `Plan ${i + 1}`)}
                </h3>
                {item.description != null && (
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: surface.muted }}>{String(item.description)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── TIERS: stacked plans with feature bullets ─────────────────────────────
  if (style === "tiers") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.secondary }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={{ ...theme, text: "#fff" }} preset={preset} />
          {section.body && <p className="mx-auto mt-4 max-w-2xl text-center opacity-70 text-white">{section.body}</p>}
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => {
              const name = String(item.name ?? item.title ?? `Plan ${i + 1}`);
              const bullets = featureBullets(String(item.description ?? ""));
              const isHighlighted = i === Math.floor(items.length / 2);
              return (
                <div
                  key={i}
                  data-motion-item
                  className="flex flex-col p-7"
                  style={{
                    backgroundColor: isHighlighted ? theme.primary : "rgba(255,255,255,0.06)",
                    borderRadius: "var(--site-radius)",
                    border: isHighlighted ? "none" : "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: isHighlighted ? "rgba(255,255,255,0.7)" : theme.accent }}>
                    {isHighlighted ? "Mas popular" : `Opcion ${i + 1}`}
                  </p>
                  <h3 className="mt-3 text-2xl font-bold text-white" style={{ fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight }}>
                    {name}
                  </h3>
                  {item.price != null && (
                    <p className="mt-3 text-4xl font-black tabular-nums text-white">{String(item.price)}</p>
                  )}
                  {bullets.length > 0 && (
                    <ul className="mt-8 flex-1 space-y-3">
                      {bullets.map((feat, fi) => (
                        <li key={fi} className="flex items-start gap-3">
                          <span className="mt-0.5 text-sm font-bold" style={{ color: isHighlighted ? "rgba(255,255,255,0.9)" : theme.accent }}>✓</span>
                          <span className="text-sm leading-relaxed" style={{ color: isHighlighted ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.65)" }}>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // ── CARDS (default): 3-column pricing cards ───────────────────────────────
  const featuredIdx = items.findIndex((item) => String(item.name ?? item.title ?? "").toLowerCase().includes("pro") || String(item.name ?? item.title ?? "").toLowerCase().includes("premium")) ?? 1;
  const highlighted = featuredIdx >= 0 ? featuredIdx : Math.min(1, items.length - 1);

  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: surface.section }}>
      <div className="mx-auto max-w-5xl">
        <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
        {section.body && <p className="mx-auto mt-4 max-w-2xl text-center" style={{ color: surface.muted }}>{section.body}</p>}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const isHighlighted = i === highlighted;
            const name = String(item.name ?? item.title ?? `Plan ${i + 1}`);
            const bullets = featureBullets(String(item.description ?? ""));
            return (
              <div
                key={i}
                data-motion-item
                className={`flex flex-col p-7 ${isHighlighted ? "" : preset.cardShadow}`}
                style={{
                  backgroundColor: isHighlighted ? theme.primary : surface.panel,
                  borderRadius: "var(--site-radius)",
                  border: isHighlighted ? "none" : `1px solid ${theme.text}12`,
                  transform: isHighlighted ? "scale(1.02)" : undefined,
                }}
              >
                {isHighlighted && (
                  <span className="mb-4 self-start rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                    Recomendado
                  </span>
                )}
                <h3 className="text-xl font-bold" style={{ color: isHighlighted ? "#fff" : theme.text, fontFamily: "var(--site-heading)" }}>
                  {name}
                </h3>
                {item.price != null && (
                  <p className="mt-3 text-4xl font-black tabular-nums" style={{ color: isHighlighted ? "#fff" : theme.primary }}>
                    {String(item.price)}
                  </p>
                )}
                {bullets.length > 0 ? (
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {bullets.map((feat, fi) => (
                      <li key={fi} className="flex items-start gap-2.5">
                        <span className="mt-0.5 text-sm" style={{ color: isHighlighted ? "rgba(255,255,255,0.75)" : theme.primary }}>✓</span>
                        <span className="text-sm leading-relaxed" style={{ color: isHighlighted ? "rgba(255,255,255,0.85)" : surface.muted }}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                ) : item.description ? (
                  <p className="mt-4 flex-1 text-sm leading-relaxed" style={{ color: isHighlighted ? "rgba(255,255,255,0.8)" : surface.muted }}>{String(item.description)}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
