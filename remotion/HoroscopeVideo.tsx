/**
 * HoroscopeVideo — premium vertical composition (1080×1920 @ 30fps, 60s)
 *
 * Designed against the "premium short-form video" research synthesis:
 * - Editorial Fraunces (display) + Inter (caption) pairing
 * - Spring-driven word entry: damping 14, stiffness 180, mass 0.5 — snappy,
 *   no overshoot. Anti-pattern: bouncy springs (damping <10) read like a
 *   kids' app.
 * - Active-word highlight (the one currently being spoken): scale 1.06 +
 *   shift to per-sign accent color over ~4 frames. Spoken-but-passed words
 *   persist at 92% opacity instead of vanishing — keeps the line readable.
 * - Background discipline: zodiac loop blurred at 18px, brightness 0.55,
 *   saturation 1.15, slow Ken Burns scale 1.0 → 1.08 across the 60s. Text
 *   STAYS STILL. Background motion is the only motion in the frame outside
 *   the active word.
 * - Atmosphere: radial vignette + sparse star particles (50 max, blurred).
 * - Soft text-shadow scrim, never a hard outline stroke.
 *
 * The active-word timing is interpolated linearly within each cue's
 * startMs→endMs window. When ElevenLabs ships in this same branch its
 * char-level timestamps will be aggregated to true word boundaries and
 * dropped in via the same `cues[].words` shape — composition stays the
 * same, just gets more accurate sync.
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

// Cream / charcoal palette — the only non-accent text colors we use.
const CREAM = "#F5F1E8";
const CREAM_DIM = "rgba(245, 241, 232, 0.55)";

interface SubtitleCue {
  startMs: number;
  endMs: number;
  text: string;
  /** Optional word-level timing (provided by ElevenLabs char-level
   *  timestamps aggregated into words). When absent we interpolate
   *  linearly within the cue. */
  words?: Array<{ text: string; startMs: number; endMs: number }>;
}

interface HoroscopeVideoProps {
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
}

// ─── Scene timing ───────────────────────────────────────────────────────

const FPS = 30;
const TOTAL_FRAMES = 1800; // 60s

const DEFAULT_SCENES = {
  hook:     { start: 0,    end: 120 },
  reading:  { start: 120,  end: 1020 },
  quote:    { start: 1020, end: 1350 },
  peaceful: { start: 1350, end: 1650 },
  outro:    { start: 1650, end: 1800 },
};

const msToFrame = (ms: number) => Math.round((ms / 1000) * FPS);

/** Build scene timing from SRT cues. Heuristic: detect quote/peaceful cues
 *  by content patterns, snap scene boundaries to where each section is
 *  actually spoken. Falls back to even thirds when no cues. */
function buildScenesFromCues(cues: SubtitleCue[]) {
  if (!cues || cues.length === 0) return DEFAULT_SCENES;

  const quoteIdx = cues.findIndex((c) =>
    c.text.match(/^(Knowing|"|“)/i) || c.text.match(/intelligence|wisdom/i),
  );
  const peacefulIdx = cues.findIndex((c) =>
    c.text.match(/^(As you|Tonight|Before sleep|When you close)/i),
  );

  // Hook ends when the FIRST reading-body cue starts.
  const hookEnd = quoteIdx > 0 ? Math.max(msToFrame(cues[2]?.startMs ?? 4000), 90) : 120;
  const readingEnd = quoteIdx > 0 ? msToFrame(cues[quoteIdx].startMs) : 1020;
  const quoteEnd = peacefulIdx > 0
    ? msToFrame(cues[peacefulIdx].startMs)
    : Math.min(readingEnd + 330, TOTAL_FRAMES - 300);
  const peacefulEnd = Math.min(msToFrame(cues[cues.length - 1].endMs) + 30, TOTAL_FRAMES - 60);

  return {
    hook:     { start: 0, end: hookEnd },
    reading:  { start: hookEnd, end: readingEnd },
    quote:    { start: readingEnd, end: quoteEnd },
    peaceful: { start: quoteEnd, end: peacefulEnd },
    outro:    { start: peacefulEnd, end: TOTAL_FRAMES },
  };
}

// ─── Word reveal — the load-bearing component ───────────────────────────

/**
 * Render an active cue word-by-word with spring-driven entry, active-word
 * highlight (scale + accent color), and persistent dim of already-spoken
 * words. Renders ONE active cue at a time with a soft cross-fade between
 * cues so we never stack a wall of text.
 */
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

  // Pick the active cue (extending its window 220ms past endMs so the last
  // word doesn't disappear the moment voice finishes).
  const activeCue = cues.find(
    (c) => currentMs >= c.startMs - 80 && currentMs <= c.endMs + 220,
  );
  if (!activeCue) return null;

  // Words: prefer word-level timing if provided (ElevenLabs path); else
  // distribute linearly across the cue's duration.
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

  // Cue container fade — soft cue-to-cue cross-fade
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
        // pre-wrap preserves explicit whitespace text nodes between word
        // spans so inline-block siblings don't collapse the trailing space
        // (the bug that produced the no-spacing output in the prior render).
        whiteSpace: "pre-wrap",
        wordSpacing: "0.05em",
      }}
    >
      {words.map((word, i) => {
        const wordStartFrame = (word.startMs / 1000) * fps;
        const wordEndFrame = (word.endMs / 1000) * fps;

        // Spring-driven entry (snappy, no overshoot).
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

        // Active-word emphasis — scale to 1.06, color to accent
        const activePulse = isActive
          ? spring({
              frame: frame - wordStartFrame,
              fps,
              config: { damping: 18, stiffness: 220, mass: 0.4 },
              durationInFrames: 8,
            })
          : 0;
        const activeScale = 1 + activePulse * 0.06;

        // Spoken-but-past words dim to 92% opacity — keep readable for
        // context but de-emphasized.
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

// ─── Atmosphere ─────────────────────────────────────────────────────────

/** Sparse star particles — disciplined: 50 max, blurred, screen-blend. */
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

/** Tiny SVG-driven fractal noise overlay — twinkles via opacity oscillation. */
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

// ─── Cue-by-scene split ─────────────────────────────────────────────────

function getCuesForScene(
  allCues: SubtitleCue[],
  sceneStartFrame: number,
  sceneEndFrame: number,
): SubtitleCue[] {
  const sceneStartMs = (sceneStartFrame / FPS) * 1000;
  const sceneEndMs = (sceneEndFrame / FPS) * 1000;
  return allCues.filter(
    (c) => c.startMs >= sceneStartMs - 300 && c.startMs < sceneEndMs,
  );
}

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

// ─── Main composition ───────────────────────────────────────────────────

export const HoroscopeVideo: React.FC<HoroscopeVideoProps> = ({
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
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const signName = sign.charAt(0).toUpperCase() + sign.slice(1);

  const SCENES = useMemo(
    () => buildScenesFromCues(subtitleCues ?? []),
    [subtitleCues],
  );

  const readingCues = subtitleCues
    ? getCuesForScene(subtitleCues, SCENES.reading.start, SCENES.quote.start)
    : [];
  const quoteCues = subtitleCues
    ? getCuesForScene(subtitleCues, SCENES.quote.start, SCENES.peaceful.start)
    : [];
  const peacefulCues = subtitleCues
    ? getCuesForScene(subtitleCues, SCENES.peaceful.start, SCENES.outro.start)
    : [];

  // Slow Ken Burns on background — text NEVER moves; background drifts.
  const kenBurnsScale = interpolate(frame, [0, TOTAL_FRAMES], [1.02, 1.10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
  });

  // Hook entrance — sign symbol/name scale-in via spring
  const hookEntry = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 120, mass: 0.4 },
  });
  const hookScale = interpolate(hookEntry, [0, 1], [0.92, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#06050C" }}>
      {/* Background — blurred, dimmed, slowly zoomed */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
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
      </AbsoluteFill>

      {/* Atmospheric layers */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Particles accentColor={accent} frame={frame} />
      </AbsoluteFill>
      <Vignette />
      <FilmGrain frame={frame} />

      {/* Audio */}
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
              [TOTAL_FRAMES - 45, TOTAL_FRAMES],
              [0.10, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            return Math.min(fadeIn, fadeOut);
          }}
        />
      )}

      {/* SCENE 1 — Hook */}
      <AbsoluteFill
        style={{
          opacity: sceneOpacity(frame, SCENES.hook.start, SCENES.hook.end),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${hookScale})`,
        }}
      >
        <div style={{ textAlign: "center" }}>
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
              fontSize: 28,
              fontWeight: 400,
              color: CREAM_DIM,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              opacity: interpolate(frame, [40, 70], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            Guided by {quoteAuthor}
          </div>
          <div
            style={{
              fontFamily: fraunces_italic,
              fontSize: 26,
              fontWeight: 400,
              color: CREAM_DIM,
              fontStyle: "italic",
              marginTop: 14,
              opacity: interpolate(frame, [55, 85], [0, 0.8], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {date}
          </div>
        </div>
      </AbsoluteFill>

      {/* SCENE 2 — Reading body (word-by-word) */}
      <AbsoluteFill
        style={{
          opacity: sceneOpacity(frame, SCENES.reading.start, SCENES.reading.end),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 70px",
        }}
      >
        {readingCues.length > 0 ? (
          <WordReveal
            cues={readingCues}
            frame={frame}
            fps={fps}
            fontFamily={inter}
            fontSize={64}
            fontWeight={600}
            accentColor={accent}
          />
        ) : (
          <div
            style={{
              fontFamily: inter,
              fontSize: 64,
              fontWeight: 600,
              color: CREAM,
              textAlign: "center",
              maxWidth: 940,
              lineHeight: 1.3,
              textShadow: "0 2px 24px rgba(0,0,0,0.55)",
            }}
          >
            {message}
          </div>
        )}
      </AbsoluteFill>

      {/* SCENE 3 — Pull quote (Fraunces italic, accent rule) */}
      <AbsoluteFill
        style={{
          opacity: sceneOpacity(frame, SCENES.quote.start, SCENES.quote.end),
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
              fontSize: 80,
              color: accent,
              lineHeight: 0.5,
              marginBottom: 30,
              opacity: 0.55,
            }}
          >
            &ldquo;
          </div>
          {quoteCues.length > 0 ? (
            <WordReveal
              cues={quoteCues}
              frame={frame}
              fps={fps}
              fontFamily={fraunces_italic}
              fontSize={68}
              fontWeight={400}
              italic
              accentColor={accent}
              lineHeight={1.35}
            />
          ) : (
            <div
              style={{
                fontFamily: fraunces_italic,
                fontSize: 68,
                fontStyle: "italic",
                color: CREAM,
                lineHeight: 1.35,
                textShadow: "0 2px 24px rgba(0,0,0,0.55)",
              }}
            >
              {quote}
            </div>
          )}
          <div
            style={{
              width: 60,
              height: 1,
              background: accent,
              margin: "40px auto 24px",
              opacity: 0.5,
            }}
          />
          <div
            style={{
              fontFamily: inter,
              fontSize: 26,
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

      {/* SCENE 4 — Peaceful thought */}
      <AbsoluteFill
        style={{
          opacity: sceneOpacity(frame, SCENES.peaceful.start, SCENES.peaceful.end),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontFamily: inter,
            fontSize: 24,
            fontWeight: 500,
            color: accent,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            marginBottom: 40,
            opacity: 0.85,
          }}
        >
          Tonight
        </div>
        {peacefulCues.length > 0 ? (
          <WordReveal
            cues={peacefulCues}
            frame={frame}
            fps={fps}
            fontFamily={fraunces_italic}
            fontSize={52}
            fontWeight={400}
            italic
            accentColor={accent}
            lineHeight={1.4}
          />
        ) : (
          <div
            style={{
              fontFamily: fraunces_italic,
              fontSize: 52,
              fontStyle: "italic",
              color: CREAM,
              textAlign: "center",
              maxWidth: 880,
              lineHeight: 1.4,
              textShadow: "0 2px 24px rgba(0,0,0,0.55)",
            }}
          >
            {peacefulThought}
          </div>
        )}
      </AbsoluteFill>

      {/* SCENE 5 — Outro */}
      <AbsoluteFill
        style={{
          opacity: sceneOpacity(frame, SCENES.outro.start, SCENES.outro.end),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 140,
              color: accent,
              filter: `drop-shadow(0 0 40px ${accent}55)`,
              opacity: 0.85,
              marginBottom: 28,
            }}
          >
            {symbol}
          </div>
          <div
            style={{
              fontFamily: fraunces,
              fontSize: 36,
              fontWeight: 600,
              color: CREAM,
              letterSpacing: "-0.01em",
              opacity: 0.85,
            }}
          >
            gettodayshoroscope
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
