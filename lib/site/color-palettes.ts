// Paletas de dos tonos: un fondo profundo y un tono claro que hace de acento.
// Cada par esta pensado para usarse junto, no por separado.
//
// Nada las consume todavia salvo los sitios de prueba: viven aqui para que el
// onboarding pueda ofrecerlas sin volver a buscar los codigos.

export type NamedColor = { name: string; hex: string };

export type ColorPalettePair = {
  id: string;
  /** Tono profundo: fondos, pies de pagina y superficies de contraste. */
  deep: NamedColor;
  /** Tono claro: acentos, bandas y superficies que deben resaltar. */
  light: NamedColor;
};

export const COLOR_PALETTE_PAIRS: readonly ColorPalettePair[] = [
  {
    id: "champion-lavender",
    deep: { name: "Champion Blue", hex: "#151130" },
    light: { name: "Lavender Tonic", hex: "#C8BEFA" },
  },
  {
    id: "atlantic-sky",
    deep: { name: "Atlantic Blue", hex: "#0F4B70" },
    light: { name: "Soft Sky Blue", hex: "#C4F8FF" },
  },
  {
    id: "olive-royal",
    deep: { name: "Olive Green", hex: "#202B22" },
    light: { name: "Royal Yellow", hex: "#FFD85F" },
  },
  {
    id: "creole-yellowgreen",
    deep: { name: "Creole Brown", hex: "#1F0E06" },
    light: { name: "Yellow Green Shade", hex: "#C6E385" },
  },
];

export function getColorPalettePair(id: string): ColorPalettePair | null {
  return COLOR_PALETTE_PAIRS.find((pair) => pair.id === id) ?? null;
}
