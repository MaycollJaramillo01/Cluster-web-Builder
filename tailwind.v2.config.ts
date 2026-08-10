import type { Config } from "tailwindcss";

// Config dedicada al motor de sitios V2 y su biblioteca de bloques.
// No comparte contenido con tailwind.config.ts (que estiliza la app constructora):
// esta hoja se compila una vez en build y se incrusta como string en cada sitio
// generado, así que solo debe contener las clases que el motor V2 realmente usa.
const config: Config = {
  content: ["./lib/site/v2-render.ts", "./lib/site/v2-section-library.ts"],
  corePlugins: {
    preflight: true,
  },
  theme: {
    extend: {
      fontSize: {
        xs: [".75rem", { lineHeight: "1.5" }],
        sm: [".875rem", { lineHeight: "1.5" }],
        md: ["1rem", { lineHeight: "1.65" }],
        lg: ["1.25rem", { lineHeight: "1.5" }],
        xl: ["1.75rem", { lineHeight: "1.3" }],
        "2xl": ["2.5rem", { lineHeight: "1.1" }],
        display: ["clamp(2.8rem,7vw,6rem)", { lineHeight: "1.02" }],
      },
      borderRadius: {
        none: "0",
        sm: ".25rem",
        md: ".75rem",
        lg: "1.5rem",
        pill: "999px",
      },
      spacing: {
        // Tokens de padding/gap del schema (StyleTokensV2), además de la escala numérica normal.
        "t-sm": ".75rem",
        "t-md": "1.5rem",
        "t-lg": "3rem",
        "t-xl": "5rem",
      },
      maxWidth: {
        content: "760px",
        wide: "1200px",
      },
    },
  },
  // Las clases de span de columna se generan por dato (CanvasColumnV2.span, 1-12),
  // no aparecen literalmente en el código fuente en todas sus combinaciones: sin
  // safelist el purgador de Tailwind las eliminaría.
  safelist: [
    { pattern: /^col-span-(1|2|3|4|5|6|7|8|9|10|11|12)$/, variants: ["md", "lg"] },
    { pattern: /^grid-cols-(1|2|3|4|6|12)$/, variants: ["md", "lg"] },
  ],
  plugins: [],
};

export default config;
