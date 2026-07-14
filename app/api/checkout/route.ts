import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const { videoIds } = await request.json();
    if (
      !Array.isArray(videoIds) ||
      videoIds.length === 0 ||
      !videoIds.every((id) => typeof id === "string")
    ) {
      return NextResponse.json(
        { error: "videoIds must be a non-empty array of strings" },
        { status: 400 }
      );
    }

    const uniqueIds = Array.from(new Set(videoIds));
    const videos = await prisma.video.findMany({
      where: { id: { in: uniqueIds } },
      include: { client: true },
    });
    if (videos.length === 0) {
      return NextResponse.json({ error: "No matching videos found" }, { status: 404 });
    }

    const clientId = videos[0].client.id;
    if (videos.some((v) => v.client.id !== clientId)) {
      return NextResponse.json(
        { error: "Cart contains videos from different clients" },
        { status: 400 }
      );
    }

    const alreadyPaid = await prisma.purchase.findMany({
      where: { videoId: { in: uniqueIds }, status: "paid" },
      select: { videoId: true },
    });
    const paidIds = new Set(alreadyPaid.map((p) => p.videoId));
    const toBuy = videos.filter((v) => !paidIds.has(v.id));

    if (toBuy.length === 0) {
      return NextResponse.json(
        { error: "Everything in this cart is already purchased" },
        { status: 400 }
      );
    }

    const origin = request.nextUrl.origin;

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      line_items: toBuy.map((video) => ({
        quantity: 1,
        price_data: {
          currency: video.currency,
          unit_amount: video.priceCents,
          product_data: {
            name: `Download: ${video.title}`,
          },
        },
      })),
      return_url: `${origin}/api/confirm?session_id={CHECKOUT_SESSION_ID}`,
    });

    if (!session.client_secret) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    await prisma.purchase.createMany({
      data: toBuy.map((video) => ({
        videoId: video.id,
        stripeSessionId: session.id,
        amountCents: video.priceCents,
        status: "pending",
      })),
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Checkout failed" },
      { status: 500 }
    );
  }
}
