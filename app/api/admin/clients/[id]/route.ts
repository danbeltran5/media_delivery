import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const RESERVED_SLUGS = new Set(["admin", "api", "c"]);

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/admin/clients/[id]">
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { name, slug } = await request.json().catch(() => ({}));

  const data: { name?: string; slug?: string } = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    data.name = name.trim();
  }

  if (slug !== undefined) {
    if (typeof slug !== "string" || !SLUG_PATTERN.test(slug)) {
      return NextResponse.json(
        { error: "URL must be lowercase letters, numbers, and hyphens only" },
        { status: 400 }
      );
    }
    if (RESERVED_SLUGS.has(slug)) {
      return NextResponse.json({ error: "That URL is reserved" }, { status: 400 });
    }
    const existing = await prisma.client.findUnique({ where: { slug } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "That URL is already taken" }, { status: 400 });
    }
    data.slug = slug;
  }

  const client = await prisma.client.update({ where: { id }, data });
  return NextResponse.json({ client });
}
