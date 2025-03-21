'use client';

import { useEffect, useState } from 'react';

interface VideoBannerProps {
  sign: string;
}

export function VideoBanner({ sign }: VideoBannerProps) {
  return (
    <div className="absolute inset-0 z-0 bg-indigo-950">
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-indigo-500/5 to-indigo-950/20 mix-blend-overlay"></div>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400/30 via-purple-500/50 to-indigo-400/30"></div>
      <video 
        id={`video-${sign}`}
        className="w-full h-full object-cover brightness-110 contrast-125"
        loop
        muted
        playsInline
        autoPlay
      >
        <source src={`/videos/zodiac/${sign}.mp4`} type="video/mp4" />
      </video>
      {/* Add projection-like scan lines */}
      <div 
        className="absolute inset-0 z-20 opacity-10 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px)'
        }}
      ></div>
      {/* Add subtle color edges for projection effect */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent to-indigo-950/80"></div>
    </div>
  );
} 