import { getDesignPreset } from "@/lib/site/design";

type OrderedSection = { id?: string; type: string; order: number };

/** Applies the selected composition while keeping content that is not part of its core plan. */
export function orderSectionsForTemplate<T extends OrderedSection>(
  sections: readonly T[],
  visualStyle: string | null | undefined,
): T[] {
  const plan = getDesignPreset(visualStyle).sectionPlan;
  const rank = new Map(plan.map((type, index) => [type, index]));
  const footerRank = plan.length + sections.length + 1;

  return [...sections].sort((left, right) => {
    const leftType = left.type === "about" ? "about_us" : left.type;
    const rightType = right.type === "about" ? "about_us" : right.type;
    const leftRank = leftType === "footer" ? footerRank : rank.get(leftType) ?? plan.length + left.order;
    const rightRank = rightType === "footer" ? footerRank : rank.get(rightType) ?? plan.length + right.order;
    return leftRank - rightRank || left.order - right.order;
  });
}
