"use client";

import { useState } from "react";

export function AdminGrantCreditsForm({ clientId }: { clientId: string }) {
  const [email, setEmail] = useState("");
  const [credits, setCredits] = useState("5");
  const [status, setStatus] = useState<
    { type: "idle" } | { type: "loading" } | { type: "error"; message: string }
  >({ type: "idle" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "loading" });
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, email, credits: Number(credits) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus({ type: "error", message: data?.error ?? "Could not grant credits" });
        return;
      }
      window.location.reload();
    } catch {
      setStatus({ type: "error", message: "Something went wrong" });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="font-label font-bold text-[11px] uppercase tracking-[0.18em] text-muted">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="client@example.com"
          className="rounded-xs border border-line bg-canvas px-3 py-1.5 text-[14px] text-primary outline-none focus:border-strong"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-label font-bold text-[11px] uppercase tracking-[0.18em] text-muted">
          Credits to add
        </label>
        <input
          type="number"
          required
          min={1}
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
          className="w-24 rounded-xs border border-line bg-canvas px-3 py-1.5 text-[14px] text-primary outline-none focus:border-strong"
        />
      </div>
      <button
        type="submit"
        disabled={status.type === "loading"}
        className="rounded-xs bg-cta px-5 py-2 font-label font-bold text-[12px] uppercase tracking-[0.18em] text-cta-text hover:bg-cta-hover disabled:opacity-50"
      >
        {status.type === "loading" ? "Saving…" : "Grant credits"}
      </button>
      {status.type === "error" && (
        <span className="text-[13px] text-red-700">{status.message}</span>
      )}
    </form>
  );
}
