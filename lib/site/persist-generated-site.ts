import { prisma } from "@/lib/db";
import { resolveBusinessTypeLabel, type OnboardingInput } from "@/lib/validators/site-onboarding";
import { resolvePalette } from "@/lib/site/design";
import type { GenerationPlan } from "@/lib/site/generation-pipeline";
import type { NormalizedSite } from "@/lib/site/normalize-site-blueprint";
import { createPublicSlug } from "@/lib/site/public-url";
import { normalizeSocialLinks } from "@/lib/site/social-links";
import { applyPageStructure } from "@/lib/site/structure";
import { trackProductEvent } from "@/lib/product-events";
import { composeGeneratedSiteDocument } from "@/lib/site/generation-document";
import { materializeDataUrlsForSite, stripDataUrls } from "@/lib/site/media";
import { type CanvasSectionV2, type SiteContentV2 } from "@/lib/site/v2-schema";
import { auditSiteDocumentWithRegistryV2 } from "@/lib/site/v2-section-registry";

type GuestAccess = { tokenHash: string; expiresAt: Date } | null;

type PendingV2Document = {
  content: SiteContentV2;
  sections: CanvasSectionV2[];
};

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
  const uploadedLogoAsset = input.assets?.logoDataUrl || null;
  const uploadedCoverAsset = input.assets?.coverDataUrl || null;

  const v2 = composeGeneratedSiteDocument({
    businessName: input.businessName,
    businessType: resolveBusinessTypeLabel(input),
    location: input.location === "Zona por definir" ? null : input.location || null,
    phone: input.phone || null,
    email: input.email || null,
    logoUrl: uploadedLogoAsset,
    coverUrl: uploadedCoverAsset,
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
  })), plan.sectionPlan);

  const quality = auditSiteDocumentWithRegistryV2(v2);
  if (!quality.passed) {
    throw new Error(quality.issues.filter((issue) => issue.level === "error").map((issue) => issue.message).join(" "));
  }

  const strippedContent = stripDataUrls(v2.content) as SiteContentV2;
  const strippedSections = stripDataUrls(v2.sections) as CanvasSectionV2[];

  await prisma.site.deleteMany({ where: { userId: null, guestExpiresAt: { lt: new Date() } } });

  // Fast path: create the project immediately so the SSE `saved` event can fire
  // before Blob materialization (logo/cover) races the 60s serverless wall.
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
      contentJson: strippedContent as object,
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
      logoUrl: null,
      coverUrl: null,
      blueprintJson: blueprint as object,
      sections: {
        create: strippedSections.map((section, order) => ({
          type: "canvas",
          title: section.name,
          order,
          isVisible: true,
          content: section as object,
          settingsJson: {},
        })),
      },
    },
  });

  await trackProductEvent("site_generated", { userId, siteId: site.id, metadata: { style: plan.selectedDesignStyle } });

  const pending: PendingV2Document = { content: v2.content, sections: v2.sections };
  return {
    site,
    finalizeMedia: () => materializeGeneratedSiteMedia(site.id, pending),
  };
}

export async function materializeGeneratedSiteMedia(siteId: string, document: PendingV2Document) {
  const content = await materializeDataUrlsForSite(siteId, document.content, "content");
  const canvasSections = await materializeDataUrlsForSite(siteId, document.sections, "section");
  const coverUrl = content.hero.media || content.about.media || content.media[0]?.url || null;

  await prisma.$transaction([
    prisma.site.update({
      where: { id: siteId },
      data: {
        contentJson: content as object,
        logoUrl: content.business.logo || null,
        coverUrl,
      },
    }),
    prisma.siteSection.deleteMany({ where: { siteId } }),
    prisma.siteSection.createMany({
      data: canvasSections.map((section, order) => ({
        type: "canvas",
        title: section.name,
        order,
        isVisible: true,
        content: section as object,
        settingsJson: {},
        siteId,
      })),
    }),
  ]);
}
