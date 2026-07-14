"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { CheckoutPanel } from "@/components/CheckoutPanel";

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function CartBar() {
  const { items, totalCents, currency } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <>
      <div className="sticky bottom-0 z-40 border-t border-hairline bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 sm:px-10">
          <span className="text-[15px] text-secondary">
            {items.length} video{items.length === 1 ? "" : "s"} selected —{" "}
            <span className="text-primary">
              {formatPrice(totalCents, currency)}
            </span>
          </span>
          <button
            onClick={() => setCheckoutOpen(true)}
            className="rounded-xs bg-cta px-6 py-3 font-label text-[13px] uppercase tracking-[0.12em] text-cta-text transition-colors duration-[180ms] hover:bg-cta-hover"
          >
            Checkout
          </button>
        </div>
      </div>
      {checkoutOpen && (
        <CheckoutPanel onClose={() => setCheckoutOpen(false)} />
      )}
    </>
  );
}
