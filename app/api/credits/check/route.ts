import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { clientSlug, email } = await request.json().catch(() => ({}));

  if (
    typeof clientSlug !== "string" ||
    typeof email !== "string" ||
    !email.includes("@")
  ) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
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
    return NextResponse.json({ remaining: 0 });
  }

  const remaining = Math.max(0, credit.totalCredits - credit.purchases.length);
  return NextResponse.json({ remaining });
}
