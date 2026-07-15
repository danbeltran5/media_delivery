"use client";

import { useState } from "react";
import Link from "next/link";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function AdminClientRow({
  id,
  name,
  slug,
  videoCount,
  purchaseCount,
  downloadedCount,
  revenueCents,
}: {
  id: string;
  name: string;
  slug: string;
  videoCount: number;
  purchaseCount: number;
  downloadedCount: number;
  revenueCents: number;
}) {
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(name);
  const [slugValue, setSlugValue] = useState(slug);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue, slug: slugValue }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
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

  if (editing) {
    return (
      <tr className="border-b border-hairline">
        <td colSpan={6} className="px-4 py-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-label font-bold text-[11px] uppercase tracking-[0.18em] text-muted">
                Name
              </label>
              <input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="border border-line bg-canvas px-3 py-1.5 text-[14px] text-primary outline-none focus:border-strong"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label font-bold text-[11px] uppercase tracking-[0.18em] text-muted">
                URL slug (/...)
              </label>
              <input
                value={slugValue}
                onChange={(e) => setSlugValue(e.target.value)}
                className="border border-line bg-canvas px-3 py-1.5 text-[14px] text-primary outline-none focus:border-strong"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xs bg-cta px-4 py-1.5 font-label font-bold text-[12px] uppercase tracking-[0.18em] text-cta-text hover:bg-cta-hover disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setNameValue(name);
                setSlugValue(slug);
                setError(null);
              }}
              className="border border-line px-4 py-1.5 font-label font-bold text-[12px] uppercase tracking-[0.18em] text-secondary hover:bg-hover"
            >
              Cancel
            </button>
          </div>
          {slugValue !== slug && (
            <p className="mt-2 text-[13px] text-muted">
              Changing the URL breaks any link you&rsquo;ve already sent this
              client — they&rsquo;d need the new one.
            </p>
          )}
          {error && <p className="mt-2 text-[13px] text-red-700">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-hairline">
      <td className="px-4 py-4">
        <div className="font-serif text-[18px] text-primary">{name}</div>
        <Link
          href={`/${slug}`}
          target="_blank"
          className="text-[13px] text-accent underline underline-offset-2"
        >
          /{slug}
        </Link>
      </td>
      <td className="px-4 py-4 text-[14px] text-secondary">{videoCount}</td>
      <td className="px-4 py-4 text-[14px] text-secondary">{purchaseCount}</td>
      <td className="px-4 py-4 text-[14px] text-secondary">
        {downloadedCount}/{purchaseCount}
      </td>
      <td className="px-4 py-4 text-[14px] text-secondary">
        {formatPrice(revenueCents)}
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex justify-end gap-3">
          <Link
            href={`/admin/${slug}`}
            className="font-label font-bold text-[12px] uppercase tracking-[0.18em] text-accent underline underline-offset-2"
          >
            Details
          </Link>
          <button
            onClick={() => setEditing(true)}
            className="font-label font-bold text-[12px] uppercase tracking-[0.18em] text-muted underline underline-offset-2 hover:text-accent"
          >
            Rename
          </button>
        </div>
      </td>
    </tr>
  );
}
