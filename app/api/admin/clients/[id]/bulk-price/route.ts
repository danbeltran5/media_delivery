import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/admin/clients/[id]/bulk-price">
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

  const { count } = await prisma.video.updateMany({
    where: { clientId: id },
    data: { priceCents },
  });

  return NextResponse.json({ count });
}
