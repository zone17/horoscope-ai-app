'use client';

import { useEffect, useState, useRef } from 'react';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';

interface VideoBannerProps {
  sign: string;
}

export function VideoBanner({ sign }: VideoBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const isCoreWebVitalsEnabled = isFeatureEnabled(FEATURE_FLAGS.USE_CORE_WEB_VITALS_OPTIMIZATIONS, false);
  
  // Use preload for the first sign to improve LCP
  const shouldPreload = sign === 'aries' && isCoreWebVitalsEnabled;
  
  useEffect(() => {
    if (!videoRef.current) return;
    
    // Add event listeners for video load tracking
    const videoElement = videoRef.current;
    
    const handleLoad = () => {
      setIsLoaded(true);
    };
    
    // For Core Web Vitals: optimize video loading
    if (isCoreWebVitalsEnabled) {
      // Add loading listener
      videoElement.addEventListener('loadeddata', handleLoad);
      
      // Set playback quality to lower for faster loading
      if ('playsInline' in videoElement) {
        videoElement.playsInline = true;
      }
      
      if ('disablePictureInPicture' in videoElement) {
        videoElement.disablePictureInPicture = true;
      }
      
      // Reduce initial load by setting video to low quality
      if (typeof videoElement.canPlayType === 'function' && videoElement.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')) {
        // Browser supports basic h.264 profile - good for performance
        // Can be upgraded after initial load
      }
    }
    
    return () => {
      videoElement.removeEventListener('loadeddata', handleLoad);
    };
  }, [sign, isCoreWebVitalsEnabled]);
  
  return (
    <div className="absolute inset-0 z-0 bg-indigo-950">
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-indigo-500/5 to-indigo-950/20 mix-blend-overlay"></div>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400/30 via-purple-500/50 to-indigo-400/30"></div>
      
      {/* Show a placeholder while video loads, to improve CLS */}
      {!isLoaded && isCoreWebVitalsEnabled && (
        <div 
          className="absolute inset-0 bg-indigo-900/50"
          aria-hidden="true"
          style={{ aspectRatio: '16/9' }}
        />
      )}
      
      <video 
        ref={videoRef}
        id={`video-${sign}`}
        className="w-full h-full object-cover brightness-110 contrast-125"
        loop
        muted
        playsInline
        autoPlay
        preload={shouldPreload ? "auto" : "metadata"}
        width="640"
        height="360"
        style={{ aspectRatio: '16/9' }}
        onLoadedData={() => setIsLoaded(true)}
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