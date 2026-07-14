"use client";

import { useState } from "react";
import { useCredits } from "@/lib/credit-context";

export function CreditBar({ clientSlug }: { clientSlug: string }) {
  const { active, email, selectedIds } = useCredits();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!active || selectedIds.length === 0) return null;

  async function handleRedeem() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/credits/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSlug, email, videoIds: selectedIds }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Could not redeem");
        setLoading(false);
        return;
      }
      window.location.reload();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="sticky bottom-0 z-40 border-t border-hairline bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 sm:px-10">
        <span className="text-[15px] text-secondary">
          {selectedIds.length} video{selectedIds.length === 1 ? "" : "s"} selected
          {error && <span className="ml-3 text-red-700">{error}</span>}
        </span>
        <button
          onClick={handleRedeem}
          disabled={loading}
          className="rounded-xs bg-olive px-6 py-3 font-label font-bold text-[13px] uppercase tracking-[0.18em] text-on-dark transition-colors duration-[180ms] hover:bg-olive/90 disabled:opacity-50"
        >
          {loading ? "Redeeming…" : "Redeem Free Downloads"}
        </button>
      </div>
    </div>
  );
}
