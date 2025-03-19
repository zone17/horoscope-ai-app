'use client';

import { useEffect, useState } from 'react';

interface VideoBannerProps {
  sign: string;
}

export function VideoBanner({ sign }: VideoBannerProps) {
  const [videoError, setVideoError] = useState(false);

  // Create a fallback gradient based on the zodiac sign
  const getGradientForSign = (sign: string) => {
    const gradients: Record<string, string> = {
      aries: 'linear-gradient(to right, #FF416C, #FF4B2B)',
      taurus: 'linear-gradient(to right, #76b852, #8DC26F)',
      gemini: 'linear-gradient(to right, #00c6ff, #0072ff)',
      cancer: 'linear-gradient(to right, #2193b0, #6dd5ed)',
      leo: 'linear-gradient(to right, #f12711, #f5af19)',
      virgo: 'linear-gradient(to right, #8e2de2, #4a00e0)',
      libra: 'linear-gradient(to right, #614385, #516395)',
      scorpio: 'linear-gradient(to right, #3a1c71, #d76d77, #ffaf7b)',
      sagittarius: 'linear-gradient(to right, #c31432, #240b36)',
      capricorn: 'linear-gradient(to right, #0F2027, #203A43, #2C5364)',
      aquarius: 'linear-gradient(to right, #1FA2FF, #12D8FA, #A6FFCB)',
      pisces: 'linear-gradient(to right, #6a11cb, #2575fc)',
    };
    
    return gradients[sign] || 'linear-gradient(to right, #4b6cb7, #182848)';
  };

  // Handle video error by showing a gradient background
  const handleVideoError = () => {
    console.error(`Error loading video for ${sign}`);
    setVideoError(true);
  };

  return (
    <div className="absolute inset-0 z-0 bg-indigo-950">
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-indigo-500/5 to-indigo-950/20 mix-blend-overlay"></div>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400/30 via-purple-500/50 to-indigo-400/30"></div>
      {videoError ? (
        <div 
          className="w-full h-full overflow-hidden" 
          style={{ background: getGradientForSign(sign) }}
        />
      ) : (
        <video 
          className="w-full h-full object-cover brightness-110 contrast-125"
          loop
          muted
          playsInline
          autoPlay
          onError={handleVideoError}
        >
          <source src={`/videos/zodiac/${sign}.mp4`} type="video/mp4" />
        </video>
      )}
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