import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const response = NextResponse.redirect(new URL("/login", appUrl));
  response.cookies.set("__cluster_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
