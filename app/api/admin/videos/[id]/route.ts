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
  const { priceCents, cfStreamUid, downloadUrl, thumbnailSec } = await request
    .json()
    .catch(() => ({}));

  const data: {
    priceCents?: number;
    cfStreamUid?: string;
    downloadUrl?: string;
    thumbnailSec?: number;
  } = {};

  if (priceCents !== undefined) {
    if (
      typeof priceCents !== "number" ||
      !Number.isInteger(priceCents) ||
      priceCents < 0
    ) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }
    data.priceCents = priceCents;
  }

  if (cfStreamUid !== undefined) {
    if (typeof cfStreamUid !== "string" || cfStreamUid.trim().length === 0) {
      return NextResponse.json(
        { error: "Cloudflare Stream UID cannot be empty" },
        { status: 400 }
      );
    }
    data.cfStreamUid = cfStreamUid.trim();
  }

  if (downloadUrl !== undefined) {
    if (typeof downloadUrl !== "string" || downloadUrl.trim().length === 0) {
      return NextResponse.json(
        { error: "Download link cannot be empty" },
        { status: 400 }
      );
    }
    try {
      new URL(downloadUrl.trim());
    } catch {
      return NextResponse.json({ error: "Invalid download link" }, { status: 400 });
    }
    data.downloadUrl = downloadUrl.trim();
  }

  if (thumbnailSec !== undefined) {
    if (
      typeof thumbnailSec !== "number" ||
      !Number.isInteger(thumbnailSec) ||
      thumbnailSec < 0
    ) {
      return NextResponse.json({ error: "Invalid thumbnail time" }, { status: 400 });
    }
    data.thumbnailSec = thumbnailSec;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const video = await prisma.video.update({ where: { id }, data });
  return NextResponse.json({ video });
}
