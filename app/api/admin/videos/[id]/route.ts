import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/admin/videos/[id]">
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { priceCents } = await request.json().catch(() => ({}));

  if (
    typeof priceCents !== "number" ||
    !Number.isInteger(priceCents) ||
    priceCents < 0
  ) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  const video = await prisma.video.update({ where: { id }, data: { priceCents } });
  return NextResponse.json({ video });
}
