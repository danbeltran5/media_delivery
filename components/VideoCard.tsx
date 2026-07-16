"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";

export function VideoCard({
  id,
  title,
  description,
  priceCents,
  currency,
  playbackUrl,
  thumbnailUrl,
  purchased,
  orientation = "portrait",
  showWatermark = true,
  requirePurchase = true,
}: {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  currency: string;
  playbackUrl: string;
  thumbnailUrl: string;
  purchased: boolean;
  orientation?: "portrait" | "landscape";
  showWatermark?: boolean;
  requirePurchase?: boolean;
}) {
  const landscape = orientation === "landscape";
  const { isInCart, toggle } = useCart();
  const inCart = isInCart(id);

  const [hovering, setHovering] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRevealedOnce = useRef(false);

  function handleEnter() {
    if (unmountTimer.current) clearTimeout(unmountTimer.current);
    setMounted(true);
    setHovering(true);
    const delay = hasRevealedOnce.current ? 250 : 600;
    revealTimer.current = setTimeout(() => {
      setShowVideo(true);
      hasRevealedOnce.current = true;
    }, delay);
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

  useEffect(() => {
    if (!expanded) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setExpanded(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [expanded]);

  const [showDownloadHint, setShowDownloadHint] = useState(false);
  const downloadHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDownload() {
    window.open(`/api/download/${id}`, "_blank");
    setShowDownloadHint(true);
    if (downloadHintTimer.current) clearTimeout(downloadHintTimer.current);
    downloadHintTimer.current = setTimeout(() => setShowDownloadHint(false), 6000);
  }

  useEffect(() => {
    return () => {
      if (downloadHintTimer.current) clearTimeout(downloadHintTimer.current);
    };
  }, []);

  const buttonBase =
    "px-2.5 py-1 text-center font-label font-bold text-[10px] uppercase tracking-[0.14em] transition-colors duration-[180ms] sm:px-4 sm:py-2 sm:text-[12px] sm:tracking-[0.16em]";
  const ghostOlive = `${buttonBase} border border-olive text-olive hover:bg-olive hover:text-on-dark`;
  const filledOlive = `${buttonBase} border border-olive bg-olive text-on-dark hover:bg-olive/90`;

  return (
    <div>
      <div
        role="button"
        aria-label={`Play ${title}`}
        className={`relative w-full cursor-pointer overflow-hidden bg-dark ${
          landscape ? "aspect-[3/2]" : "aspect-[2/3]"
        }`}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onClick={() => setExpanded(true)}
      >
        {mounted && !expanded && (
          <iframe
            src={`${playbackUrl}?controls=false&muted=true&loop=true&autoplay=true&preload=metadata`}
            className={
              landscape
                ? "absolute left-1/2 top-0 h-full w-[118.52%] -translate-x-1/2"
                : "absolute left-0 top-1/2 h-[118.52%] w-full -translate-y-1/2"
            }
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
          {showWatermark && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src="/brand/watermark.png"
              alt=""
              className="absolute h-1/3 w-auto opacity-55"
            />
          )}
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white/80">
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
        {purchased || !requirePurchase ? (
          <button onClick={handleDownload} className={ghostOlive}>
            Download
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
      {showDownloadHint && (
        <p className="mt-1.5 text-right text-[12px] text-muted">
          Downloading in a new tab — you can close it once it&rsquo;s done.
        </p>
      )}

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 sm:p-12"
          onClick={() => setExpanded(false)}
        >
          <div
            className={
              landscape
                ? "relative aspect-[16/9] w-full max-w-4xl"
                : "relative aspect-[9/16] h-[85vh] max-w-full"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setExpanded(false)}
              aria-label="Close"
              className="absolute -top-10 right-0 text-[13px] uppercase tracking-[0.16em] text-white/80 transition-colors duration-[180ms] hover:text-white"
            >
              Close ✕
            </button>
            <iframe
              src={`${playbackUrl}?autoplay=true`}
              className="h-full w-full"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen
              title={title}
            />
            {showWatermark && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/watermark.png"
                  alt=""
                  className="h-1/3 w-auto opacity-40"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
