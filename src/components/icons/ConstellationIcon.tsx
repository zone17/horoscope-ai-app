/**
 * Constellation dot-line zodiac icons.
 *
 * Each sign is a minimal SVG — dots for stars, thin lines for connections.
 * Designed for the dark cosmic palette (amber/gold on indigo).
 *
 * Rollback: If these cause issues downstream, flip USE_CONSTELLATION_ICONS
 * to false and every consumer falls back to the Unicode emoji automatically.
 */

/** Master kill-switch. Set to false to revert the entire app to emoji icons. */
export const USE_CONSTELLATION_ICONS = true;

interface ConstellationIconProps {
  sign: string;
  className?: string;
  size?: number;
}

export function ConstellationIcon({ sign, className = '', size = 28 }: ConstellationIconProps) {
  const paths = CONSTELLATION_PATHS[sign.toLowerCase()];
  if (!paths) return null;

  return (
    <svg
      className={className}
      viewBox="0 0 28 28"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${sign} constellation`}
    >
      <defs>
        <filter id={`glow-${sign}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {paths.lines.map((l, i) => (
        <line
          key={`l${i}`}
          x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]}
          stroke="currentColor"
          strokeOpacity={0.35}
          strokeWidth={0.8}
          strokeLinecap="round"
        />
      ))}
      {paths.stars.map((s, i) => (
        <circle
          key={`s${i}`}
          cx={s[0]} cy={s[1]} r={s[2]}
          fill="currentColor"
          filter={s[2] >= 1.7 ? `url(#glow-${sign})` : undefined}
        />
      ))}
    </svg>
  );
}

// ── Constellation data ────────────────────────────────────────────
// Each entry: lines = [x1,y1,x2,y2][], stars = [cx,cy,r][]
// Larger radius (>=1.7) = bright/key star with stronger glow

type ConstellationData = {
  lines: [number, number, number, number][];
  stars: [number, number, number][];
};

const CONSTELLATION_PATHS: Record<string, ConstellationData> = {
  aries: {
    lines: [[5,24,8,18],[8,18,12,12],[12,12,18,8],[18,8,23,5]],
    stars: [[5,24,1.5],[8,18,1.3],[12,12,1.8],[18,8,1.5],[23,5,2]],
  },
  taurus: {
    lines: [[4,6,9,4],[9,4,14,8],[14,8,14,14],[14,14,10,18],[10,18,14,22],[14,22,20,20],[14,8,20,6],[20,6,24,8]],
    stars: [[4,6,1.8],[9,4,1.3],[14,8,1.5],[14,14,1.3],[10,18,1.3],[14,22,1.5],[20,20,1.3],[20,6,1.3],[24,8,1.7]],
  },
  gemini: {
    lines: [[8,4,8,10],[8,10,10,14],[10,14,8,20],[8,20,8,24],[20,4,20,10],[20,10,18,14],[18,14,20,20],[20,20,20,24],[10,14,18,14]],
    stars: [[8,4,1.8],[8,10,1.3],[10,14,1.5],[8,20,1.3],[8,24,1.5],[20,4,1.8],[20,10,1.3],[18,14,1.5],[20,20,1.3],[20,24,1.5]],
  },
  cancer: {
    lines: [[6,10,10,8],[10,8,16,10],[16,10,20,14],[20,14,18,18],[10,8,8,14]],
    stars: [[6,10,1.5],[10,8,1.8],[16,10,1.3],[20,14,1.5],[18,18,1.3],[8,14,1.3]],
  },
  leo: {
    lines: [[6,18,10,14],[10,14,14,10],[14,10,18,6],[18,6,22,8],[22,8,22,14],[22,14,18,18],[18,18,14,16],[14,16,14,22]],
    stars: [[6,18,1.5],[10,14,1.3],[14,10,1.5],[18,6,2],[22,8,1.3],[22,14,1.3],[18,18,1.5],[14,16,1.3],[14,22,1.5]],
  },
  virgo: {
    lines: [[4,6,6,12],[6,12,4,20],[10,4,12,12],[12,12,10,20],[16,6,18,12],[18,12,22,18],[22,18,24,24],[6,12,12,12],[12,12,18,12]],
    stars: [[4,6,1.3],[6,12,1.5],[4,20,1.3],[10,4,1.7],[12,12,1.5],[10,20,1.3],[16,6,1.3],[18,12,1.5],[22,18,1.3],[24,24,1.5]],
  },
  libra: {
    lines: [[4,14,10,10],[10,10,14,6],[14,6,18,10],[18,10,24,14],[4,22,24,22]],
    stars: [[4,14,1.5],[10,10,1.3],[14,6,1.8],[18,10,1.3],[24,14,1.5],[4,22,1.5],[24,22,1.5]],
  },
  scorpio: {
    lines: [[3,12,7,14],[7,14,11,12],[11,12,15,14],[15,14,19,12],[19,12,21,16],[21,16,21,22],[21,22,25,18]],
    stars: [[3,12,1.8],[7,14,1.3],[11,12,1.5],[15,14,1.3],[19,12,1.5],[21,16,1.3],[21,22,1.5],[25,18,1.3]],
  },
  sagittarius: {
    lines: [[4,22,10,16],[10,16,14,14],[14,14,20,8],[20,8,24,4],[14,14,10,10],[14,14,18,18],[24,4,18,4],[24,4,24,10]],
    stars: [[4,22,1.5],[10,16,1.3],[14,14,1.8],[20,8,1.3],[24,4,2],[10,10,1.3],[18,18,1.3],[18,4,1.3],[24,10,1.3]],
  },
  capricorn: {
    lines: [[4,10,8,6],[8,6,14,8],[14,8,18,12],[18,12,22,10],[22,10,24,14],[24,14,22,20],[22,20,18,22],[18,12,16,18]],
    stars: [[4,10,1.5],[8,6,1.8],[14,8,1.3],[18,12,1.5],[22,10,1.3],[24,14,1.3],[22,20,1.5],[18,22,1.3],[16,18,1.3]],
  },
  aquarius: {
    lines: [[3,10,8,7],[8,7,13,12],[13,12,18,8],[18,8,25,11],[3,18,8,15],[8,15,13,20],[13,20,18,16],[18,16,25,19]],
    stars: [[3,10,1.5],[8,7,1.3],[13,12,1.8],[18,8,1.3],[25,11,1.5],[3,18,1.3],[8,15,1.3],[13,20,1.5],[18,16,1.3],[25,19,1.3]],
  },
  pisces: {
    lines: [[6,4,6,10],[6,10,8,14],[8,14,14,14],[14,14,20,14],[20,14,22,10],[22,10,22,4],[6,10,4,16],[22,10,24,16],[4,16,4,24],[24,16,24,24]],
    stars: [[6,4,1.3],[6,10,1.5],[8,14,1.7],[14,14,1.3],[20,14,1.7],[22,10,1.5],[22,4,1.3],[4,16,1.3],[24,16,1.3],[4,24,1.5],[24,24,1.5]],
  },
};
