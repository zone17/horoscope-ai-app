import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  staticFile,
  OffthreadVideo,
  Audio,
} from "remotion";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";

const { fontFamily: playfairFamily } = loadPlayfair("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

const BODY_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

interface HoroscopeVideoProps {
  sign: string;
  date: string;
  message: string;
  quote: string;
  quoteAuthor: string;
  peacefulThought: string;
  elementColor: string;
  symbol: string;
  voiceoverSrc?: string;
  ambientSrc?: string;
  voiceoverDurationMs?: number;
  subtitleCues?: Array<{ startMs: number; endMs: number; text: string }>;
}

// Default scene timing (frames at 30fps) — used when no subtitle cues
const DEFAULT_SCENES = {
  hook:     { start: 0,    end: 120 },
  reading:  { start: 120,  end: 1020 },
  quote:    { start: 1020, end: 1350 },
  peaceful: { start: 1350, end: 1650 },
  cta:      { start: 1650, end: 1800 },
};

/**
 * Build scene timing from subtitle cues.
 * Scenes are positioned to match when Ava actually says each section,
 * with padding for visual breathing room.
 */
function buildScenesFromCues(
  cues: Array<{ startMs: number; endMs: number; text: string }>,
  fps: number = 30
) {
  if (!cues || cues.length === 0) return DEFAULT_SCENES;

  const totalFrames = 1800; // 60s
  const msToFrame = (ms: number) => Math.round((ms / 1000) * fps);

  // Find scene boundaries from cue content
  // Hook: "Scorpio" + "Stop scrolling" + "Guided by..."
  // Reading: the main message sentences
  // Quote: "Knowing others..." + author
  // Peaceful: "As you close your eyes..."
  // CTA: "Comment your sign"

  const lastCue = cues[cues.length - 1];
  const voiceEndFrame = msToFrame(lastCue.endMs);

  // Find the cue that starts with "Knowing" or contains the quote
  const quoteIdx = cues.findIndex((c) =>
    c.text.match(/^(Knowing|"|\u201c)/i) ||
    c.text.match(/intelligence|wisdom/i)
  );

  // Find peaceful thought cue
  const peacefulIdx = cues.findIndex((c) =>
    c.text.match(/^(As you|Tonight|Before sleep|When you close)/i)
  );

  // Find CTA cue
  const ctaIdx = cues.findIndex((c) =>
    c.text.match(/^(Comment|Follow|Share)/i)
  );

  // Build timing from detected positions
  const hookEnd = quoteIdx > 0 ? msToFrame(cues[3]?.startMs ?? 4000) : 120;
  const readingEnd = quoteIdx > 0 ? msToFrame(cues[quoteIdx].startMs) : 1020;
  const quoteEnd = peacefulIdx > 0 ? msToFrame(cues[peacefulIdx].startMs) : readingEnd + 330;
  const peacefulEnd = ctaIdx > 0 ? msToFrame(cues[ctaIdx].startMs) : quoteEnd + 300;

  // Pad scenes so visuals linger after voice finishes
  const padFrames = 30; // 1 second pad

  return {
    hook:     { start: 0, end: hookEnd },
    reading:  { start: hookEnd, end: readingEnd + padFrames },
    quote:    { start: readingEnd, end: quoteEnd + padFrames },
    peaceful: { start: quoteEnd, end: Math.min(peacefulEnd + padFrames, totalFrames - 150) },
    cta:      { start: Math.min(peacefulEnd, totalFrames - 150), end: totalFrames },
  };
}

function sceneOpacity(frame: number, start: number, end: number): number {
  const fadeIn = interpolate(frame, [start, start + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [end - 15, end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return fadeIn * fadeOut;
}

// Subtitle-synced text reveal — lines appear as voice speaks them
const SubtitleReveal: React.FC<{
  cues: Array<{ startMs: number; endMs: number; text: string }>;
  frame: number;
  offsetMs?: number; // ms offset to align with scene start
  fontSize?: number;
  color?: string;
  lineHeight?: number;
  italic?: boolean;
}> = ({
  cues,
  frame,
  offsetMs = 0,
  fontSize = 60,
  color = "#E0D8F0",
  lineHeight = 1.8,
  italic = false,
}) => {
  const fps = 30;

  return (
    <div
      style={{
        fontSize,
        fontFamily: BODY_FONT,
        color,
        lineHeight,
        fontWeight: 300,
        fontStyle: italic ? "italic" : "normal",
        textAlign: "center",
        maxWidth: 920,
      }}
    >
      {cues.map((cue, i) => {
        const cueFrame = ((cue.startMs - offsetMs) / 1000) * fps;
        const opacity = interpolate(frame, [cueFrame, cueFrame + 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const translateY = interpolate(frame, [cueFrame, cueFrame + 12], [10, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              opacity,
              transform: `translateY(${translateY}px)`,
              marginBottom: 6,
            }}
          >
            {cue.text}
          </div>
        );
      })}
    </div>
  );
};

// Fallback word-by-word reveal (no timing data)
const WordReveal: React.FC<{
  text: string;
  frame: number;
  sceneStart: number;
  wordsPerSecond?: number;
  fontSize?: number;
  color?: string;
  lineHeight?: number;
  italic?: boolean;
}> = ({
  text,
  frame,
  sceneStart,
  wordsPerSecond = 2.5,
  fontSize = 60,
  color = "#E0D8F0",
  lineHeight = 1.8,
  italic = false,
}) => {
  const fps = 30;
  const words = text.split(" ");

  return (
    <div
      style={{
        fontSize,
        fontFamily: BODY_FONT,
        color,
        lineHeight,
        fontStyle: italic ? "italic" : "normal",
        fontWeight: 300,
        textAlign: "center",
        maxWidth: 920,
      }}
    >
      {words.map((word, i) => {
        const wordStart = sceneStart + (i / wordsPerSecond) * fps;
        const opacity = interpolate(frame, [wordStart, wordStart + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span key={i} style={{ opacity }}>
            {word}{" "}
          </span>
        );
      })}
    </div>
  );
};

// CSS particles
const Particles: React.FC<{ color: string; frame: number }> = ({
  color,
  frame,
}) => {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        x: (i * 137.5) % 100,
        y: (i * 73.7) % 100,
        size: 2 + (i % 4),
        speed: 0.15 + (i % 3) * 0.08,
        delay: i * 8,
      })),
    []
  );

  return (
    <>
      {particles.map((p, i) => {
        const yOffset = (frame * p.speed) % 120;
        const opacity = interpolate(
          frame,
          [p.delay, p.delay + 30],
          [0, 0.15],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${((p.y - yOffset) % 100 + 100) % 100}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: color,
              opacity,
            }}
          />
        );
      })}
    </>
  );
};

/**
 * Split subtitle cues by scene based on timing.
 * Each scene gets the cues that fall within its time window.
 */
function getCuesForScene(
  allCues: Array<{ startMs: number; endMs: number; text: string }>,
  sceneStartFrame: number,
  sceneEndFrame: number,
  fps: number = 30
) {
  const sceneStartMs = (sceneStartFrame / fps) * 1000;
  const sceneEndMs = (sceneEndFrame / fps) * 1000;
  return allCues.filter(
    (c) => c.startMs >= sceneStartMs - 500 && c.startMs < sceneEndMs
  );
}

export const HoroscopeVideo: React.FC<HoroscopeVideoProps> = ({
  sign,
  date,
  message,
  quote,
  quoteAuthor,
  peacefulThought,
  elementColor,
  symbol,
  voiceoverSrc,
  ambientSrc,
  voiceoverDurationMs,
  subtitleCues,
}) => {
  const frame = useCurrentFrame();
  const signName = sign.charAt(0).toUpperCase() + sign.slice(1);

  // Build scene timing from subtitle cues (or use defaults)
  const SCENES = useMemo(
    () => buildScenesFromCues(subtitleCues ?? []),
    [subtitleCues]
  );

  // Split cues by scene
  const readingCues = subtitleCues ? getCuesForScene(subtitleCues, SCENES.reading.start, SCENES.quote.start) : [];
  const quoteCues = subtitleCues ? getCuesForScene(subtitleCues, SCENES.quote.start, SCENES.peaceful.start) : [];
  const peacefulCues = subtitleCues ? getCuesForScene(subtitleCues, SCENES.peaceful.start, SCENES.cta.start) : [];

  return (
    <AbsoluteFill style={{ backgroundColor: "#030208" }}>
      {/* Background video */}
      <OffthreadVideo
        src={staticFile(`videos/zodiac/${sign}.mp4`)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          position: "absolute",
          opacity: 0.3,
        }}
        muted
      />

      {/* Dark overlay */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(3,2,8,0.7) 0%, rgba(12,11,30,0.65) 50%, rgba(3,2,8,0.8) 100%)",
        }}
      />

      {/* Particles */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Particles color={elementColor} frame={frame} />
      </AbsoluteFill>

      {/* ====== VOICEOVER — starts at frame 0, covers entire video ====== */}
      {voiceoverSrc && (
        <Audio
          src={staticFile(voiceoverSrc)}
          volume={0.9}
        />
      )}

      {/* ====== AMBIENT MUSIC — full duration, low volume ====== */}
      {ambientSrc && (
        <Audio
          src={staticFile(ambientSrc)}
          loop
          volume={(f) => {
            const totalFrames = 1800;
            const fadeIn = interpolate(f, [0, 30], [0, 0.12], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const fadeOut = interpolate(
              f,
              [totalFrames - 30, totalFrames],
              [0.12, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            return Math.min(fadeIn, fadeOut);
          }}
        />
      )}

      {/* ====== SCENE 1: Hook ====== */}
      <AbsoluteFill
        style={{
          opacity: sceneOpacity(frame, SCENES.hook.start, SCENES.hook.end),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 140,
              lineHeight: 1,
              marginBottom: 20,
              filter: `drop-shadow(0 0 40px ${elementColor}80)`,
            }}
          >
            {symbol}
          </div>
          <div
            style={{
              fontFamily: playfairFamily,
              fontSize: 90,
              fontWeight: 700,
              color: "#F0EEFF",
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            {signName}
          </div>
          <div
            style={{
              fontSize: 36,
              color: elementColor,
              marginTop: 16,
              fontFamily: BODY_FONT,
              fontWeight: 400,
              letterSpacing: 6,
              textTransform: "uppercase",
              opacity: interpolate(frame, [20, 40], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            Stop scrolling
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#9B8EC4",
              marginTop: 24,
              fontFamily: BODY_FONT,
              fontStyle: "italic",
              fontWeight: 300,
              opacity: interpolate(frame, [40, 60], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            Guided by {quoteAuthor} &bull; {date}
          </div>
        </div>
      </AbsoluteFill>

      {/* ====== SCENE 2: Reading text (synced to voice) ====== */}
      <AbsoluteFill
        style={{
          opacity: sceneOpacity(frame, SCENES.reading.start, SCENES.reading.end),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 70px",
        }}
      >
        {readingCues.length > 0 ? (
          <SubtitleReveal
            cues={readingCues}
            frame={frame}
            fontSize={60}
            color="#E0D8F0"
          />
        ) : (
          <WordReveal
            text={message}
            frame={frame}
            sceneStart={SCENES.reading.start}
            wordsPerSecond={2.5}
            fontSize={60}
            color="#E0D8F0"
          />
        )}
      </AbsoluteFill>

      {/* ====== SCENE 3: Quote (synced to voice) ====== */}
      <AbsoluteFill
        style={{
          opacity: sceneOpacity(frame, SCENES.quote.start, SCENES.quote.end),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 70px",
        }}
      >
        <div
          style={{
            borderLeft: `4px solid ${elementColor}`,
            padding: "40px 40px",
            background: "rgba(26, 26, 53, 0.5)",
            borderRadius: "0 16px 16px 0",
            maxWidth: 920,
          }}
        >
          {quoteCues.length > 0 ? (
            <SubtitleReveal
              cues={quoteCues}
              frame={frame}
              fontSize={48}
              color="#D4CCF0"
              italic
            />
          ) : (
            <>
              <div
                style={{
                  fontSize: 48,
                  color: "#D4CCF0",
                  fontStyle: "italic",
                  fontFamily: playfairFamily,
                  lineHeight: 1.6,
                  textAlign: "center",
                  marginBottom: 24,
                }}
              >
                &ldquo;{quote}&rdquo;
              </div>
              <div
                style={{
                  fontSize: 28,
                  color: "#8A7EB8",
                  textAlign: "center",
                  fontFamily: BODY_FONT,
                }}
              >
                &mdash; {quoteAuthor}
              </div>
            </>
          )}
        </div>
      </AbsoluteFill>

      {/* ====== SCENE 4: Peaceful thought (synced to voice) ====== */}
      <AbsoluteFill
        style={{
          opacity: sceneOpacity(frame, SCENES.peaceful.start, SCENES.peaceful.end),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 70px",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontSize: 24,
            color: elementColor,
            textTransform: "uppercase",
            letterSpacing: 5,
            marginBottom: 30,
            fontFamily: BODY_FONT,
          }}
        >
          Tonight
        </div>
        {peacefulCues.length > 0 ? (
          <SubtitleReveal
            cues={peacefulCues}
            frame={frame}
            fontSize={44}
            color="#9B8EC4"
            italic
          />
        ) : (
          <WordReveal
            text={peacefulThought}
            frame={frame}
            sceneStart={SCENES.peaceful.start}
            wordsPerSecond={2.5}
            fontSize={44}
            color="#9B8EC4"
            italic
          />
        )}
      </AbsoluteFill>

      {/* ====== SCENE 5: CTA ====== */}
      <AbsoluteFill
        style={{
          opacity: sceneOpacity(frame, SCENES.cta.start, SCENES.cta.end),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontSize: 120,
            lineHeight: 1,
            marginBottom: 24,
            filter: `drop-shadow(0 0 30px ${elementColor}80)`,
          }}
        >
          {symbol}
        </div>
        <div
          style={{
            fontSize: 40,
            color: "#F0EEFF",
            fontFamily: BODY_FONT,
            fontWeight: 500,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          Comment your sign below
        </div>
        <div
          style={{
            width: 60,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${elementColor}, transparent)`,
            marginBottom: 20,
          }}
        />
        <div
          style={{
            fontSize: 24,
            color: "#6B6390",
            fontFamily: BODY_FONT,
            letterSpacing: 1,
          }}
        >
          gettodayshoroscope.com
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
