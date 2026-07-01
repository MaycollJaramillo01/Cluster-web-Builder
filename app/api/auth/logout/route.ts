import { NextRequest, NextResponse } from "next/server";

import { deleteSession, SESSION_COOKIE } from "@/lib/auth";
import { appOrigin } from "@/lib/site/public-url";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  await deleteSession(request.cookies.get(SESSION_COOKIE)?.value);
  const response = NextResponse.redirect(new URL("/login", appOrigin(request.nextUrl.origin)));
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
