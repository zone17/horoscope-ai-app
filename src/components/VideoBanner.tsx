'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoBannerProps {
  sign: string;
  autoPlayOnHover?: boolean;
}

export function VideoBanner({ sign }: VideoBannerProps) {
  const [isInViewport, setIsInViewport] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Intersection Observer: load and play video when in viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInViewport(entry.isIntersecting);
          if (!entry.isIntersecting && videoRef.current) {
            videoRef.current.pause();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Auto-play when in viewport
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isInViewport) return;

    video.play().catch(() => {
      // Autoplay blocked — video stays on first frame (still looks good)
    });
  }, [isInViewport]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 bg-indigo-950 overflow-hidden">
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-indigo-500/5 to-indigo-950/20 mix-blend-overlay"></div>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400/30 via-purple-500/50 to-indigo-400/30"></div>

      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover brightness-110 contrast-125"
        src={`/videos/zodiac/${sign}.mp4`}
        loop
        muted
        playsInline
        preload="metadata"
      />

      {/* Scan lines overlay */}
      <div
        className="absolute inset-0 z-20 opacity-10 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px)',
        }}
      ></div>

      {/* Bottom fade */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent to-indigo-950/80"></div>
    </div>
  );
}
