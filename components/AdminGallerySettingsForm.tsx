"use client";

import { useState } from "react";

type Settings = {
  landscape: boolean;
  watermark: boolean;
  showAccessForm: boolean;
};

export function AdminGallerySettingsForm({
  clientId,
  orientation,
  watermark,
  showAccessForm,
}: {
  clientId: string;
  orientation: string;
  watermark: boolean;
  showAccessForm: boolean;
}) {
  const [settings, setSettings] = useState<Settings>({
    landscape: orientation === "landscape",
    watermark,
    showAccessForm,
  });
  const [saving, setSaving] = useState<keyof Settings | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(key: keyof Settings, value: boolean) {
    const previous = settings[key];
    setSettings((s) => ({ ...s, [key]: value }));
    setSaving(key);
    setError(null);

    const body =
      key === "landscape"
        ? { orientation: value ? "landscape" : "portrait" }
        : { [key]: value };

    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSettings((s) => ({ ...s, [key]: previous }));
        setError(data?.error ?? "Could not save");
        return;
      }
    } catch {
      setSettings((s) => ({ ...s, [key]: previous }));
      setError("Something went wrong");
    } finally {
      setSaving(null);
    }
  }

  const rows: { key: keyof Settings; label: string }[] = [
    { key: "landscape", label: "Landscape (horizontal) thumbnails" },
    { key: "watermark", label: "Show DT watermark on thumbnails" },
    { key: "showAccessForm", label: "Show restore-purchase / credits link in header" },
  ];

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <label key={row.key} className="flex items-center gap-2 text-[14px] text-primary">
          <input
            type="checkbox"
            checked={settings[row.key]}
            disabled={saving === row.key}
            onChange={(e) => handleChange(row.key, e.target.checked)}
            className="h-4 w-4 border-line accent-olive"
          />
          {row.label}
        </label>
      ))}
      {error && <span className="text-[12px] text-red-700">{error}</span>}
    </div>
  );
}
