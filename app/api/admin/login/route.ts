import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, adminCookieOptions, checkAdminPassword } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json().catch(() => ({}));

  if (typeof password !== "string" || !checkAdminPassword(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, password, adminCookieOptions());
  return response;
}
