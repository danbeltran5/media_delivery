"use client";

import { useCart } from "@/lib/cart-context";
import { useCredits } from "@/lib/credit-context";

export function VideoCard({
  id,
  title,
  description,
  priceCents,
  currency,
  playbackUrl,
  purchased,
}: {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  currency: string;
  playbackUrl: string;
  purchased: boolean;
}) {
  const { isInCart, toggle } = useCart();
  const credits = useCredits();
  const inCart = isInCart(id);
  const selected = credits.selectedIds.includes(id);
  const atCap = !selected && credits.selectedIds.length >= credits.remaining;

  return (
    <div className="overflow-hidden rounded-sm border border-line bg-white transition-colors duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-strong">
      <div className="relative aspect-[9/16] w-full bg-dark">
        <iframe
          src={playbackUrl}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          title={title}
        />
      </div>
      <div className="flex flex-col gap-1.5 p-5 text-center">
        <h2 className="font-serif text-[19px] leading-[1.2] text-primary">
          {title}
        </h2>
        {description && (
          <p className="text-[14px] leading-[1.6] text-secondary">
            {description}
          </p>
        )}
        <div className="mt-3">
          {purchased ? (
            <a
              href={`/api/download/${id}`}
              className="block w-full rounded-xs bg-olive px-5 py-2.5 text-center font-label font-bold text-[13px] uppercase tracking-[0.18em] text-on-dark transition-colors duration-[180ms] hover:bg-olive/90"
            >
              Download
            </a>
          ) : credits.active ? (
            <button
              onClick={() => credits.toggle(id)}
              disabled={atCap}
              className={
                selected
                  ? "w-full rounded-xs border border-primary px-5 py-2.5 text-center font-label font-bold text-[13px] uppercase tracking-[0.18em] text-primary transition-colors duration-[180ms] hover:bg-hover"
                  : "w-full rounded-xs bg-olive px-5 py-2.5 text-center font-label font-bold text-[13px] uppercase tracking-[0.18em] text-on-dark transition-colors duration-[180ms] hover:bg-olive/90 disabled:opacity-40"
              }
            >
              {selected ? "Selected ✓" : "Select (free)"}
            </button>
          ) : (
            <button
              onClick={() => toggle({ id, title, priceCents, currency })}
              className={
                inCart
                  ? "w-full rounded-xs border border-primary px-5 py-2.5 text-center font-label font-bold text-[13px] uppercase tracking-[0.18em] text-primary transition-colors duration-[180ms] hover:bg-hover"
                  : "w-full rounded-xs bg-cta px-5 py-2.5 text-center font-label font-bold text-[13px] uppercase tracking-[0.18em] text-cta-text transition-colors duration-[180ms] hover:bg-cta-hover"
              }
            >
              {inCart ? "Added ✓" : "Add to cart"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
