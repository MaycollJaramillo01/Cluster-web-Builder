export const DESIGN_LANGUAGE_IDS = ["bauhaus", "swiss", "editorial", "industrial", "storm"] as const;

export type DesignLanguageId = (typeof DESIGN_LANGUAGE_IDS)[number];

export function isDesignLanguageId(value: unknown): value is DesignLanguageId {
  return DESIGN_LANGUAGE_IDS.includes(value as DesignLanguageId);
}
