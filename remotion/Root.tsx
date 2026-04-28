import { Composition } from "remotion";
import { HoroscopeVideo } from "./HoroscopeVideo";

/**
 * Three independent video compositions:
 *   - HoroscopeMorning : sign + date + reading body
 *   - HoroscopeQuote   : philosopher quote + attribution
 *   - HoroscopeNight   : peaceful thought
 *
 * Each is registered separately so the renderer can pick by composition ID
 * (`renderMedia({ id: 'HoroscopeMorning' | 'HoroscopeQuote' | 'HoroscopeNight' })`).
 * The HoroscopeVideo component branches on the `videoType` prop to lay out
 * the appropriate scenes — the shared shell (background, atmosphere,
 * audio mixing) lives in one place; only scene content differs.
 */

const SHARED_DEFAULTS = {
  sign: "scorpio",
  date: "April 8, 2026",
  message:
    "You already know what you're avoiding. Not the thing itself, but what it means if you finally face it. A confrontation is coming, but it's less about conflict and more about revelation. Digging deep reveals not just shadows, but the path to transformation. What will you become when you let go of what you've clung to?",
  quote: "Knowing others is intelligence; knowing yourself is true wisdom.",
  quoteAuthor: "Lao Tzu",
  peacefulThought:
    "As you close your eyes tonight, consider the darkness not as an ending but as fertile ground for your next growth.",
  elementColor: "#A78BFA",
  symbol: "♏",
  voiceoverSrc: undefined,
  ambientSrc: undefined,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HoroscopeMorning"
        component={HoroscopeVideo}
        durationInFrames={30 * 30} // 30 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ ...SHARED_DEFAULTS, videoType: "morning" as const }}
      />
      <Composition
        id="HoroscopeQuote"
        component={HoroscopeVideo}
        durationInFrames={22 * 30} // 22 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ ...SHARED_DEFAULTS, videoType: "quote" as const }}
      />
      <Composition
        id="HoroscopeNight"
        component={HoroscopeVideo}
        durationInFrames={28 * 30} // 28 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ ...SHARED_DEFAULTS, videoType: "night" as const }}
      />
      {/* Legacy 60s composition kept registered only so that any external
          tooling referencing the old ID (`HoroscopeDaily`) doesn't 404. The
          render pipeline no longer targets this. */}
      <Composition
        id="HoroscopeDaily"
        component={HoroscopeVideo}
        durationInFrames={60 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ ...SHARED_DEFAULTS, videoType: "morning" as const }}
      />
    </>
  );
};
