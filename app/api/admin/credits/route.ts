import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, email, credits } = await request.json().catch(() => ({}));

  if (typeof clientId !== "string" || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "A client and valid email are required" }, { status: 400 });
  }

  const creditsToAdd = Math.round(Number(credits));
  if (!Number.isFinite(creditsToAdd) || creditsToAdd <= 0) {
    return NextResponse.json(
      { error: "Credits must be a positive whole number" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.credit.findUnique({
    where: { clientId_email: { clientId, email: normalizedEmail } },
  });

  const credit = existing
    ? await prisma.credit.update({
        where: { id: existing.id },
        data: { totalCredits: existing.totalCredits + creditsToAdd },
      })
    : await prisma.credit.create({
        data: { clientId, email: normalizedEmail, totalCredits: creditsToAdd },
      });

  return NextResponse.json({ credit });
}
