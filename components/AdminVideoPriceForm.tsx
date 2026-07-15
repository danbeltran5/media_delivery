"use client";

import { useState } from "react";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function AdminVideoPriceForm({
  videoId,
  priceCents,
}: {
  videoId: string;
  priceCents: number;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState((priceCents / 100).toFixed(2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const dollars = Number(value);
    if (!Number.isFinite(dollars) || dollars < 0) {
      setError("Invalid price");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/videos/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceCents: Math.round(dollars * 100) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Could not save");
        setSaving(false);
        return;
      }
      window.location.reload();
    } catch {
      setError("Something went wrong");
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-[13px] text-muted underline underline-offset-2 hover:text-accent"
      >
        {formatPrice(priceCents)}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20 rounded-xs border border-line bg-canvas px-2 py-1 text-[13px] text-primary outline-none focus:border-strong"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="font-label font-bold text-[11px] uppercase tracking-[0.14em] text-accent underline underline-offset-2 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      <button
        onClick={() => {
          setEditing(false);
          setValue((priceCents / 100).toFixed(2));
          setError(null);
        }}
        className="font-label font-bold text-[11px] uppercase tracking-[0.14em] text-muted underline underline-offset-2"
      >
        Cancel
      </button>
      {error && <span className="text-[12px] text-red-700">{error}</span>}
    </div>
  );
}
