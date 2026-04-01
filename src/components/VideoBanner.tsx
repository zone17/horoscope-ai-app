'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface VideoBannerProps {
  sign: string;
  autoPlayOnHover?: boolean;
}

export function VideoBanner({ sign, autoPlayOnHover = true }: VideoBannerProps) {
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Intersection Observer: detect when card enters viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInViewport(entry.isIntersecting);
          // If card scrolls out of view, stop video to save memory
          if (!entry.isIntersecting && videoRef.current) {
            videoRef.current.pause();
            setIsVideoActive(false);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (isInViewport && autoPlayOnHover && !videoError) {
      setIsVideoActive(true);
    }
  }, [isInViewport, autoPlayOnHover, videoError]);

  const handleMouseLeave = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsVideoActive(false);
  }, []);

  const handleTap = useCallback(() => {
    if (isInViewport && !videoError) {
      setIsVideoActive((prev) => !prev);
    }
  }, [isInViewport, videoError]);

  // Play/pause video when isVideoActive changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVideoActive) {
      video.play().catch(() => {
        // Autoplay blocked by browser policy — fall back to poster
        setIsVideoActive(false);
      });
    } else {
      video.pause();
    }
  }, [isVideoActive]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 bg-indigo-950 overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchEnd={handleTap}
    >
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-indigo-500/5 to-indigo-950/20 mix-blend-overlay"></div>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400/30 via-purple-500/50 to-indigo-400/30"></div>

      {/* Video — autoplay when in viewport, lazy loaded */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover brightness-110 contrast-125"
        loop
        muted
        playsInline
        autoPlay
        preload="none"
        onError={() => setVideoError(true)}
      >
        {isInViewport && (
          <source src={`/videos/zodiac/${sign}.mp4`} type="video/mp4" />
        )}
      </video>

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
