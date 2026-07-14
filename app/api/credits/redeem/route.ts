import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { purchaseCookieName, PURCHASE_COOKIE_MAX_AGE } from "@/lib/purchase-cookie";

export async function POST(request: NextRequest) {
  const { clientSlug, email, videoIds } = await request.json().catch(() => ({}));

  if (
    typeof clientSlug !== "string" ||
    typeof email !== "string" ||
    !email.includes("@") ||
    !Array.isArray(videoIds) ||
    videoIds.length === 0 ||
    !videoIds.every((id) => typeof id === "string")
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { slug: clientSlug } });
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const credit = await prisma.credit.findFirst({
    where: { clientId: client.id, email: { equals: email.trim(), mode: "insensitive" } },
    include: { purchases: { where: { status: "paid" } } },
  });
  if (!credit) {
    return NextResponse.json({ error: "No credits found for that email" }, { status: 404 });
  }

  const remaining = Math.max(0, credit.totalCredits - credit.purchases.length);

  const uniqueIds = Array.from(new Set(videoIds));
  if (uniqueIds.length > remaining) {
    return NextResponse.json(
      { error: `You only have ${remaining} free download${remaining === 1 ? "" : "s"} remaining` },
      { status: 400 }
    );
  }

  const videos = await prisma.video.findMany({
    where: { id: { in: uniqueIds }, clientId: client.id },
  });

  const alreadyPurchasedIds = new Set(
    (
      await prisma.purchase.findMany({
        where: { videoId: { in: uniqueIds }, status: "paid" },
        select: { videoId: true },
      })
    ).map((p) => p.videoId)
  );

  const toRedeem = videos.filter((v) => !alreadyPurchasedIds.has(v.id));
  if (toRedeem.length === 0) {
    return NextResponse.json(
      { error: "Everything selected is already unlocked" },
      { status: 400 }
    );
  }

  await prisma.purchase.createMany({
    data: toRedeem.map((video) => ({
      videoId: video.id,
      creditId: credit.id,
      status: "paid",
      amountCents: 0,
      email: email.trim().toLowerCase(),
    })),
  });

  const response = NextResponse.json({ count: toRedeem.length });
  for (const video of toRedeem) {
    response.cookies.set(purchaseCookieName(video.id), "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: PURCHASE_COOKIE_MAX_AGE,
    });
  }
  return response;
}
