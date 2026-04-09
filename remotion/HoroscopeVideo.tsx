import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  useCurrentFrame,
  interpolate,
  staticFile,
  OffthreadVideo,
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
}

// Scene timing (frames at 30fps) — no overlaps between scenes
const SCENES = {
  hook:        { start: 0,    end: 120 },   // 0-4s: symbol + sign + "stop scrolling"
  reading:     { start: 120,  end: 1020 },  // 4-34s: reading text word-by-word
  quote:       { start: 1020, end: 1350 },  // 34-45s: philosopher quote
  peaceful:    { start: 1350, end: 1650 },  // 45-55s: peaceful thought
  cta:         { start: 1650, end: 1800 },  // 55-60s: CTA + watermark
};

// Fade a scene in and out based on its window
function sceneOpacity(frame: number, start: number, end: number): number {
  const fadeIn = interpolate(frame, [start, start + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [end - 20, end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return fadeIn * fadeOut;
}

// Word-by-word fade reveal
const WordReveal: React.FC<{
  text: string;
  frame: number;
  sceneStart: number;
  wordsPerSecond?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  lineHeight?: number;
  italic?: boolean;
}> = ({
  text,
  frame,
  sceneStart,
  wordsPerSecond = 2.5,
  fontSize = 48,
  color = "#D4D0E8",
  fontFamily = BODY_FONT,
  lineHeight = 1.7,
  italic = false,
}) => {
  const fps = 30;
  const words = text.split(" ");

  return (
    <div
      style={{
        fontSize,
        fontFamily,
        color,
        lineHeight,
        fontStyle: italic ? "italic" : "normal",
        fontWeight: 300,
        textAlign: "center",
        maxWidth: 900,
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
}) => {
  const frame = useCurrentFrame();
  const signName = sign.charAt(0).toUpperCase() + sign.slice(1);

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

      {/* Voiceover audio — starts when reading scene begins */}
      {voiceoverSrc && (
        <Audio
          src={staticFile(voiceoverSrc)}
          from={SCENES.reading.start}
          placeholder={null}
          volume={0.9}
        />
      )}

      {/* Ambient music — full duration, low volume, fade in/out */}
      {ambientSrc && (
        <Audio
          src={staticFile(ambientSrc)}
          loop
          placeholder={null}
          volume={(f) => {
            const totalFrames = 60 * 30; // 1800
            const fadeIn = interpolate(f, [0, 30], [0, 0.15], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const fadeOut = interpolate(
              f,
              [totalFrames - 30, totalFrames],
              [0.15, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            return Math.min(fadeIn, fadeOut);
          }}
        />
      )}

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

      {/* ====== SCENE 1: Hook — sign symbol + name ====== */}
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
              fontSize: 80,
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
              fontSize: 28,
              color: elementColor,
              marginTop: 16,
              fontFamily: BODY_FONT,
              fontWeight: 300,
              letterSpacing: 6,
              textTransform: "uppercase",
              opacity: interpolate(frame, [30, 50], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            Stop scrolling
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#9B8EC4",
              marginTop: 24,
              fontFamily: BODY_FONT,
              fontStyle: "italic",
              fontWeight: 300,
              opacity: interpolate(frame, [50, 70], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            Guided by {quoteAuthor} &bull; {date}
          </div>
        </div>
      </AbsoluteFill>

      {/* ====== SCENE 2: Reading text ====== */}
      <AbsoluteFill
        style={{
          opacity: sceneOpacity(frame, SCENES.reading.start, SCENES.reading.end),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 80px",
        }}
      >
        <WordReveal
          text={message}
          frame={frame}
          sceneStart={SCENES.reading.start + 20}
          wordsPerSecond={2.5}
          fontSize={50}
          color="#E0D8F0"
          lineHeight={1.8}
        />
      </AbsoluteFill>

      {/* ====== SCENE 3: Philosopher quote ====== */}
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
          <div
            style={{
              fontSize: 46,
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
              fontSize: 26,
              color: "#8A7EB8",
              textAlign: "center",
              fontFamily: BODY_FONT,
            }}
          >
            &mdash; {quoteAuthor}
          </div>
        </div>
      </AbsoluteFill>

      {/* ====== SCENE 4: Peaceful thought ====== */}
      <AbsoluteFill
        style={{
          opacity: sceneOpacity(
            frame,
            SCENES.peaceful.start,
            SCENES.peaceful.end
          ),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 80px",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontSize: 22,
            color: elementColor,
            textTransform: "uppercase",
            letterSpacing: 5,
            marginBottom: 30,
            fontFamily: BODY_FONT,
          }}
        >
          Tonight
        </div>
        <WordReveal
          text={peacefulThought}
          frame={frame}
          sceneStart={SCENES.peaceful.start + 20}
          wordsPerSecond={2.5}
          fontSize={42}
          color="#9B8EC4"
          italic
          lineHeight={1.8}
        />
      </AbsoluteFill>

      {/* ====== SCENE 5: CTA + Watermark ====== */}
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
            fontSize: 36,
            color: "#F0EEFF",
            fontFamily: BODY_FONT,
            fontWeight: 500,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          Follow for your sign&apos;s daily reading
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
        <div
          style={{
            fontSize: 20,
            color: elementColor,
            marginTop: 10,
            fontFamily: BODY_FONT,
          }}
        >
          Tomorrow at 6am
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
