import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "__cluster_session";
export const GUEST_COOKIE = "__cluster_guest";
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
export const GUEST_MS = 72 * 60 * 60 * 1000;
const userSelect = { id: true, username: true, name: true, email: true, role: true, planStatus: true, stripeCustomerId: true } as const;

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MS);
  await prisma.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  return { token, expiresAt };
}

export async function getCurrentUser() {
  const store = await cookies();
  return getUserBySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function getUserBySessionToken(token?: string) {
  if (!token) return null;
  const session = await prisma.session.findFirst({
    where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() } },
    select: { user: { select: userSelect } },
  });
  return session?.user ?? null;
}

export function createGuestAccess() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + GUEST_MS) };
}

export function hashGuestToken(token?: string) {
  return token ? hashToken(token) : null;
}

export async function deleteSession(token?: string) {
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export function sessionCookie(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    expires: expiresAt,
    path: "/",
  };
}

export function guestCookie(expiresAt: Date) {
  return { ...sessionCookie(expiresAt), expires: expiresAt };
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
