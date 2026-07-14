"use client";

import { useState } from "react";
import { useCredits } from "@/lib/credit-context";

export function RedeemCreditsForm() {
  const { active, remaining, verifying, verifyError, verifyEmail, exit } = useCredits();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  if (active) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="font-label font-bold text-[13px] uppercase tracking-[0.18em] text-accent">
          {remaining} free download{remaining === 1 ? "" : "s"} remaining
        </span>
        <span className="text-[14px] text-secondary">
          — select your videos below.
        </span>
        <button
          onClick={exit}
          className="font-label font-bold text-[12px] uppercase tracking-[0.18em] text-muted underline underline-offset-2 hover:text-accent"
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
        className="w-full text-center font-label font-bold text-[13px] uppercase tracking-[0.18em] text-muted underline underline-offset-4 transition-colors duration-[180ms] hover:text-accent"
      >
        Have free downloads? Enter your email
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        verifyEmail(email);
      }}
      className="flex flex-wrap items-center justify-center gap-3"
    >
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
        disabled={verifying}
        className="rounded-xs bg-cta px-5 py-2.5 font-label font-bold text-[13px] uppercase tracking-[0.18em] text-cta-text transition-colors duration-[180ms] hover:bg-cta-hover disabled:opacity-50"
      >
        {verifying ? "Checking…" : "Unlock"}
      </button>
      {verifyError && <span className="text-[14px] text-red-700">{verifyError}</span>}
    </form>
  );
}
