export type SocialLinks = Partial<Record<"instagram" | "facebook" | "tiktok" | "linkedin" | "youtube", string>>;
export type NormalizedSocialLinks = Required<SocialLinks>;

const BASE_URLS: Record<keyof SocialLinks, string> = {
  instagram: "https://instagram.com/",
  facebook: "https://facebook.com/",
  tiktok: "https://tiktok.com/@",
  linkedin: "https://linkedin.com/in/",
  youtube: "https://youtube.com/@",
};

export function normalizeSocialLinks(input: SocialLinks | null | undefined): NormalizedSocialLinks {
  const result: NormalizedSocialLinks = { instagram: "", facebook: "", tiktok: "", linkedin: "", youtube: "" };
  for (const platform of Object.keys(BASE_URLS) as Array<keyof SocialLinks>) {
    const value = input?.[platform]?.trim();
    if (!value) continue;
    const candidate = /^https?:\/\//i.test(value)
      ? value
      : value.includes(".com/")
        ? `https://${value.replace(/^\/+/, "")}`
        : `${BASE_URLS[platform]}${value.replace(/^@/, "")}`;
    try {
      const url = new URL(candidate);
      if (url.protocol === "https:" || url.protocol === "http:") result[platform] = url.toString();
    } catch {
      // Invalid social values are omitted instead of creating broken links.
    }
  }
  return result;
}

export function socialLinksFromBlueprint(blueprintJson: unknown): NormalizedSocialLinks {
  const value = blueprintJson as { site?: { socialLinks?: SocialLinks } } | null;
  return normalizeSocialLinks(value?.site?.socialLinks);
}
