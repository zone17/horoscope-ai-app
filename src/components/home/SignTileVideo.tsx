'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Sign tile background video — lightweight version of VideoBanner sized for
 * the homepage sign-picker grid. Lazy-loaded via IntersectionObserver: video
 * preloads metadata only, plays when the tile enters the viewport, pauses
 * when it leaves. Twelve of these can render together at ~6 MB metadata
 * total without thrashing low-end mobile.
 *
 * Restored 2026-05-04 per operator decision (option A in the punch list).
 * The original VideoBanner went unwired during the homepage redesign in
 * PR #36; the video assets at public/videos/zodiac/{sign}.mp4 stayed.
 */
export function SignTileVideo({ sign }: { sign: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInView(entry.isIntersecting);
          if (!entry.isIntersecting && videoRef.current) {
            videoRef.current.pause();
          }
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !inView) return;
    video.play().catch(() => {
      // Autoplay blocked. Tile shows the first frame, which still looks fine.
    });
  }, [inView]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden rounded-xl pointer-events-none"
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        src={`/videos/zodiac/${sign}.mp4`}
        loop
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover opacity-40 brightness-90"
      />
      {/* Dark overlay so foreground text and constellation icon stay legible */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-indigo-950/55 to-indigo-950/85" />
    </div>
  );
}
