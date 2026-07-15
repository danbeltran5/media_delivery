import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toDirectDownloadLink } from "@/lib/dropbox";
import { purchaseCookieName } from "@/lib/purchase-cookie";

function downloadPage(fileUrl: string, title: string) {
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
  a { color: #656956; }
</style>
</head>
<body>
  <div class="card">
    <h1>Your download is starting&hellip;</h1>
    <p>${title} should begin downloading in a moment.</p>
    <p>You can close this tab once it&rsquo;s done.</p>
    <p><a href="${fileUrl}">Click here if it doesn&rsquo;t start automatically.</a></p>
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

  if (!purchase.downloadedAt) {
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { downloadedAt: new Date() },
    });
  }

  const fileUrl = toDirectDownloadLink(video.downloadUrl);
  return new NextResponse(downloadPage(fileUrl, video.title), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
