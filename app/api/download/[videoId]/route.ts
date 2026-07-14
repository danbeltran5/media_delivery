import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toDirectDownloadLink } from "@/lib/dropbox";
import { purchaseCookieName } from "@/lib/purchase-cookie";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/download/[videoId]">
) {
  const { videoId } = await params;

  const hasCookie = request.cookies.get(purchaseCookieName(videoId))?.value === "1";
  if (!hasCookie) {
    return NextResponse.json({ error: "Not purchased" }, { status: 403 });
  }

  const purchase = await prisma.purchase.findFirst({
    where: { videoId, status: "paid" },
  });
  if (!purchase) {
    return NextResponse.json({ error: "Not purchased" }, { status: 403 });
  }

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  return NextResponse.redirect(toDirectDownloadLink(video.downloadUrl));
}
