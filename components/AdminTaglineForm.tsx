"use client";

import { useState } from "react";
import { DEFAULT_TAGLINE } from "@/lib/tagline";

export function AdminTaglineForm({
  clientId,
  tagline,
}: {
  clientId: string;
  tagline: string | null;
}) {
  const [value, setValue] = useState(tagline ?? "");
  const [status, setStatus] = useState<
    { type: "idle" } | { type: "loading" } | { type: "error"; message: string }
  >({ type: "idle" });

  async function handleSave() {
    setStatus({ type: "loading" });
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagline: value }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus({ type: "error", message: data?.error ?? "Could not save" });
        return;
      }
      setStatus({ type: "idle" });
    } catch {
      setStatus({ type: "error", message: "Something went wrong" });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={DEFAULT_TAGLINE}
        rows={3}
        className="w-full resize-y rounded-xs border border-line bg-canvas px-3.5 py-2.5 text-[15px] text-primary outline-none transition-colors duration-[180ms] focus:border-strong"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSave}
          disabled={status.type === "loading"}
          className="rounded-xs bg-cta px-5 py-2 font-label font-bold text-[12px] uppercase tracking-[0.18em] text-cta-text hover:bg-cta-hover disabled:opacity-50"
        >
          {status.type === "loading" ? "Saving…" : "Save"}
        </button>
        <span className="text-[13px] text-muted">
          Leave blank to use the default text.
        </span>
        {status.type === "error" && (
          <span className="text-[13px] text-red-700">{status.message}</span>
        )}
      </div>
    </div>
  );
}
