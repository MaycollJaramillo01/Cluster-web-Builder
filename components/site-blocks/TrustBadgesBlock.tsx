import { getItems } from "@/lib/site/section";
import type { BlockProps } from "./types";

export function TrustBadgesBlock({ section, theme }: BlockProps) {
  const items = getItems(section);
  return (
    <section className="px-6 py-14" style={{ backgroundColor: theme.background }}>
      <div className="mx-auto max-w-5xl">
        {section.title && (
          <h2
            className="text-center text-2xl font-bold"
            style={{ color: theme.text, fontFamily: "var(--site-heading)" }}
          >
            {section.title}
          </h2>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {items.map((item, i) => {
            const label = String(item.value ?? item.title ?? item.name ?? "");
            if (!label) return null;
            return (
              <span
                key={i}
                className="border px-5 py-2.5 text-sm font-medium transition-colors"
                style={{
                  borderColor: theme.primary,
                  color: theme.primary,
                  borderRadius: "var(--site-btn-radius)",
                }}
              >
                ✓ {label}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
