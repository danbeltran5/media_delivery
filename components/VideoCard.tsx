"use client";

import { useCart } from "@/lib/cart-context";

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

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
  const inCart = isInCart(id);

  return (
    <div className="overflow-hidden rounded-sm border border-line bg-card transition-colors duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-strong">
      <div className="relative aspect-[9/16] w-full border-b border-hairline bg-dark">
        <iframe
          src={playbackUrl}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          title={title}
        />
      </div>
      <div className="flex flex-col gap-2 p-6">
        <h2 className="font-serif text-[22px] leading-[1.2] text-primary">
          {title}
        </h2>
        {description && (
          <p className="text-[15px] leading-[1.6] text-secondary">
            {description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-label text-[13px] uppercase tracking-[0.06em] text-muted">
            {formatPrice(priceCents, currency)} to download
          </span>
          {purchased ? (
            <a
              href={`/api/download/${id}`}
              className="rounded-xs bg-olive px-5 py-2.5 font-label text-[13px] uppercase tracking-[0.12em] text-on-dark transition-colors duration-[180ms] hover:bg-olive/90"
            >
              Download
            </a>
          ) : (
            <button
              onClick={() => toggle({ id, title, priceCents, currency })}
              className={
                inCart
                  ? "rounded-xs border border-primary px-5 py-2.5 font-label text-[13px] uppercase tracking-[0.12em] text-primary transition-colors duration-[180ms] hover:bg-hover"
                  : "rounded-xs bg-cta px-5 py-2.5 font-label text-[13px] uppercase tracking-[0.12em] text-cta-text transition-colors duration-[180ms] hover:bg-cta-hover"
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
