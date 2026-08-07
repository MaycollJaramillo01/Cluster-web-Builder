import type { NextRequest } from "next/server";

import { getUserBySessionToken, GUEST_COOKIE, hashGuestToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { siteAccessWhere } from "@/lib/site/site-access-where";

export { siteAccessWhere } from "@/lib/site/site-access-where";

export type SiteActor = {
  user: Awaited<ReturnType<typeof getUserBySessionToken>>;
  guestTokenHash: string | null;
};

export class SiteAccessError extends Error {
  status: 401 | 404;

  constructor(status: 401 | 404, message: string) {
    super(message);
    this.status = status;
  }
}

export async function getSiteActor(request: NextRequest): Promise<SiteActor> {
  const user = await getUserBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const guestTokenHash = hashGuestToken(request.cookies.get(GUEST_COOKIE)?.value);
  return { user, guestTokenHash };
}

type AssertOptions = {
  siteId: string;
  request: NextRequest;
  /** When true, guests are rejected with 401. */
  requireUser?: boolean;
  /** When false, guest-owned drafts are excluded. Defaults to !requireUser. */
  allowGuest?: boolean;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
};

export async function assertSiteAccess(options: AssertOptions) {
  const actor = await getSiteActor(options.request);
  const requireUser = options.requireUser ?? false;
  const allowGuest = options.allowGuest ?? !requireUser;

  if (requireUser && !actor.user) {
    throw new SiteAccessError(401, "Inicia sesión.");
  }
  if (!actor.user && !actor.guestTokenHash) {
    throw new SiteAccessError(404, "Proyecto no encontrado.");
  }

  const site = await prisma.site.findFirst({
    where: siteAccessWhere(options.siteId, actor, { allowGuest }) as never,
    ...(options.select ? { select: options.select } : {}),
    ...(options.include ? { include: options.include } : {}),
  } as never);

  if (!site) throw new SiteAccessError(404, "Proyecto no encontrado.");
  return { site: site as Record<string, any>, actor };
}

export function siteAccessErrorResponse(error: unknown) {
  if (error instanceof SiteAccessError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return null;
}
