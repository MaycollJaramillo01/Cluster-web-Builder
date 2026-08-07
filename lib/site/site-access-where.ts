export type SiteAccessActor = {
  user: { id: string; role: string } | null;
  guestTokenHash: string | null;
};

export type SiteAccessWhere = {
  id: string;
  userId?: string;
  OR?: Array<Record<string, unknown>>;
};

export function siteAccessWhere(
  siteId: string,
  actor: SiteAccessActor,
  options: { allowGuest?: boolean } = {},
): SiteAccessWhere {
  const allowGuest = options.allowGuest ?? true;
  if (actor.user?.role === "ADMIN") return { id: siteId };

  const or: Array<Record<string, unknown>> = [];
  if (actor.user) or.push({ userId: actor.user.id });
  if (allowGuest && actor.guestTokenHash) {
    or.push({
      userId: null,
      guestTokenHash: actor.guestTokenHash,
      guestExpiresAt: { gt: new Date() },
    });
  }

  if (!or.length) return { id: siteId, userId: "__no_access__" };
  return { id: siteId, OR: or };
}
