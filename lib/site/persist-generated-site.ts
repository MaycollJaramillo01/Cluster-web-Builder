import { prisma } from "@/lib/db";
import { resolveBusinessTypeLabel, type OnboardingInput } from "@/lib/validators/site-onboarding";
import { resolvePalette } from "@/lib/site/design";
import type { GenerationPlan } from "@/lib/site/generation-pipeline";
import type { NormalizedSite } from "@/lib/site/normalize-site-blueprint";
import { createPublicSlug } from "@/lib/site/public-url";
import { normalizeSocialLinks } from "@/lib/site/social-links";
import { applyPageStructure } from "@/lib/site/structure";
import { trackProductEvent } from "@/lib/product-events";
import { migrateLegacySiteDocument } from "@/lib/site/v2-migrate";

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

  const v2 = migrateLegacySiteDocument({
    businessName: input.businessName,
    businessType: resolveBusinessTypeLabel(input),
    location: input.location === "Zona por definir" ? null : input.location || null,
    phone: input.phone || null,
    email: input.email || null,
    logoUrl: input.assets?.logoDataUrl || null,
    coverUrl: input.assets?.coverDataUrl || null,
    visualStyle: plan.selectedDesignStyle,
    blueprintJson: blueprint,
    primaryColor: theme.primary,
    secondaryColor: theme.secondary,
    accentColor: theme.accent,
  }, sections.map((section) => ({
    type: section.type,
    title: section.title,
    content: section.content,
    settingsJson: section.settings,
    order: section.order,
  })));

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
      builderVersion: 2,
      templateId: v2.templateId,
      contentJson: v2.content as object,
      designJson: v2.design as object,
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
        create: v2.sections.map((section) => ({
          type: "canvas",
          title: section.name,
          order: section.order,
          isVisible: true,
          content: section as object,
          settingsJson: {},
        })),
      },
    },
  });
  await trackProductEvent("site_generated", { userId, siteId: site.id, metadata: { style: plan.selectedDesignStyle } });
  return site;
}
