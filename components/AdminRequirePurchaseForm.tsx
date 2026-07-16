"use client";

import { useState } from "react";

export function AdminRequirePurchaseForm({
  clientId,
  requirePurchase,
}: {
  clientId: string;
  requirePurchase: boolean;
}) {
  const [checked, setChecked] = useState(requirePurchase);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: boolean) {
    setChecked(next);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirePurchase: next }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setChecked(!next);
        setError(data?.error ?? "Could not save");
        return;
      }
    } catch {
      setChecked(!next);
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-[14px] text-primary">
        <input
          type="checkbox"
          checked={checked}
          disabled={saving}
          onChange={(e) => handleChange(e.target.checked)}
          className="h-4 w-4 border-line accent-olive"
        />
        Require purchase before download
      </label>
      <p className="text-[13px] text-muted">
        {checked
          ? "Videos go through the cart and Stripe checkout, even at $0."
          : "Every video shows a plain Download button — no cart, no checkout."}
      </p>
      {error && <span className="text-[12px] text-red-700">{error}</span>}
    </div>
  );
}
