"use client";

import { useState } from "react";

export function AdminReplaceVideoForm({
  videoId,
  cfStreamUid,
  downloadUrl,
}: {
  videoId: string;
  cfStreamUid: string;
  downloadUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [streamUid, setStreamUid] = useState(cfStreamUid);
  const [link, setLink] = useState(downloadUrl);
  const [status, setStatus] = useState<
    { type: "idle" } | { type: "loading" } | { type: "error"; message: string }
  >({ type: "idle" });

  async function handleSave() {
    setStatus({ type: "loading" });
    try {
      const res = await fetch(`/api/admin/videos/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cfStreamUid: streamUid, downloadUrl: link }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus({ type: "error", message: data?.error ?? "Could not save" });
        return;
      }
      window.location.reload();
    } catch {
      setStatus({ type: "error", message: "Something went wrong" });
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-label font-bold text-[11px] uppercase tracking-[0.14em] text-muted underline underline-offset-2 hover:text-accent"
      >
        Replace video
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <label className="font-label font-bold text-[11px] uppercase tracking-[0.18em] text-muted">
          Cloudflare Stream UID
        </label>
        <input
          value={streamUid}
          onChange={(e) => setStreamUid(e.target.value)}
          className="border border-line bg-canvas px-3 py-1.5 text-[13px] text-primary outline-none focus:border-strong"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-label font-bold text-[11px] uppercase tracking-[0.18em] text-muted">
          Dropbox download link
        </label>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="border border-line bg-canvas px-3 py-1.5 text-[13px] text-primary outline-none focus:border-strong"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSave}
          disabled={status.type === "loading"}
          className="rounded-xs bg-cta px-4 py-1.5 font-label font-bold text-[11px] uppercase tracking-[0.14em] text-cta-text hover:bg-cta-hover disabled:opacity-50"
        >
          {status.type === "loading" ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setStreamUid(cfStreamUid);
            setLink(downloadUrl);
            setStatus({ type: "idle" });
          }}
          className="font-label font-bold text-[11px] uppercase tracking-[0.14em] text-muted underline underline-offset-2"
        >
          Cancel
        </button>
        {status.type === "error" && (
          <span className="text-[12px] text-red-700">{status.message}</span>
        )}
      </div>
    </div>
  );
}
