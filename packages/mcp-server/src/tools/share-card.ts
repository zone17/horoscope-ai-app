/**
 * content:share-card — Atomic tool
 *
 * Generates an SVG share card (1080x1080) for a daily reading.
 * Server-side SVG generation — outputs valid SVG XML as a string.
 * Users screenshot this for Instagram stories, iMessage, etc.
 *
 * This is the P0 #10 fix: visual artifact for sharing.
 *
 * Input:  ShareCardInput
 * Output: ShareCardOutput
 */

// ─── Types ──────────────────────────────────────────────────────────────

export interface ShareCardInput {
  sign: string;
  quote: string;
  quoteAuthor: string;
  date?: string;
}

export interface ShareCardOutput {
  svg: string;
  width: number;
  height: number;
}

// ─── Constellation Data ─────────────────────────────────────────────────
// Mirrored from ConstellationIcon.tsx for server-side use (no React dependency).
// Original viewBox is 0 0 28 28; we scale to fit the card.

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

// ─── Helpers ────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Wrap text into lines that fit a given character width.
 * SVG has no native text wrapping — we must do it manually.
 */
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 > maxCharsPerLine && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Render constellation lines + stars as SVG elements.
 * Scales from 28x28 viewBox to a target size, offset to a center position.
 */
function renderConstellation(
  sign: string,
  cx: number,
  cy: number,
  targetSize: number,
): string {
  const data = CONSTELLATION_PATHS[sign.toLowerCase()];
  if (!data) return '';

  const scale = targetSize / 28;
  const offsetX = cx - targetSize / 2;
  const offsetY = cy - targetSize / 2;

  const sx = (v: number) => offsetX + v * scale;
  const sy = (v: number) => offsetY + v * scale;

  const lineElements = data.lines.map(
    ([x1, y1, x2, y2]) =>
      `<line x1="${sx(x1)}" y1="${sy(y1)}" x2="${sx(x2)}" y2="${sy(y2)}" stroke="#fbbf24" stroke-opacity="0.3" stroke-width="2" stroke-linecap="round" />`
  );

  const starElements = data.stars.map(([cx, cy, r]) => {
    const scaledR = r * scale * 0.9;
    const isBright = r >= 1.7;
    return `<circle cx="${sx(cx)}" cy="${sy(cy)}" r="${scaledR}" fill="#fbbf24" fill-opacity="${isBright ? '0.6' : '0.35'}"${isBright ? ' filter="url(#starGlow)"' : ''} />`;
  });

  return [...lineElements, ...starElements].join('\n      ');
}

// ─── Card Generator ─────────────────────────────────────────────────────

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1080;

/**
 * content:share-card
 *
 * Generate an SVG share card for a daily reading.
 * 1080x1080 Instagram-friendly square with dark cosmic theme.
 */
export function generateShareCard(input: ShareCardInput): ShareCardOutput {
  const { sign, quote, quoteAuthor, date } = input;

  const signKey = sign.toLowerCase();
  const signName = capitalize(signKey);
  const formattedDate = formatDate(date);
  const escapedQuote = escapeXml(quote);
  const escapedAuthor = escapeXml(quoteAuthor);

  // Wrap quote text for SVG rendering (~36 chars per line at this font size
  const quoteLines = wrapText(quote, 36);
  const lineHeight = 46;
  // Center the quote block vertically around y=540
  const quoteBlockHeight = quoteLines.length * lineHeight;
  const quoteStartY = 520 - quoteBlockHeight / 2;

  const quoteTspans = quoteLines
    .map(
      (line, i) =>
        `<tspan x="540" dy="${i === 0 ? '0' : lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join('\n          ');

  // Author sits below the quote block
  const authorY = quoteStartY + quoteBlockHeight + 50;

  // Constellation behind the quote, centered, large and subtle
  const constellationSvg = renderConstellation(signKey, 540, 500, 320);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" width="${CARD_WIDTH}" height="${CARD_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0c0921" />
      <stop offset="100%" stop-color="#0f0b30" />
    </linearGradient>
    <filter id="starGlow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="textShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#000000" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#bg)" />

  <!-- Subtle radial glow in center -->
  <circle cx="540" cy="500" r="360" fill="#fbbf24" fill-opacity="0.02" />
  <circle cx="540" cy="500" r="200" fill="#fbbf24" fill-opacity="0.02" />

  <!-- Constellation (background decoration) -->
  <g opacity="0.7">
    ${constellationSvg}
  </g>

  <!-- Top border accent -->
  <line x1="340" y1="80" x2="740" y2="80" stroke="#fbbf24" stroke-opacity="0.3" stroke-width="1" />

  <!-- Sign name -->
  <text
    x="540" y="150"
    text-anchor="middle"
    font-family="'Playfair Display', 'Georgia', 'Times New Roman', serif"
    font-size="64"
    font-weight="700"
    fill="#fbbf24"
    letter-spacing="8"
    filter="url(#textShadow)"
  >${escapeXml(signName.toUpperCase())}</text>

  <!-- Decorative divider below sign -->
  <text x="540" y="200" text-anchor="middle" font-size="20" fill="#fbbf24" fill-opacity="0.5">&#x2726;  &#x2726;  &#x2726;</text>

  <!-- Quote (centered, italic, with em-dashes) -->
  <text
    x="540" y="${quoteStartY}"
    text-anchor="middle"
    font-family="'Playfair Display', 'Georgia', 'Times New Roman', serif"
    font-size="36"
    font-style="italic"
    fill="#f5f0eb"
    filter="url(#textShadow)"
  >
    <tspan x="540" dy="0">\u2014</tspan>
    ${quoteTspans}
    <tspan x="540" dy="${lineHeight}">\u2014</tspan>
  </text>

  <!-- Quote author -->
  <text
    x="540" y="${authorY}"
    text-anchor="middle"
    font-family="'Playfair Display', 'Georgia', 'Times New Roman', serif"
    font-size="28"
    fill="#fbbf24"
    fill-opacity="0.8"
    letter-spacing="3"
  >${escapedAuthor}</text>

  <!-- Bottom divider -->
  <line x1="340" y1="920" x2="740" y2="920" stroke="#fbbf24" stroke-opacity="0.3" stroke-width="1" />

  <!-- Branding -->
  <text
    x="540" y="970"
    text-anchor="middle"
    font-family="'Inter', 'Helvetica Neue', Arial, sans-serif"
    font-size="22"
    fill="#f5f0eb"
    fill-opacity="0.5"
    letter-spacing="4"
  >TODAY&apos;S HOROSCOPE</text>

  <!-- Date -->
  <text
    x="540" y="1010"
    text-anchor="middle"
    font-family="'Inter', 'Helvetica Neue', Arial, sans-serif"
    font-size="18"
    fill="#fbbf24"
    fill-opacity="0.4"
    letter-spacing="2"
  >${escapeXml(formattedDate)}</text>
</svg>`;

  return {
    svg,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  };
}
