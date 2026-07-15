import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { purchaseCookieName, PURCHASE_COOKIE_MAX_AGE } from "@/lib/purchase-cookie";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const origin = request.nextUrl.origin;

  if (!sessionId) {
    return NextResponse.redirect(origin);
  }

  const purchases = await prisma.purchase.findMany({
    where: { stripeSessionId: sessionId },
    include: { video: { include: { client: true } } },
  });

  if (purchases.length === 0) {
    return NextResponse.redirect(origin);
  }

  const clientUrl = `${origin}/${purchases[0].video.client.slug}`;

  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return NextResponse.redirect(clientUrl);
  }

  const unpaid = purchases.filter((p) => p.status !== "paid");
  if (unpaid.length > 0) {
    await prisma.purchase.updateMany({
      where: { id: { in: unpaid.map((p) => p.id) } },
      data: {
        status: "paid",
        email: session.customer_details?.email ?? undefined,
      },
    });
  }

  const response = NextResponse.redirect(clientUrl);
  for (const purchase of purchases) {
    response.cookies.set(purchaseCookieName(purchase.videoId), "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: PURCHASE_COOKIE_MAX_AGE,
    });
  }
  return response;
}
