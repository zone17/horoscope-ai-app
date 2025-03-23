'use client';

import { useEffect, useState, useRef } from 'react';
import { isFeatureEnabled, FEATURE_FLAGS } from '@/utils/feature-flags';
import { getFixedImageDimensions } from '@/utils/web-vitals';

interface VideoBannerProps {
  sign: string;
}

export function VideoBanner({ sign }: VideoBannerProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isCoreWebVitalsOptEnabled = typeof window !== 'undefined' && 
    isFeatureEnabled(FEATURE_FLAGS.USE_CORE_WEB_VITALS_OPT, false);
  
  // Get fixed dimensions to prevent layout shifts
  const dimensions = getFixedImageDimensions(sign);
  
  useEffect(() => {
    if (!videoRef.current) return;
    
    const handleLoadedMetadata = () => {
      setIsVideoLoaded(true);
    };
    
    const videoElement = videoRef.current;
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    // If the video is already loaded when this effect runs
    if (videoElement.readyState >= 2) {
      setIsVideoLoaded(true);
    }
    
    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  return (
    <div 
      className="absolute inset-0 z-0 bg-indigo-950 overflow-hidden"
      style={isCoreWebVitalsOptEnabled ? {
        width: dimensions.width,
        height: dimensions.height,
        maxWidth: '100%',
        aspectRatio: `${dimensions.width} / ${dimensions.height}`
      } : undefined}
    >
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-indigo-500/5 to-indigo-950/20 mix-blend-overlay"></div>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400/30 via-purple-500/50 to-indigo-400/30"></div>
      
      {/* Low-quality placeholder shown while video loads */}
      {!isVideoLoaded && isCoreWebVitalsOptEnabled && (
        <div 
          className="absolute inset-0 bg-indigo-900 animate-pulse"
          style={{
            backgroundImage: `url("/images/placeholders/${sign}.jpg")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          aria-hidden="true"
        />
      )}
      
      <video 
        ref={videoRef}
        id={`video-${sign}`}
        className={`w-full h-full object-cover brightness-110 contrast-125 ${!isVideoLoaded && isCoreWebVitalsOptEnabled ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        loop
        muted
        playsInline
        autoPlay
        poster={isCoreWebVitalsOptEnabled ? `/images/placeholders/${sign}.jpg` : undefined}
        loading={isCoreWebVitalsOptEnabled ? "lazy" : undefined}
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