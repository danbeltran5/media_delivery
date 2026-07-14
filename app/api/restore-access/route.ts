import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { purchaseCookieName, PURCHASE_COOKIE_MAX_AGE } from "@/lib/purchase-cookie";

export async function POST(request: NextRequest) {
  const { slug, email } = await request.json();

  if (typeof slug !== "string" || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { slug } });
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const purchases = await prisma.purchase.findMany({
    where: {
      status: "paid",
      email: { equals: email.trim(), mode: "insensitive" },
      video: { clientId: client.id },
    },
    select: { videoId: true },
  });

  if (purchases.length === 0) {
    return NextResponse.json(
      { error: "No purchases found for that email" },
      { status: 404 }
    );
  }

  const response = NextResponse.json({ count: purchases.length });
  for (const { videoId } of purchases) {
    response.cookies.set(purchaseCookieName(videoId), "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: PURCHASE_COOKIE_MAX_AGE,
    });
  }
  return response;
}
