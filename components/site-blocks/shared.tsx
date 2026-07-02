import type { CSSProperties } from "react";

import type { SiteTheme } from "@/lib/site/blueprint";
import type { DesignPreset } from "@/lib/site/design";

/** Consistent, preset-aware section heading used across blocks. */
export function SectionHeading({
  title,
  subtitle,
  theme,
  preset,
  align,
  onDark = false,
  titleStyle,
  subtitleStyle,
}: {
  title?: string;
  subtitle?: string;
  theme: SiteTheme;
  preset: DesignPreset;
  align?: "center" | "left";
  onDark?: boolean;
  titleStyle?: CSSProperties;
  subtitleStyle?: CSSProperties;
}) {
  if (!title && !subtitle) return null;
  const resolvedAlign = align ?? (["asymmetric", "fullBleed", "grid"].includes(preset.sectionStyle) ? "left" : "center");
  const color = onDark ? "#ffffff" : theme.text;
  return (
    <div className={resolvedAlign === "center" ? "text-center" : "text-left"}>
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
            ...titleStyle,
          }}
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <p
          className={`${resolvedAlign === "center" ? "mx-auto " : ""}mt-3 max-w-2xl text-lg`}
          style={{ color, opacity: 0.7, ...subtitleStyle }}
        >
          {subtitle}
        </p>
      )}
      {title && (
        <div
          className={`mt-5 h-1 ${preset.surfaceStyle === "brutal" ? "w-24" : "w-14"} ${resolvedAlign === "center" ? "mx-auto" : ""}`}
          style={{ backgroundColor: theme.accent, borderRadius: preset.surfaceStyle === "brutal" ? "0" : "9999px" }}
        />
      )}
    </div>
  );
}
