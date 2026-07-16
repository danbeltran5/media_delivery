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

export function streamThumbnailUrl(uid: string, seconds = 0) {
  const code = process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE;
  if (!code) throw new Error("CLOUDFLARE_STREAM_CUSTOMER_CODE is not set");
  const base = `https://${code}.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg`;
  return seconds > 0 ? `${base}?time=${seconds}s` : base;
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

const TUS_CHUNK_SIZE = 100 * 1024 * 1024; // must be a multiple of 256 KiB

/**
 * Uploads a local video file to Cloudflare Stream via the TUS resumable
 * protocol, in fixed-size chunks. Required for files over Cloudflare's
 * ~200MB simple-upload limit; works for any size (large weddings, etc).
 */
export async function uploadLargeVideo(
  filePath: string,
  fileName: string,
  onProgress?: (uploadedBytes: number, totalBytes: number) => void
): Promise<string> {
  const fs = await import("node:fs/promises");
  const stat = await fs.stat(filePath);
  const size = stat.size;

  const createRes = await fetch(`${API_BASE}/accounts/${accountId()}/stream`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Tus-Resumable": "1.0.0",
      "Upload-Length": String(size),
      "Upload-Metadata": `name ${Buffer.from(fileName).toString("base64")}`,
    },
  });
  if (!createRes.ok) {
    throw new Error(
      `Cloudflare Stream TUS create failed: ${createRes.status} ${await createRes.text()}`
    );
  }
  const location = createRes.headers.get("Location");
  const mediaId = createRes.headers.get("Stream-Media-Id");
  if (!location || !mediaId) {
    throw new Error("Cloudflare Stream TUS create response missing Location/Stream-Media-Id");
  }

  const fh = await fs.open(filePath, "r");
  try {
    let offset = 0;
    while (offset < size) {
      const chunkSize = Math.min(TUS_CHUNK_SIZE, size - offset);
      const buffer = Buffer.alloc(chunkSize);
      await fh.read(buffer, 0, chunkSize, offset);

      let attempt = 0;
      for (;;) {
        const patchRes = await fetch(location, {
          method: "PATCH",
          headers: {
            ...authHeaders(),
            "Tus-Resumable": "1.0.0",
            "Upload-Offset": String(offset),
            "Content-Type": "application/offset+octet-stream",
          },
          body: buffer,
        });
        if (patchRes.ok) break;
        attempt++;
        if (attempt > 5) {
          throw new Error(
            `Cloudflare Stream TUS chunk upload failed at offset ${offset}: ${patchRes.status} ${await patchRes.text()}`
          );
        }
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }

      offset += chunkSize;
      onProgress?.(offset, size);
    }
  } finally {
    await fh.close();
  }

  return mediaId;
}
