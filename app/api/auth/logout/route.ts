import { NextRequest, NextResponse } from "next/server";

import { deleteSession, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  await deleteSession(request.cookies.get(SESSION_COOKIE)?.value);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const response = NextResponse.redirect(new URL("/login", appUrl));
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
