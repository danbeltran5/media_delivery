"use client";

import { useState } from "react";
import { useCredits } from "@/lib/credit-context";

export function AccessForm({ slug }: { slug: string }) {
  const credits = useCredits();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    { type: "idle" } | { type: "loading" } | { type: "error"; message: string }
  >({ type: "idle" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "loading" });

    const remaining = await credits.verifyEmail(email);
    if (remaining > 0) {
      setStatus({ type: "idle" });
      setOpen(false);
      return;
    }

    try {
      const res = await fetch("/api/restore-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
    } catch {
      // fall through to the generic error below
    }

    setStatus({ type: "error", message: "No downloads found for that email" });
  }

  if (credits.active) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="font-label font-bold text-[11px] uppercase tracking-[0.14em] text-accent">
          {credits.remaining} free download{credits.remaining === 1 ? "" : "s"} remaining
        </span>
        <span className="text-[12px] text-secondary">
          — add videos to your cart, they&rsquo;ll be free.
        </span>
        <button
          onClick={credits.exit}
          className="font-label font-bold text-[10px] uppercase tracking-[0.14em] text-muted underline underline-offset-2 hover:text-accent"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-center font-label font-bold text-[11px] uppercase tracking-[0.14em] text-muted underline underline-offset-4 transition-colors duration-[180ms] hover:text-accent"
      >
        Restore purchase or activate download credits
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center justify-center gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="rounded-xs border border-line bg-page px-3 py-1.5 text-[13px] text-primary outline-none transition-colors duration-[180ms] focus:border-strong"
      />
      <button
        type="submit"
        disabled={status.type === "loading"}
        className="rounded-xs bg-cta px-4 py-1.5 font-label font-bold text-[11px] uppercase tracking-[0.14em] text-cta-text transition-colors duration-[180ms] hover:bg-cta-hover disabled:opacity-50"
      >
        {status.type === "loading" ? "Checking…" : "Unlock"}
      </button>
      {status.type === "error" && (
        <span className="text-[12px] text-red-700">{status.message}</span>
      )}
    </form>
  );
}
