"use client";

import { useState } from "react";

export function RestoreAccessForm({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    { type: "idle" } | { type: "loading" } | { type: "error"; message: string }
  >({ type: "idle" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "loading" });
    try {
      const res = await fetch("/api/restore-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus({
          type: "error",
          message: data?.error ?? "Could not find any purchases",
        });
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
        className="font-label font-bold text-[13px] uppercase tracking-[0.18em] text-muted underline underline-offset-4 transition-colors duration-[180ms] hover:text-accent"
      >
        Already purchased? Restore your downloads
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="rounded-xs border border-line bg-canvas px-3.5 py-2 text-[15px] text-primary outline-none transition-colors duration-[180ms] focus:border-strong"
      />
      <button
        type="submit"
        disabled={status.type === "loading"}
        className="rounded-xs bg-cta px-5 py-2.5 font-label font-bold text-[13px] uppercase tracking-[0.18em] text-cta-text transition-colors duration-[180ms] hover:bg-cta-hover disabled:opacity-50"
      >
        {status.type === "loading" ? "Checking…" : "Restore"}
      </button>
      {status.type === "error" && (
        <span className="text-[14px] text-red-700">{status.message}</span>
      )}
    </form>
  );
}
