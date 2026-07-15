"use client";

import { createContext, useContext, useMemo, useState } from "react";

type CreditContextValue = {
  active: boolean;
  email: string | null;
  remaining: number;
  selectedIds: string[];
  /** Checks credits for an email and, if any are found, activates credit mode. Returns the remaining count (0 if none). */
  verifyEmail: (email: string) => Promise<number>;
  toggle: (videoId: string) => void;
  exit: () => void;
};

const CreditContext = createContext<CreditContextValue | null>(null);

export function CreditProvider({
  clientSlug,
  children,
}: {
  clientSlug: string;
  children: React.ReactNode;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const value = useMemo<CreditContextValue>(() => {
    const verifyEmail = async (candidate: string) => {
      try {
        const res = await fetch("/api/credits/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientSlug, email: candidate }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.remaining || data.remaining <= 0) return 0;

        setEmail(candidate.trim());
        setRemaining(data.remaining);
        setSelectedIds([]);
        return data.remaining as number;
      } catch {
        return 0;
      }
    };

    const toggle = (videoId: string) => {
      setSelectedIds((prev) => {
        if (prev.includes(videoId)) return prev.filter((id) => id !== videoId);
        if (prev.length >= remaining) return prev;
        return [...prev, videoId];
      });
    };

    const exit = () => {
      setEmail(null);
      setRemaining(0);
      setSelectedIds([]);
    };

    return {
      active: email !== null && remaining > 0,
      email,
      remaining,
      selectedIds,
      verifyEmail,
      toggle,
      exit,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, remaining, selectedIds]);

  return <CreditContext.Provider value={value}>{children}</CreditContext.Provider>;
}

export function useCredits() {
  const ctx = useContext(CreditContext);
  if (!ctx) throw new Error("useCredits must be used within a CreditProvider");
  return ctx;
}
