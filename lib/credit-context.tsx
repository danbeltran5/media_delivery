"use client";

import { createContext, useContext, useMemo, useState } from "react";

type CreditContextValue = {
  active: boolean;
  email: string | null;
  remaining: number;
  /** Checks credits for an email and, if any are found, activates credit mode. Returns the remaining count (0 if none). */
  verifyEmail: (email: string) => Promise<number>;
  /** Re-fetches the remaining count for the currently active email (e.g. after redeeming some). */
  refresh: () => Promise<void>;
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

  const value = useMemo<CreditContextValue>(() => {
    async function check(candidate: string) {
      const res = await fetch("/api/credits/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSlug, email: candidate }),
      });
      const data = await res.json().catch(() => null);
      return res.ok && typeof data?.remaining === "number" ? data.remaining : 0;
    }

    const verifyEmail = async (candidate: string) => {
      try {
        const found = await check(candidate);
        if (found <= 0) return 0;
        setEmail(candidate.trim());
        setRemaining(found);
        return found;
      } catch {
        return 0;
      }
    };

    const refresh = async () => {
      if (!email) return;
      try {
        setRemaining(await check(email));
      } catch {
        // leave remaining as-is on transient failure
      }
    };

    const exit = () => {
      setEmail(null);
      setRemaining(0);
    };

    return {
      active: email !== null && remaining > 0,
      email,
      remaining,
      verifyEmail,
      refresh,
      exit,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, remaining]);

  return <CreditContext.Provider value={value}>{children}</CreditContext.Provider>;
}

export function useCredits() {
  const ctx = useContext(CreditContext);
  if (!ctx) throw new Error("useCredits must be used within a CreditProvider");
  return ctx;
}
