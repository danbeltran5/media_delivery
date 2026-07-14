const API_BASE = "https://api.cloudflare.com/client/v4";

function accountId() {
  const id = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!id) throw new Error("CLOUDFLARE_ACCOUNT_ID is not set");
  return id;
}

function authHeaders() {
  const token = process.env.CLOUDFLARE_STREAM_API_TOKEN;
  if (!token) throw new Error("CLOUDFLARE_STREAM_API_TOKEN is not set");
  return { Authorization: `Bearer ${token}` };
}

export function streamPlaybackUrl(uid: string) {
  const code = process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE;
  if (!code) throw new Error("CLOUDFLARE_STREAM_CUSTOMER_CODE is not set");
  return `https://${code}.cloudflarestream.com/${uid}/iframe`;
}

export function streamThumbnailUrl(uid: string) {
  const code = process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE;
  if (!code) throw new Error("CLOUDFLARE_STREAM_CUSTOMER_CODE is not set");
  return `https://${code}.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg`;
}

export type StreamVideo = { uid: string; name: string | null };

/** Lists all videos already uploaded to the Cloudflare Stream account. */
export async function listVideos(): Promise<StreamVideo[]> {
  const videos: StreamVideo[] = [];
  let after: string | undefined;

  for (;;) {
    const url = new URL(`${API_BASE}/accounts/${accountId()}/stream`);
    url.searchParams.set("per_page", "1000");
    if (after) url.searchParams.set("after", after);

    const res = await fetch(url, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(
        `Cloudflare Stream list failed: ${JSON.stringify(data.errors ?? data)}`
      );
    }

    for (const v of data.result as Array<Record<string, unknown>>) {
      const meta = v.meta as Record<string, unknown> | undefined;
      videos.push({ uid: v.uid as string, name: (meta?.name as string) ?? null });
    }

    if (data.result.length < 1000) break;
    after = data.result[data.result.length - 1].uid;
  }

  return videos;
}

/** Uploads a local video file to Cloudflare Stream and returns its UID. */
export async function uploadVideo(
  filePath: string,
  fileName: string
): Promise<string> {
  const { openAsBlob } = await import("node:fs");
  const blob = await openAsBlob(filePath);
  const form = new FormData();
  form.append("file", blob, fileName);

  const res = await fetch(
    `${API_BASE}/accounts/${accountId()}/stream`,
    {
      method: "POST",
      headers: authHeaders(),
      body: form,
    }
  );

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(
      `Cloudflare Stream upload failed: ${JSON.stringify(data.errors ?? data)}`
    );
  }
  return data.result.uid as string;
}
