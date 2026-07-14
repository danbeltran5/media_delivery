"use client";

import { useCallback, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { useCart } from "@/lib/cart-context";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export function CheckoutPanel({ onClose }: { onClose: () => void }) {
  const { items } = useCart();
  const [error, setError] = useState<string | null>(null);
  const videoIds = items.map((i) => i.id);

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoIds }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.clientSecret) {
      setError(data?.error ?? "Could not start checkout");
      throw new Error(data?.error ?? "Could not start checkout");
    }
    return data.clientSecret as string;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!stripePromise) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
        <div className="max-w-sm rounded-sm border border-line bg-canvas p-8 text-center">
          <p className="text-[15px] text-red-700">
            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set.
          </p>
          <button
            onClick={onClose}
            className="mt-5 rounded-xs bg-cta px-5 py-2.5 font-label text-[13px] uppercase tracking-[0.12em] text-cta-text hover:bg-cta-hover"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4 sm:items-center">
      <div className="w-full max-w-2xl rounded-sm border border-line bg-canvas p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-[24px] text-primary">Checkout</h2>
          <button
            onClick={onClose}
            aria-label="Close checkout"
            className="rounded-full px-2 py-1 text-muted transition-colors duration-[180ms] hover:text-accent"
          >
            ✕
          </button>
        </div>
        {error ? (
          <p className="text-[15px] text-red-700">{error}</p>
        ) : (
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ fetchClientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        )}
      </div>
    </div>
  );
}
