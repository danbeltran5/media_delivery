"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useCredits } from "@/lib/credit-context";

export function VideoCard({
  id,
  title,
  description,
  priceCents,
  currency,
  playbackUrl,
  thumbnailUrl,
  purchased,
}: {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  currency: string;
  playbackUrl: string;
  thumbnailUrl: string;
  purchased: boolean;
}) {
  const { isInCart, toggle } = useCart();
  const credits = useCredits();
  const inCart = isInCart(id);
  const selected = credits.selectedIds.includes(id);
  const atCap = !selected && credits.selectedIds.length >= credits.remaining;

  const [hovering, setHovering] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleEnter() {
    if (unmountTimer.current) clearTimeout(unmountTimer.current);
    setMounted(true);
    setHovering(true);
    revealTimer.current = setTimeout(() => setShowVideo(true), 250);
  }

  function handleLeave() {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    setHovering(false);
    setShowVideo(false);
    unmountTimer.current = setTimeout(() => setMounted(false), 220);
  }

  useEffect(() => {
    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
      if (unmountTimer.current) clearTimeout(unmountTimer.current);
    };
  }, []);

  const buttonBase =
    "px-4 py-2 text-center font-label font-bold text-[12px] uppercase tracking-[0.16em] transition-colors duration-[180ms]";
  const ghostOlive = `${buttonBase} border border-olive text-olive hover:bg-olive hover:text-on-dark`;
  const filledOlive = `${buttonBase} border border-olive bg-olive text-on-dark hover:bg-olive/90`;

  return (
    <div>
      <div
        className="relative aspect-[2/3] w-full overflow-hidden border border-line bg-dark transition-colors duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-strong"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {mounted && (
          <iframe
            src={`${playbackUrl}?controls=false&muted=true&loop=true&autoplay=true&preload=metadata`}
            className="absolute left-0 top-1/2 h-[118.52%] w-full -translate-y-1/2"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
            title={title}
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[220ms] ${
            showVideo ? "opacity-0" : "opacity-100"
          }`}
        />
        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-[180ms] ${
            hovering ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/80">
            <svg
              viewBox="0 0 16 16"
              className="ml-0.5 h-3 w-3 fill-white"
              aria-hidden="true"
            >
              <path d="M3 1.5v13l11-6.5z" />
            </svg>
          </span>
        </div>
      </div>
      <div className="mt-3.5 flex items-end justify-between gap-3">
        <div className="text-left">
          <span className="font-label font-bold text-[11px] uppercase tracking-[0.14em] text-primary">
            {title}
          </span>
          {description && (
            <p className="mt-1 text-[13px] leading-[1.5] text-secondary">
              {description}
            </p>
          )}
        </div>
        {purchased ? (
          <a href={`/api/download/${id}`} className={ghostOlive}>
            Download
          </a>
        ) : credits.active ? (
          <button
            onClick={() => credits.toggle(id)}
            disabled={atCap}
            className={`${selected ? filledOlive : ghostOlive} disabled:opacity-40`}
          >
            {selected ? "Selected" : "Select (free)"}
          </button>
        ) : (
          <button
            onClick={() => toggle({ id, title, priceCents, currency })}
            className={inCart ? filledOlive : ghostOlive}
          >
            {inCart ? "Added" : "Add to cart"}
          </button>
        )}
      </div>
    </div>
  );
}
