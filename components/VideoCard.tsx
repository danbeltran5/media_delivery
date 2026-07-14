"use client";

import { useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useCredits } from "@/lib/credit-context";

type StreamPlayer = {
  play: () => Promise<void>;
  pause: () => void;
  muted: boolean;
  currentTime: number;
};

declare global {
  interface Window {
    Stream?: (el: HTMLIFrameElement) => StreamPlayer;
  }
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
  const credits = useCredits();
  const inCart = isInCart(id);
  const selected = credits.selectedIds.includes(id);
  const atCap = !selected && credits.selectedIds.length >= credits.remaining;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<StreamPlayer | null>(null);
  const [playing, setPlaying] = useState(false);

  function getPlayer() {
    if (!playerRef.current && iframeRef.current && window.Stream) {
      playerRef.current = window.Stream(iframeRef.current);
    }
    return playerRef.current;
  }

  function handleEnter() {
    const player = getPlayer();
    if (!player) return;
    player.muted = true;
    setPlaying(true);
    player.play().catch(() => setPlaying(false));
  }

  function handleLeave() {
    const player = getPlayer();
    if (!player) return;
    player.pause();
    player.currentTime = 0;
    setPlaying(false);
  }

  return (
    <div className="overflow-hidden border border-line bg-white transition-colors duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-strong">
      <div
        className="relative aspect-[9/16] w-full bg-dark"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <iframe
          ref={iframeRef}
          src={`${playbackUrl}?controls=false&muted=true&loop=true&preload=metadata`}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          title={title}
        />
        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-[180ms] ${
            playing ? "opacity-0" : "opacity-100"
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
              className="block w-full bg-olive px-5 py-2.5 text-center font-label font-bold text-[13px] uppercase tracking-[0.18em] text-on-dark transition-colors duration-[180ms] hover:bg-olive/90"
            >
              Download
            </a>
          ) : credits.active ? (
            <button
              onClick={() => credits.toggle(id)}
              disabled={atCap}
              className={
                selected
                  ? "w-full border border-primary px-5 py-2.5 text-center font-label font-bold text-[13px] uppercase tracking-[0.18em] text-primary transition-colors duration-[180ms] hover:bg-hover"
                  : "w-full bg-olive px-5 py-2.5 text-center font-label font-bold text-[13px] uppercase tracking-[0.18em] text-on-dark transition-colors duration-[180ms] hover:bg-olive/90 disabled:opacity-40"
              }
            >
              {selected ? "Selected" : "Select (free)"}
            </button>
          ) : (
            <button
              onClick={() => toggle({ id, title, priceCents, currency })}
              className={
                inCart
                  ? "w-full border border-primary px-5 py-2.5 text-center font-label font-bold text-[13px] uppercase tracking-[0.18em] text-primary transition-colors duration-[180ms] hover:bg-hover"
                  : "w-full bg-cta px-5 py-2.5 text-center font-label font-bold text-[13px] uppercase tracking-[0.18em] text-cta-text transition-colors duration-[180ms] hover:bg-cta-hover"
              }
            >
              {inCart ? "Added" : "Add to cart"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
