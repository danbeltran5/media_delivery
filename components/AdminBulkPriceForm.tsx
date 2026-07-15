"use client";

import { useState } from "react";

export function AdminBulkPriceForm({ clientId }: { clientId: string }) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<
    { type: "idle" } | { type: "loading" } | { type: "error"; message: string }
  >({ type: "idle" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const dollars = Number(value);
    if (!Number.isFinite(dollars) || dollars < 0) {
      setStatus({ type: "error", message: "Invalid price" });
      return;
    }
    if (
      !window.confirm(
        `Set every video for this client to $${dollars.toFixed(2)}? This can't be undone.`
      )
    ) {
      return;
    }
    setStatus({ type: "loading" });
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/bulk-price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceCents: Math.round(dollars * 100) }),
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
      <span className="text-[14px] text-secondary">Set every video&rsquo;s price to</span>
      <input
        type="number"
        step="0.01"
        min="0"
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="65.00"
        className="w-24 border border-line bg-canvas px-3 py-1.5 text-[14px] text-primary outline-none focus:border-strong"
      />
      <button
        type="submit"
        disabled={status.type === "loading"}
        className="rounded-xs bg-cta px-5 py-2 font-label font-bold text-[12px] uppercase tracking-[0.18em] text-cta-text hover:bg-cta-hover disabled:opacity-50"
      >
        {status.type === "loading" ? "Saving…" : "Apply to all"}
      </button>
      {status.type === "error" && (
        <span className="text-[13px] text-red-700">{status.message}</span>
      )}
    </form>
  );
}
