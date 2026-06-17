import type { SiteTheme } from "@/lib/site/blueprint";
import type { DesignPreset } from "@/lib/site/design";

/** Consistent, preset-aware section heading used across blocks. */
export function SectionHeading({
  title,
  subtitle,
  theme,
  preset,
  align = "center",
  onDark = false,
}: {
  title?: string;
  subtitle?: string;
  theme: SiteTheme;
  preset: DesignPreset;
  align?: "center" | "left";
  onDark?: boolean;
}) {
  if (!title && !subtitle) return null;
  const color = onDark ? "#ffffff" : theme.text;
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      {title && (
        <h2
          className="text-3xl font-bold sm:text-4xl"
          style={{
            color,
            fontFamily: "var(--site-heading)",
            letterSpacing: preset.uppercaseHeadings
              ? "0.04em"
              : "var(--site-tracking)",
            fontWeight: preset.headingWeight,
            textTransform: preset.uppercaseHeadings ? "uppercase" : "none",
          }}
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <p
          className={`${align === "center" ? "mx-auto " : ""}mt-3 max-w-2xl text-lg`}
          style={{ color, opacity: 0.7 }}
        >
          {subtitle}
        </p>
      )}
      {title && (
        <div
          className={`mt-5 h-1 w-14 ${align === "center" ? "mx-auto" : ""}`}
          style={{ backgroundColor: theme.accent, borderRadius: "9999px" }}
        />
      )}
    </div>
  );
}
