"use client";

import { useState } from "react";

export function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Could not log in");
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
    <main className="mx-auto flex max-w-sm flex-1 flex-col justify-center px-6 py-24">
      <h1 className="font-serif text-[28px] text-primary">Admin</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <input
          type="password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="rounded-xs border border-line bg-canvas px-3.5 py-2.5 text-[15px] text-primary outline-none transition-colors duration-[180ms] focus:border-strong"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xs bg-cta px-5 py-2.5 font-label text-[13px] uppercase tracking-[0.12em] text-cta-text transition-colors duration-[180ms] hover:bg-cta-hover disabled:opacity-50"
        >
          {loading ? "Checking…" : "Log in"}
        </button>
        {error && <p className="text-[14px] text-red-700">{error}</p>}
      </form>
    </main>
  );
}
