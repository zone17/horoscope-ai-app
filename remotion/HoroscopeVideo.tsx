/**
 * HoroscopeVideo — three vertical compositions in one shell (1080×1920 @ 30fps)
 *
 * Branches on `videoType`:
 *   - "morning" : 30s — sign hook → reading body → outro
 *   - "quote"   : 22s — sign hook + "TODAY'S WISDOM" → quote body + attribution → outro
 *   - "night"   : 28s — "TONIGHT" hook → peaceful thought → outro
 *
 * The shared shell (background, atmosphere, audio) is applied for every
 * type; only scene content differs. Each type voices ONLY its own content
 * — the morning voice doesn't say "Aries", the quote voice doesn't say
 * the reading, etc.
 *
 * Design (motion + typography research synthesis):
 * - Editorial Fraunces (display, italic) + Inter (body) pairing
 * - Spring-driven word entry: damping 14, stiffness 180, mass 0.5
 * - Active-word highlight: scale 1.06 + per-sign accent color
 * - Spoken-but-past words persist at 92% opacity (research: keeps line readable)
 * - Background discipline: zodiac loop blurred at 18px, slow Ken Burns 1.02→1.10
 * - Atmosphere: radial vignette + sparse star particles + film grain
 */
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  staticFile,
  OffthreadVideo,
  Audio,
  spring,
  Easing,
  Loop,
} from "remotion";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: fraunces } = loadFraunces("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});
const { fontFamily: fraunces_italic } = loadFraunces("italic", {
  weights: ["400", "600"],
  subsets: ["latin"],
});
const { fontFamily: inter } = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const CREAM = "#F5F1E8";
const CREAM_DIM = "rgba(245, 241, 232, 0.55)";

/**
 * Per-sign zodiac background video duration in frames (30fps).
 * The background OffthreadVideo gets wrapped in <Loop> using these
 * values so it cycles through the full composition duration instead
 * of freezing on the last frame. Computed via ffprobe on each MP4
 * in public/videos/zodiac/; update if source files are replaced.
 */
const ZODIAC_VIDEO_FRAMES: Record<string, number> = {
  aquarius:    634,  // 21.12s
  aries:       600,  // 20.00s
  cancer:      942,  // 31.41s
  capricorn:   728,  // 24.28s
  gemini:     1308,  // 43.61s
  leo:         632,  // 21.06s
  libra:       450,  // 15.00s
  pisces:     1786,  // 59.53s
  sagittarius: 801,  // 26.70s
  scorpio:    1142,  // 38.08s
  taurus:     1032,  // 34.40s
  virgo:       543,  // 18.09s
};
const DEFAULT_ZODIAC_LOOP_FRAMES = 600; // 20s fallback

export type VideoType = "morning" | "quote" | "night";

interface SubtitleCue {
  startMs: number;
  endMs: number;
  text: string;
  words?: Array<{ text: string; startMs: number; endMs: number }>;
}

interface HoroscopeVideoProps {
  videoType: VideoType;
  sign: string;
  date: string;
  message: string;
  quote: string;
  quoteAuthor: string;
  peacefulThought: string;
  /** Per-sign accent color (named `elementColor` for backwards-compat). */
  elementColor: string;
  symbol: string;
  voiceoverSrc?: string;
  ambientSrc?: string;
  voiceoverDurationMs?: number;
  subtitleCues?: SubtitleCue[];
  /** Morning videos only: ms timestamp at which the spoken intro
   *  ("Aries. Tuesday, April 28th.") finishes. The hook scene stays on
   *  screen through this point so the visual sign+date matches the voice;
   *  the content scene picks up immediately after. When unset, the hook
   *  scene falls back to a fixed 90-frame default. */
  hookEndMs?: number;
}

const FPS = 30;

// ─── Word-by-word reveal (shared across all types) ──────────────────────

const WordReveal: React.FC<{
  cues: SubtitleCue[];
  frame: number;
  fps: number;
  fontFamily: string;
  fontSize: number;
  fontWeight?: number;
  italic?: boolean;
  accentColor: string;
  lineHeight?: number;
  textShadow?: string;
}> = ({
  cues,
  frame,
  fps,
  fontFamily,
  fontSize,
  fontWeight = 600,
  italic = false,
  accentColor,
  lineHeight = 1.25,
  textShadow = "0 2px 24px rgba(0,0,0,0.55), 0 0 8px rgba(0,0,0,0.4)",
}) => {
  const currentMs = (frame / fps) * 1000;

  const activeCue = cues.find(
    (c) => currentMs >= c.startMs - 80 && currentMs <= c.endMs + 220,
  );
  if (!activeCue) return null;

  const cueDurMs = Math.max(activeCue.endMs - activeCue.startMs, 1);
  const words = activeCue.words?.length
    ? activeCue.words
    : (() => {
        const tokens = activeCue.text.split(/\s+/).filter(Boolean);
        const msPerWord = cueDurMs / tokens.length;
        return tokens.map((text, i) => ({
          text,
          startMs: activeCue.startMs + i * msPerWord,
          endMs: activeCue.startMs + (i + 1) * msPerWord,
        }));
      })();

  const cueStartFrame = (activeCue.startMs / 1000) * fps;
  const cueEndFrame = (activeCue.endMs / 1000) * fps;
  const containerOpacity = Math.min(
    interpolate(frame, [cueStartFrame - 6, cueStartFrame + 4], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }),
    interpolate(frame, [cueEndFrame + 8, cueEndFrame + 18], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }),
  );

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        fontWeight,
        fontStyle: italic ? "italic" : "normal",
        color: CREAM,
        lineHeight,
        textAlign: "center",
        maxWidth: 940,
        opacity: containerOpacity,
        textShadow,
        whiteSpace: "pre-wrap",
        wordSpacing: "0.05em",
      }}
    >
      {words.map((word, i) => {
        const wordStartFrame = (word.startMs / 1000) * fps;
        const wordEndFrame = (word.endMs / 1000) * fps;

        const entryProgress = spring({
          frame: frame - wordStartFrame,
          fps,
          config: { damping: 14, stiffness: 180, mass: 0.5 },
        });
        const entryTranslateY = interpolate(entryProgress, [0, 1], [12, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const entryOpacity = interpolate(entryProgress, [0, 1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const entryScale = interpolate(entryProgress, [0, 1], [0.96, 1.0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const isActive = frame >= wordStartFrame && frame <= wordEndFrame + 2;
        const hasBeenSpoken = frame > wordEndFrame + 2;

        const activePulse = isActive
          ? spring({
              frame: frame - wordStartFrame,
              fps,
              config: { damping: 18, stiffness: 220, mass: 0.4 },
              durationInFrames: 8,
            })
          : 0;
        const activeScale = 1 + activePulse * 0.06;

        const finalOpacity = hasBeenSpoken ? 0.92 : entryOpacity;
        const finalScale = entryScale * activeScale;
        const finalColor = isActive ? accentColor : CREAM;

        return (
          <React.Fragment key={`${activeCue.startMs}-${i}`}>
            <span
              style={{
                display: "inline-block",
                opacity: finalOpacity,
                transform: `translateY(${entryTranslateY}px) scale(${finalScale})`,
                color: finalColor,
                transition: "color 80ms linear",
              }}
            >
              {word.text}
            </span>
            {i < words.length - 1 ? " " : ""}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/**
 * Karaoke-style reveal: the FULL text is visible from the moment the
 * content scene fades in; the active word (the one currently being
 * spoken) lights up in the accent color and pulses up 6%. Spoken-but-
 * past words and not-yet-spoken words both stay at full opacity in
 * cream — distinct from the WordReveal pattern (one cue at a time,
 * progressive entry) used elsewhere.
 *
 * Use this for the QUOTE video where the whole quote is short enough
 * to fit on screen and the user wants to read ahead.
 */
const KaraokeReveal: React.FC<{
  cues: SubtitleCue[];
  frame: number;
  fps: number;
  fontFamily: string;
  fontSize: number;
  fontWeight?: number;
  italic?: boolean;
  accentColor: string;
  lineHeight?: number;
  textShadow?: string;
}> = ({
  cues,
  frame,
  fps,
  fontFamily,
  fontSize,
  fontWeight = 400,
  italic = false,
  accentColor,
  lineHeight = 1.35,
  textShadow = "0 2px 24px rgba(0,0,0,0.55), 0 0 8px rgba(0,0,0,0.4)",
}) => {
  // Flatten ALL words across cues. Karaoke shows the whole text;
  // we only need cues to drive per-word timing.
  type W = { text: string; startMs: number; endMs: number; cueIdx: number };
  const allWords: W[] = [];
  cues.forEach((cue, cueIdx) => {
    if (cue.words?.length) {
      cue.words.forEach((w) => allWords.push({ ...w, cueIdx }));
    } else {
      const tokens = cue.text.split(/\s+/).filter(Boolean);
      const cueDur = Math.max(cue.endMs - cue.startMs, 1);
      const msPerWord = cueDur / tokens.length;
      tokens.forEach((text, i) => {
        allWords.push({
          text,
          startMs: cue.startMs + i * msPerWord,
          endMs: cue.startMs + (i + 1) * msPerWord,
          cueIdx,
        });
      });
    }
  });

  if (allWords.length === 0) return null;

  // Container fades in once at the start of the first word and stays
  // visible through the full content scene. The OUTER scene-level
  // sceneOpacity handles the eventual fade-out into the outro, so the
  // karaoke container itself just stays on at full opacity once the
  // quote has fully appeared. This gives viewers the long linger they
  // need to re-read after the voice finishes (~5s of dwell time per
  // the per-type tail pad in buildContentScenes).
  const firstStart = (allWords[0].startMs / 1000) * fps;
  const containerOpacity = interpolate(
    frame,
    [firstStart - 8, firstStart + 6],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        fontWeight,
        fontStyle: italic ? "italic" : "normal",
        color: CREAM,
        lineHeight,
        textAlign: "center",
        maxWidth: 940,
        opacity: containerOpacity,
        textShadow,
        whiteSpace: "pre-wrap",
        wordSpacing: "0.05em",
      }}
    >
      {allWords.map((word, i) => {
        const wordStartFrame = (word.startMs / 1000) * fps;
        const wordEndFrame = (word.endMs / 1000) * fps;
        const isActive = frame >= wordStartFrame && frame <= wordEndFrame + 2;
        const activePulse = isActive
          ? spring({
              frame: frame - wordStartFrame,
              fps,
              config: { damping: 18, stiffness: 220, mass: 0.4 },
              durationInFrames: 8,
            })
          : 0;
        const activeScale = 1 + activePulse * 0.06;
        const finalColor = isActive ? accentColor : CREAM;
        return (
          <React.Fragment key={`k-${i}`}>
            <span
              style={{
                display: "inline-block",
                transform: `scale(${activeScale})`,
                color: finalColor,
                transition: "color 80ms linear",
              }}
            >
              {word.text}
            </span>
            {i < allWords.length - 1 ? " " : ""}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Atmosphere (shared) ────────────────────────────────────────────────

const Particles: React.FC<{ accentColor: string; frame: number }> = ({
  accentColor,
  frame,
}) => {
  const particles = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        x: (i * 137.5) % 100,
        y: (i * 73.7) % 100,
        size: 1 + (i % 3),
        speed: 0.08 + (i % 4) * 0.04,
        delay: i * 4,
        blurPx: 1 + (i % 3) * 1.5,
      })),
    [],
  );
  return (
    <>
      {particles.map((p, i) => {
        const yOffset = (frame * p.speed) % 130;
        const opacity = interpolate(frame, [p.delay, p.delay + 30], [0, 0.18], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${(((p.y - yOffset) % 100) + 100) % 100}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: i % 7 === 0 ? accentColor : "#FFFFFF",
              opacity,
              filter: `blur(${p.blurPx}px)`,
              mixBlendMode: "screen",
            }}
          />
        );
      })}
    </>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.55) 100%)",
      pointerEvents: "none",
    }}
  />
);

const FilmGrain: React.FC<{ frame: number }> = ({ frame }) => {
  const baseOpacity = 0.08;
  const oscillation = Math.sin(frame / 4) * 0.015;
  const opacity = baseOpacity + oscillation;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`;
  const dataUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  return (
    <AbsoluteFill
      style={{
        backgroundImage: dataUrl,
        backgroundRepeat: "repeat",
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

// ─── Helpers ────────────────────────────────────────────────────────────

function sceneOpacity(frame: number, start: number, end: number): number {
  const fadeIn = interpolate(frame, [start, start + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const fadeOut = interpolate(frame, [end - 16, end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return fadeIn * fadeOut;
}

function buildContentScenes(
  cues: SubtitleCue[],
  totalFrames: number,
  hookEndMs: number | undefined,
  videoType: VideoType,
): { hook: { start: number; end: number }; content: { start: number; end: number }; outro: { start: number; end: number } } {
  // Hook: stays on screen through the spoken intro when hookEndMs is
  // provided (morning + quote video paths); falls back to ~3s default
  // for night which doesn't have a separate spoken intro.
  // Content: hook-end → voice-end + per-type tail pad.
  // Outro: 4s branded CTA at the END of the video.
  const DEFAULT_HOOK_FRAMES = 90;
  const OUTRO_FRAMES = 120; // 4s outro for the CTA card

  // Per-type linger after the last spoken word. Quote and night videos
  // hold their content on screen for ~5s after the voice finishes so
  // viewers can re-read; morning paces over the longer body voice and
  // just needs a small pad for the last cue's word reveal + scene
  // cross-fade to land cleanly.
  const CONTENT_TAIL_PAD =
    videoType === 'quote' || videoType === 'night' ? 150 : 36;

  const hookEnd = hookEndMs && hookEndMs > 0
    ? Math.round((hookEndMs / 1000) * FPS) + 6
    : DEFAULT_HOOK_FRAMES;

  if (!cues || cues.length === 0) {
    return {
      hook: { start: 0, end: hookEnd },
      content: { start: hookEnd, end: totalFrames - OUTRO_FRAMES },
      outro: { start: totalFrames - OUTRO_FRAMES, end: totalFrames },
    };
  }
  const lastCueEndFrame = Math.round((cues[cues.length - 1].endMs / 1000) * FPS);
  const contentEnd = Math.min(lastCueEndFrame + CONTENT_TAIL_PAD, totalFrames - OUTRO_FRAMES);
  return {
    hook: { start: 0, end: hookEnd },
    content: { start: hookEnd, end: contentEnd },
    outro: { start: contentEnd, end: totalFrames },
  };
}

// ─── Per-type scene components ──────────────────────────────────────────

const MorningHook: React.FC<{
  signName: string;
  date: string;
  symbol: string;
  accent: string;
  frame: number;
  fps: number;
}> = ({ signName, date, symbol, accent, frame, fps }) => {
  const entry = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 120, mass: 0.4 },
  });
  const hookScale = interpolate(entry, [0, 1], [0.92, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ textAlign: "center", transform: `scale(${hookScale})` }}>
      <div
        style={{
          fontSize: 180,
          lineHeight: 1,
          color: accent,
          filter: `drop-shadow(0 0 60px ${accent}66)`,
          marginBottom: 24,
        }}
      >
        {symbol}
      </div>
      <div
        style={{
          fontFamily: fraunces,
          fontSize: 140,
          fontWeight: 600,
          color: CREAM,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          textShadow: "0 4px 30px rgba(0,0,0,0.6)",
        }}
      >
        {signName}
      </div>
      <div
        style={{
          width: 80,
          height: 2,
          background: accent,
          margin: "32px auto",
          opacity: interpolate(frame, [20, 50], [0, 0.85], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <div
        style={{
          fontFamily: inter,
          fontSize: 24,
          fontWeight: 500,
          color: accent,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          marginBottom: 12,
          opacity: interpolate(frame, [30, 60], [0, 0.9], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Daily Horoscope
      </div>
      <div
        style={{
          fontFamily: fraunces_italic,
          fontSize: 26,
          fontWeight: 400,
          color: CREAM_DIM,
          fontStyle: "italic",
          opacity: interpolate(frame, [40, 70], [0, 0.8], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {date}
      </div>
    </div>
  );
};

const QuoteHook: React.FC<{
  signName: string;
  symbol: string;
  accent: string;
  frame: number;
  fps: number;
}> = ({ signName, symbol, accent, frame, fps }) => {
  const entry = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 120, mass: 0.4 },
  });
  const scale = interpolate(entry, [0, 1], [0.94, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ textAlign: "center", transform: `scale(${scale})` }}>
      <div
        style={{
          fontSize: 110,
          lineHeight: 1,
          color: accent,
          filter: `drop-shadow(0 0 40px ${accent}55)`,
          marginBottom: 18,
          opacity: 0.85,
        }}
      >
        {symbol}
      </div>
      <div
        style={{
          fontFamily: inter,
          fontSize: 26,
          fontWeight: 500,
          color: accent,
          letterSpacing: "0.36em",
          textTransform: "uppercase",
          marginBottom: 16,
          opacity: interpolate(frame, [10, 40], [0, 0.95], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Today&apos;s Wisdom
      </div>
      <div
        style={{
          fontFamily: fraunces,
          fontSize: 64,
          fontWeight: 600,
          color: CREAM,
          letterSpacing: "-0.01em",
          opacity: interpolate(frame, [30, 60], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {signName}
      </div>
    </div>
  );
};

const NightHook: React.FC<{
  signName: string;
  symbol: string;
  accent: string;
  frame: number;
  fps: number;
}> = ({ signName, symbol, accent, frame, fps }) => {
  const entry = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 120, mass: 0.4 },
  });
  const scale = interpolate(entry, [0, 1], [0.94, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ textAlign: "center", transform: `scale(${scale})` }}>
      <div
        style={{
          fontSize: 90,
          lineHeight: 1,
          color: accent,
          filter: `drop-shadow(0 0 40px ${accent}55)`,
          marginBottom: 22,
          opacity: 0.7,
        }}
      >
        {symbol}
      </div>
      <div
        style={{
          fontFamily: fraunces,
          fontSize: 96,
          fontWeight: 600,
          fontStyle: "italic",
          color: accent,
          letterSpacing: "0.04em",
          marginBottom: 14,
          textShadow: "0 4px 30px rgba(0,0,0,0.6)",
        }}
      >
        Tonight
      </div>
      <div
        style={{
          fontFamily: inter,
          fontSize: 28,
          fontWeight: 400,
          color: CREAM_DIM,
          letterSpacing: "0.20em",
          textTransform: "uppercase",
          opacity: interpolate(frame, [20, 50], [0, 0.85], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        For {signName}
      </div>
    </div>
  );
};

const Outro: React.FC<{
  symbol: string;
  accent: string;
  frame: number;
  fps: number;
  outroStartFrame: number;
}> = ({ symbol, accent, frame, fps, outroStartFrame }) => {
  // Stagger the CTA elements in for a "satisfying payoff" feel rather
  // than dropping them all at once. Each element fades up on a slight
  // delay relative to the outro start.
  const local = frame - outroStartFrame;
  const symbolOpacity = interpolate(local, [0, 12], [0, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const ctaOpacity = interpolate(local, [10, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const taglineOpacity = interpolate(local, [22, 42], [0, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const ctaScale = spring({
    frame: local - 8,
    fps,
    config: { damping: 16, stiffness: 140, mass: 0.45 },
  });
  const ctaScaleValue = interpolate(ctaScale, [0, 1], [0.92, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ textAlign: "center", maxWidth: 940, padding: "0 60px" }}>
      <div
        style={{
          fontSize: 90,
          color: accent,
          filter: `drop-shadow(0 0 36px ${accent}55)`,
          opacity: symbolOpacity,
          marginBottom: 32,
        }}
      >
        {symbol}
      </div>
      <div
        style={{
          fontFamily: inter,
          fontSize: 22,
          fontWeight: 500,
          color: accent,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          marginBottom: 18,
          opacity: ctaOpacity,
        }}
      >
        Daily Readings, In Your Inbox
      </div>
      <div
        style={{
          fontFamily: fraunces,
          fontSize: 56,
          fontWeight: 600,
          color: CREAM,
          letterSpacing: "-0.01em",
          lineHeight: 1.1,
          opacity: ctaOpacity,
          transform: `scale(${ctaScaleValue})`,
          marginBottom: 24,
          textShadow: "0 4px 30px rgba(0,0,0,0.6)",
        }}
      >
        gettodayshoroscope.com
      </div>
      <div
        style={{
          width: 80,
          height: 1,
          background: accent,
          margin: "0 auto 24px",
          opacity: taglineOpacity * 0.5,
        }}
      />
      <div
        style={{
          fontFamily: fraunces_italic,
          fontSize: 28,
          fontWeight: 400,
          fontStyle: "italic",
          color: CREAM_DIM,
          lineHeight: 1.4,
          opacity: taglineOpacity,
        }}
      >
        Sign up for daily readings
        <br />
        delivered to your inbox.
      </div>
    </div>
  );
};

// ─── Main composition ───────────────────────────────────────────────────

export const HoroscopeVideo: React.FC<HoroscopeVideoProps> = ({
  videoType,
  sign,
  date,
  message,
  quote,
  quoteAuthor,
  peacefulThought,
  elementColor: accent,
  symbol,
  voiceoverSrc,
  ambientSrc,
  subtitleCues,
  hookEndMs,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const signName = sign.charAt(0).toUpperCase() + sign.slice(1);

  // Per-type content text used as the visual fallback when SRT cues are
  // missing (e.g., voiceover failed). Drives nothing when cues exist.
  const contentText =
    videoType === "morning"
      ? message
      : videoType === "quote"
        ? `"${quote}"`
        : peacefulThought;

  const SCENES = useMemo(
    () => buildContentScenes(subtitleCues ?? [], durationInFrames, hookEndMs, videoType),
    [subtitleCues, durationInFrames, hookEndMs, videoType],
  );

  const contentCues = subtitleCues ?? [];

  // Slow Ken Burns on background — text NEVER moves; background drifts.
  const kenBurnsScale = interpolate(frame, [0, durationInFrames], [1.02, 1.10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
  });

  // Per-type content rendering
  const contentScene = (() => {
    if (videoType === "morning") {
      return (
        <AbsoluteFill
          style={{
            opacity: sceneOpacity(frame, SCENES.content.start, SCENES.content.end),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 70px",
          }}
        >
          {contentCues.length > 0 ? (
            <WordReveal
              cues={contentCues}
              frame={frame}
              fps={fps}
              fontFamily={inter}
              fontSize={62}
              fontWeight={600}
              accentColor={accent}
              lineHeight={1.3}
            />
          ) : (
            <div
              style={{
                fontFamily: inter,
                fontSize: 62,
                fontWeight: 600,
                color: CREAM,
                textAlign: "center",
                maxWidth: 940,
                lineHeight: 1.3,
                textShadow: "0 2px 24px rgba(0,0,0,0.55)",
              }}
            >
              {contentText}
            </div>
          )}
        </AbsoluteFill>
      );
    }
    if (videoType === "quote") {
      return (
        <AbsoluteFill
          style={{
            opacity: sceneOpacity(frame, SCENES.content.start, SCENES.content.end),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 80px",
          }}
        >
          <div style={{ maxWidth: 920, textAlign: "center" }}>
            <div
              style={{
                fontFamily: fraunces,
                fontSize: 100,
                color: accent,
                lineHeight: 0.5,
                marginBottom: 30,
                opacity: 0.55,
              }}
            >
              &ldquo;
            </div>
            {contentCues.length > 0 ? (
              <KaraokeReveal
                cues={contentCues}
                frame={frame}
                fps={fps}
                fontFamily={fraunces_italic}
                fontSize={66}
                fontWeight={400}
                italic
                accentColor={accent}
                lineHeight={1.4}
              />
            ) : (
              <div
                style={{
                  fontFamily: fraunces_italic,
                  fontSize: 66,
                  fontStyle: "italic",
                  color: CREAM,
                  lineHeight: 1.4,
                  textShadow: "0 2px 24px rgba(0,0,0,0.55)",
                }}
              >
                {contentText}
              </div>
            )}
            <div
              style={{
                width: 60,
                height: 1,
                background: accent,
                margin: "44px auto 24px",
                opacity: 0.5,
              }}
            />
            <div
              style={{
                fontFamily: inter,
                fontSize: 28,
                fontWeight: 400,
                color: CREAM_DIM,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {quoteAuthor}
            </div>
          </div>
        </AbsoluteFill>
      );
    }
    // night — full reflection visible on screen with karaoke active-word
    // highlight, same pattern as the quote video. Karaoke gives viewers
    // the whole thought to sit with rather than chasing the voice
    // word-by-word.
    return (
      <AbsoluteFill
        style={{
          opacity: sceneOpacity(frame, SCENES.content.start, SCENES.content.end),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
        }}
      >
        {contentCues.length > 0 ? (
          <KaraokeReveal
            cues={contentCues}
            frame={frame}
            fps={fps}
            fontFamily={fraunces_italic}
            fontSize={54}
            fontWeight={400}
            italic
            accentColor={accent}
            lineHeight={1.4}
          />
        ) : (
          <div
            style={{
              fontFamily: fraunces_italic,
              fontSize: 54,
              fontStyle: "italic",
              color: CREAM,
              textAlign: "center",
              maxWidth: 880,
              lineHeight: 1.4,
              textShadow: "0 2px 24px rgba(0,0,0,0.55)",
            }}
          >
            {contentText}
          </div>
        )}
      </AbsoluteFill>
    );
  })();

  const hookScene = (() => {
    if (videoType === "morning") {
      return (
        <MorningHook
          signName={signName}
          date={date}
          symbol={symbol}
          accent={accent}
          frame={frame}
          fps={fps}
        />
      );
    }
    if (videoType === "quote") {
      return (
        <QuoteHook
          signName={signName}
          symbol={symbol}
          accent={accent}
          frame={frame}
          fps={fps}
        />
      );
    }
    return (
      <NightHook
        signName={signName}
        symbol={symbol}
        accent={accent}
        frame={frame}
        fps={fps}
      />
    );
  })();

  return (
    <AbsoluteFill style={{ backgroundColor: "#06050C" }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        {/* Loop the zodiac MP4 so it cycles through the full composition
            duration instead of freezing on the last frame. Source MP4s
            are 15s–60s long; compositions are 22s–45s; without the
            wrapper any composition longer than its zodiac video would
            stop animating partway through. */}
        <Loop durationInFrames={ZODIAC_VIDEO_FRAMES[sign] ?? DEFAULT_ZODIAC_LOOP_FRAMES}>
          <OffthreadVideo
            src={staticFile(`videos/zodiac/${sign}.mp4`)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${kenBurnsScale})`,
              transformOrigin: "center",
              filter: "blur(18px) brightness(0.55) saturate(1.15)",
            }}
            muted
          />
        </Loop>
      </AbsoluteFill>

      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Particles accentColor={accent} frame={frame} />
      </AbsoluteFill>
      <Vignette />
      <FilmGrain frame={frame} />

      {voiceoverSrc && <Audio src={staticFile(voiceoverSrc)} volume={0.95} />}
      {ambientSrc && (
        <Audio
          src={staticFile(ambientSrc)}
          loop
          volume={(f) => {
            const fadeIn = interpolate(f, [0, 30], [0, 0.10], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const fadeOut = interpolate(
              f,
              [durationInFrames - 45, durationInFrames],
              [0.10, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            return Math.min(fadeIn, fadeOut);
          }}
        />
      )}

      {/* HOOK */}
      <AbsoluteFill
        style={{
          opacity: sceneOpacity(frame, SCENES.hook.start, SCENES.hook.end),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {hookScene}
      </AbsoluteFill>

      {/* CONTENT */}
      {contentScene}

      {/* OUTRO — branded CTA: website + signup tagline */}
      <AbsoluteFill
        style={{
          opacity: sceneOpacity(frame, SCENES.outro.start, SCENES.outro.end),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Outro
          symbol={symbol}
          accent={accent}
          frame={frame}
          fps={fps}
          outroStartFrame={SCENES.outro.start}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
