"use client";

import { createContext, useContext, useMemo, useState } from "react";

type CreditContextValue = {
  active: boolean;
  email: string | null;
  remaining: number;
  selectedIds: string[];
  verifying: boolean;
  verifyError: string | null;
  verifyEmail: (email: string) => Promise<void>;
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
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const value = useMemo<CreditContextValue>(() => {
    const verifyEmail = async (candidate: string) => {
      setVerifying(true);
      setVerifyError(null);
      try {
        const res = await fetch("/api/credits/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientSlug, email: candidate }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setVerifyError(data?.error ?? "Could not check credits");
          return;
        }
        if (!data.remaining || data.remaining <= 0) {
          setVerifyError("No free downloads found for that email");
          return;
        }
        setEmail(candidate.trim());
        setRemaining(data.remaining);
        setSelectedIds([]);
      } catch {
        setVerifyError("Something went wrong");
      } finally {
        setVerifying(false);
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
      setVerifyError(null);
    };

    return {
      active: email !== null && remaining > 0,
      email,
      remaining,
      selectedIds,
      verifying,
      verifyError,
      verifyEmail,
      toggle,
      exit,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, remaining, selectedIds, verifying, verifyError]);

  return <CreditContext.Provider value={value}>{children}</CreditContext.Provider>;
}

export function useCredits() {
  const ctx = useContext(CreditContext);
  if (!ctx) throw new Error("useCredits must be used within a CreditProvider");
  return ctx;
}
