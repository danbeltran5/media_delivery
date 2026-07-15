"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useCredits } from "@/lib/credit-context";
import { CheckoutPanel } from "@/components/CheckoutPanel";

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function CartBar({ clientSlug }: { clientSlug: string }) {
  const { items, removeMany, currency } = useCart();
  const credits = useCredits();
  const [checkoutIds, setCheckoutIds] = useState<string[] | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) return null;

  const freeCount = credits.active
    ? Math.min(credits.remaining, items.length)
    : 0;
  const freeItems = items.slice(0, freeCount);
  const paidItems = items.slice(freeCount);
  const payableCents = paidItems.reduce((sum, i) => sum + i.priceCents, 0);

  async function handleCheckout() {
    setError(null);

    if (freeItems.length === 0) {
      setCheckoutIds(paidItems.map((i) => i.id));
      return;
    }

    setRedeeming(true);
    try {
      const res = await fetch("/api/credits/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientSlug,
          email: credits.email,
          videoIds: freeItems.map((i) => i.id),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Could not redeem your free downloads");
        setRedeeming(false);
        return;
      }
      removeMany(freeItems.map((i) => i.id));
      await credits.refresh();
      setRedeeming(false);
      if (paidItems.length === 0) {
        window.location.reload();
        return;
      }
      setCheckoutIds(paidItems.map((i) => i.id));
    } catch {
      setError("Something went wrong");
      setRedeeming(false);
    }
  }

  return (
    <>
      <div className="sticky bottom-0 z-40 border-t border-hairline bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4 sm:px-10">
          <div className="flex max-h-32 flex-col gap-1 overflow-y-auto">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 text-[13px]"
              >
                <span className="text-secondary">{item.title}</span>
                <span className="flex items-center gap-3">
                  <span
                    className={
                      index < freeCount
                        ? "font-label font-bold uppercase tracking-[0.1em] text-accent"
                        : "text-primary"
                    }
                  >
                    {index < freeCount
                      ? "Free (credit)"
                      : formatPrice(item.priceCents, item.currency)}
                  </span>
                  <button
                    onClick={() => removeMany([item.id])}
                    aria-label={`Remove ${item.title} from cart`}
                    className="text-muted transition-colors duration-[180ms] hover:text-accent"
                  >
                    ✕
                  </button>
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-hairline pt-3">
            <span className="text-[15px] text-secondary">
              {items.length} video{items.length === 1 ? "" : "s"} selected —{" "}
              <span className="text-primary">
                {formatPrice(payableCents, currency)}
              </span>
              {error && <span className="ml-3 text-red-700">{error}</span>}
            </span>
            <button
              onClick={handleCheckout}
              disabled={redeeming}
              className="rounded-xs bg-cta px-6 py-3 font-label font-bold text-[13px] uppercase tracking-[0.18em] text-cta-text transition-colors duration-[180ms] hover:bg-cta-hover disabled:opacity-50"
            >
              {redeeming ? "Redeeming…" : "Checkout"}
            </button>
          </div>
        </div>
      </div>
      {checkoutIds && (
        <CheckoutPanel videoIds={checkoutIds} onClose={() => setCheckoutIds(null)} />
      )}
    </>
  );
}
