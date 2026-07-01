import { prisma } from "@/lib/db";
import { resolveBusinessTypeLabel, type OnboardingInput } from "@/lib/validators/site-onboarding";
import { resolvePalette } from "@/lib/site/design";
import type { GenerationPlan } from "@/lib/site/generation-pipeline";
import type { NormalizedSite } from "@/lib/site/normalize-site-blueprint";
import { createPublicSlug } from "@/lib/site/public-url";
import { normalizeSocialLinks } from "@/lib/site/social-links";
import { applyPageStructure } from "@/lib/site/structure";
import { trackProductEvent } from "@/lib/product-events";

type GuestAccess = { tokenHash: string; expiresAt: Date } | null;

export async function persistGeneratedSite({
  input,
  normalizedSite,
  plan,
  userId,
  guestAccess,
}: {
  input: OnboardingInput;
  normalizedSite: NormalizedSite;
  plan: GenerationPlan;
  userId: string | null;
  guestAccess: GuestAccess;
}) {
  const { blueprint, sections: generatedSections } = normalizedSite;
  const sections = applyPageStructure(generatedSections, { businessName: input.businessName });
  const theme = resolvePalette(input.palette, plan.paletteId, input.businessName);

  blueprint.site.visualStyle = {
    ...(blueprint.site.visualStyle ?? {}),
    name: plan.selectedDesignStyle,
    designNotes: plan.designBrief ?? blueprint.site.visualStyle?.designNotes ?? "",
    colors: { ...theme },
  };
  blueprint.site.socialLinks = normalizeSocialLinks(input.socialLinks);

  await prisma.site.deleteMany({ where: { userId: null, guestExpiresAt: { lt: new Date() } } });
  const site = await prisma.site.create({
    data: {
      userId,
      guestTokenHash: guestAccess?.tokenHash ?? null,
      guestExpiresAt: guestAccess?.expiresAt ?? null,
      businessName: input.businessName,
      businessType: resolveBusinessTypeLabel(input),
      goal: input.goal,
      visualStyle: plan.selectedDesignStyle,
      location: input.location === "Zona por definir" ? null : input.location || null,
      phone: input.phone || null,
      email: input.email || null,
      domain: input.domain || null,
      publicSlug: createPublicSlug(input.domain || input.businessName),
      language: input.language,
      status: "GENERATED",
      primaryColor: theme.primary,
      secondaryColor: theme.secondary,
      accentColor: theme.accent,
      logoUrl: input.assets?.logoDataUrl || null,
      coverUrl: input.assets?.coverDataUrl || null,
      blueprintJson: blueprint as object,
      sections: {
        create: sections.map((section) => ({
          type: section.type,
          title: section.title,
          order: section.order,
          isVisible: section.isVisible,
          content: section.content as object,
          settingsJson: section.settings as object,
        })),
      },
    },
  });
  await trackProductEvent("site_generated", { userId, siteId: site.id, metadata: { style: plan.selectedDesignStyle } });
  return site;
}
