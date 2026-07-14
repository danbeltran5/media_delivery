const API_BASE = "https://api.dropboxapi.com/2";

function authHeaders() {
  const token = process.env.DROPBOX_ACCESS_TOKEN;
  if (!token) throw new Error("DROPBOX_ACCESS_TOKEN is not set");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Normalizes a Dropbox share link (e.g. copied via "Copy link" in the
 * Dropbox app, which defaults to `?dl=0`) into one that serves the raw file
 * for direct download instead of Dropbox's preview page.
 */
export function toDirectDownloadLink(shareUrl: string): string {
  const url = new URL(shareUrl);
  url.searchParams.set("dl", "1");
  return url.toString();
}

export type DropboxFile = { name: string; pathLower: string };

/** Lists all files (not folders) directly inside a Dropbox folder path. */
export async function listFolderFiles(path: string): Promise<DropboxFile[]> {
  const files: DropboxFile[] = [];

  let res = await fetch(`${API_BASE}/files/list_folder`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ path }),
  });
  let data = await res.json();
  if (!res.ok) {
    throw new Error(`Dropbox list_folder failed: ${JSON.stringify(data)}`);
  }

  for (;;) {
    for (const entry of data.entries as Array<Record<string, unknown>>) {
      if (entry[".tag"] === "file") {
        files.push({
          name: entry.name as string,
          pathLower: entry.path_lower as string,
        });
      }
    }
    if (!data.has_more) break;

    res = await fetch(`${API_BASE}/files/list_folder/continue`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ cursor: data.cursor }),
    });
    data = await res.json();
    if (!res.ok) {
      throw new Error(
        `Dropbox list_folder/continue failed: ${JSON.stringify(data)}`
      );
    }
  }

  return files;
}

/**
 * Returns a shareable link for a file, creating one if it doesn't already
 * have one. Idempotent — safe to call repeatedly for the same file.
 */
export async function getOrCreateSharedLink(path: string): Promise<string> {
  const res = await fetch(
    `${API_BASE}/sharing/create_shared_link_with_settings`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ path }),
    }
  );
  const data = await res.json();
  if (res.ok) {
    return data.url as string;
  }

  const alreadyExists =
    data?.error?.[".tag"] === "shared_link_already_exists";
  if (!alreadyExists) {
    throw new Error(
      `Dropbox create_shared_link_with_settings failed for ${path}: ${JSON.stringify(
        data
      )}`
    );
  }

  const existingUrl = data?.error?.shared_link_already_exists?.metadata?.url;
  if (existingUrl) return existingUrl as string;

  const listRes = await fetch(`${API_BASE}/sharing/list_shared_links`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ path, direct_only: true }),
  });
  const listData = await listRes.json();
  if (!listRes.ok || !listData.links?.[0]?.url) {
    throw new Error(
      `Dropbox list_shared_links failed for ${path}: ${JSON.stringify(
        listData
      )}`
    );
  }
  return listData.links[0].url as string;
}
