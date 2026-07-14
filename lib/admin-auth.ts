import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "admin_auth";
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function adminPassword() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD is not set");
  return password;
}

export function checkAdminPassword(candidate: string): boolean {
  return candidate === adminPassword();
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  };
}

/** Server Component / route handler check: is the current request authenticated as admin? */
export async function isAdminAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === adminPassword();
}
