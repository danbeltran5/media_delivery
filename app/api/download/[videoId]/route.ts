import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toDirectDownloadLink } from "@/lib/dropbox";
import { purchaseCookieName, PURCHASE_COOKIE_MAX_AGE } from "@/lib/purchase-cookie";

function downloadPage(fileUrl: string, title: string, isIOS: boolean) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Downloading ${title}</title>
<style>
  html, body {
    height: 100%;
    margin: 0;
    background: #fbf8f3;
    color: #111111;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
  }
  .card { max-width: 360px; }
  h1 { font-size: 20px; font-weight: 600; margin: 0 0 12px; }
  p { font-size: 15px; line-height: 1.6; color: #2e2c2a; margin: 0 0 8px; }
  .tip { margin-top: 16px; padding-top: 16px; border-top: 1px solid #e9e1d5; font-size: 13px; color: #6f6a63; }
  a { color: #656956; }
</style>
</head>
<body>
  <div class="card">
    <h1>Your download is starting&hellip;</h1>
    <p>${title} should begin downloading in a moment.</p>
    <p>You can close this tab once it&rsquo;s done.</p>
    <p><a href="${fileUrl}">Click here if it doesn&rsquo;t start automatically.</a></p>
    ${
      isIOS
        ? `<p class="tip">On iPhone, this saves to the Files app. To add it to Photos instead: open it in Files, tap the Share icon, then choose &ldquo;Save Video.&rdquo;</p>`
        : ""
    }
  </div>
  <script>
    window.location.href = ${JSON.stringify(fileUrl)};
  </script>
</body>
</html>`;
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/download/[videoId]">
) {
  const { videoId } = await params;

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { client: true },
  });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const hasCookie = request.cookies.get(purchaseCookieName(videoId))?.value === "1";
  let purchase = hasCookie
    ? await prisma.purchase.findFirst({ where: { videoId, status: "paid" } })
    : null;

  let setCookie = false;
  if (!purchase) {
    if (video.client.requirePurchase) {
      return NextResponse.json({ error: "Not purchased" }, { status: 403 });
    }
    // Direct-download client: no cart/Stripe involved, unlock on first click.
    purchase = await prisma.purchase.create({
      data: { videoId, status: "paid", amountCents: 0 },
    });
    setCookie = true;
  }

  if (!purchase.downloadedAt) {
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { downloadedAt: new Date() },
    });
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  const isIOS = /iPhone|iPad|iPod/.test(userAgent);

  const fileUrl = toDirectDownloadLink(video.downloadUrl);
  const response = new NextResponse(downloadPage(fileUrl, video.title, isIOS), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  if (setCookie) {
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
