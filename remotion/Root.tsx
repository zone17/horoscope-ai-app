import { Composition } from "remotion";
import { HoroscopeVideo } from "./HoroscopeVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="HoroscopeDaily"
      component={HoroscopeVideo}
      durationInFrames={60 * 30} // 60 seconds at 30fps
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        sign: "scorpio",
        date: "April 8, 2026",
        message:
          "You already know what you're avoiding. Not the thing itself — but what it means if you finally face it. A confrontation is coming, but it's less about conflict and more about revelation. Digging deep reveals not just shadows, but the path to transformation. What will you become when you let go of what you've clung to?",
        quote: "Knowing others is intelligence; knowing yourself is true wisdom.",
        quoteAuthor: "Lao Tzu",
        peacefulThought:
          "As you close your eyes tonight, consider the darkness not as an ending but as fertile ground for your next growth.",
        elementColor: "#A78BFA", // Water element
        symbol: "\u264F", // Scorpio symbol
        voiceoverSrc: undefined,
        ambientSrc: undefined,
      }}
    />
  );
};
