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
  const { name, slug, tagline, requirePurchase, orientation, watermark, showAccessForm } =
    await request.json().catch(() => ({}));

  const data: {
    name?: string;
    slug?: string;
    tagline?: string | null;
    requirePurchase?: boolean;
    orientation?: string;
    watermark?: boolean;
    showAccessForm?: boolean;
  } = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    data.name = name.trim();
  }

  if (tagline !== undefined) {
    if (typeof tagline !== "string") {
      return NextResponse.json({ error: "Invalid tagline" }, { status: 400 });
    }
    data.tagline = tagline.trim().length === 0 ? null : tagline.trim();
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

  if (requirePurchase !== undefined) {
    if (typeof requirePurchase !== "boolean") {
      return NextResponse.json({ error: "Invalid requirePurchase" }, { status: 400 });
    }
    data.requirePurchase = requirePurchase;
  }

  if (orientation !== undefined) {
    if (orientation !== "portrait" && orientation !== "landscape") {
      return NextResponse.json({ error: "Invalid orientation" }, { status: 400 });
    }
    data.orientation = orientation;
  }

  if (watermark !== undefined) {
    if (typeof watermark !== "boolean") {
      return NextResponse.json({ error: "Invalid watermark" }, { status: 400 });
    }
    data.watermark = watermark;
  }

  if (showAccessForm !== undefined) {
    if (typeof showAccessForm !== "boolean") {
      return NextResponse.json({ error: "Invalid showAccessForm" }, { status: 400 });
    }
    data.showAccessForm = showAccessForm;
  }

  const client = await prisma.client.update({ where: { id }, data });
  return NextResponse.json({ client });
}
