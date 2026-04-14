#!/usr/bin/env node

/**
 * MCP Server: Today's Horoscope — Philosophy Engine
 *
 * Exposes 12 MCP tools via MCP protocol. Any agent with access to this
 * server can compose readings, format content, manage audience, and more.
 *
 * Architecture: Tools that need no I/O (zodiac, philosopher data) run locally.
 * API-backed tools call the horoscope API for generation/cache.
 *
 * Usage with Claude Desktop:
 *   {
 *     "mcpServers": {
 *       "horoscope": {
 *         "command": "npx",
 *         "args": ["horoscope-philosophy-mcp"],
 *         "env": {
 *           "HOROSCOPE_API_URL": "https://api.gettodayshoroscope.com"
 *         }
 *       }
 *     }
 *   }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { generateShareCard } from './tools/share-card.js';

const API_BASE = process.env.HOROSCOPE_API_URL || 'https://api.gettodayshoroscope.com';

const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;

const signEnum = z.enum(VALID_SIGNS);

// ─── Embedded data (no API needed) ──────────────────────────────────

const SIGN_DATA: Record<string, { element: string; dateRange: string; symbol: string }> = {
  aries: { element: 'Fire', dateRange: 'Mar 21 – Apr 19', symbol: '♈' },
  taurus: { element: 'Earth', dateRange: 'Apr 20 – May 20', symbol: '♉' },
  gemini: { element: 'Air', dateRange: 'May 21 – Jun 20', symbol: '♊' },
  cancer: { element: 'Water', dateRange: 'Jun 21 – Jul 22', symbol: '♋' },
  leo: { element: 'Fire', dateRange: 'Jul 23 – Aug 22', symbol: '♌' },
  virgo: { element: 'Earth', dateRange: 'Aug 23 – Sep 22', symbol: '♍' },
  libra: { element: 'Air', dateRange: 'Sep 23 – Oct 22', symbol: '♎' },
  scorpio: { element: 'Water', dateRange: 'Oct 23 – Nov 21', symbol: '♏' },
  sagittarius: { element: 'Fire', dateRange: 'Nov 22 – Dec 21', symbol: '♐' },
  capricorn: { element: 'Earth', dateRange: 'Dec 22 – Jan 19', symbol: '♑' },
  aquarius: { element: 'Air', dateRange: 'Jan 20 – Feb 18', symbol: '♒' },
  pisces: { element: 'Water', dateRange: 'Feb 19 – Mar 20', symbol: '♓' },
};

const ELEMENT_COMPAT: Record<string, string[]> = {
  Fire: ['Fire', 'Air'],
  Earth: ['Earth', 'Water'],
  Air: ['Air', 'Fire'],
  Water: ['Water', 'Earth'],
};

const PHILOSOPHERS = [
  { name: 'Marcus Aurelius', tradition: 'Stoicism', era: 'ancient' },
  { name: 'Seneca', tradition: 'Stoicism', era: 'ancient' },
  { name: 'Epictetus', tradition: 'Stoicism', era: 'ancient' },
  { name: 'Epicurus', tradition: 'Epicureanism', era: 'ancient' },
  { name: 'Socrates', tradition: 'Classical', era: 'ancient' },
  { name: 'Plato', tradition: 'Classical', era: 'ancient' },
  { name: 'Aristotle', tradition: 'Classical', era: 'ancient' },
  { name: 'Lao Tzu', tradition: 'Eastern Wisdom', era: 'ancient' },
  { name: 'Alan Watts', tradition: 'Eastern Wisdom', era: 'modern' },
  { name: 'Rumi', tradition: 'Eastern Wisdom', era: 'medieval' },
  { name: 'Thich Nhat Hanh', tradition: 'Eastern Wisdom', era: 'modern' },
  { name: 'Albert Einstein', tradition: 'Science & Wonder', era: 'modern' },
  { name: 'Richard Feynman', tradition: 'Science & Wonder', era: 'modern' },
  { name: 'Carl Sagan', tradition: 'Science & Wonder', era: 'modern' },
  { name: 'Friedrich Nietzsche', tradition: 'Poetry & Soul', era: 'modern' },
  { name: 'Mary Oliver', tradition: 'Poetry & Soul', era: 'modern' },
  { name: 'Maya Angelou', tradition: 'Poetry & Soul', era: 'modern' },
  { name: 'Eckhart Tolle', tradition: 'Spiritual Leaders', era: 'contemporary' },
  { name: 'Ram Dass', tradition: 'Spiritual Leaders', era: 'modern' },
  { name: 'Simone de Beauvoir', tradition: 'Existentialism', era: 'modern' },
  { name: 'Albert Camus', tradition: 'Existentialism', era: 'modern' },
  { name: 'Viktor Frankl', tradition: 'Existentialism', era: 'modern' },
  { name: 'Nassim Nicholas Taleb', tradition: 'Contemporary', era: 'contemporary' },
  { name: 'Naval Ravikant', tradition: 'Contemporary', era: 'contemporary' },
];

// ─── Helpers ────────────────────────────────────────────────────────

async function apiCall(path: string, params?: Record<string, string>): Promise<any> {
  const url = new URL(path, API_BASE);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function jsonResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(msg: string) {
  return { content: [{ type: 'text' as const, text: `Error: ${msg}` }], isError: true as const };
}

// ─── Server ─────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'horoscope-philosophy-mcp',
  version: '2.1.0',
});

// ═══ ZODIAC TOOLS ═══════════════════════════════════════════════════

server.registerTool(
  'zodiac_sign_profile',
  {
    title: 'Sign Profile',
    description: 'Get the full profile for a zodiac sign — element, date range, symbol, and personality voice.',
    inputSchema: { sign: signEnum.describe('Zodiac sign (lowercase)') },
  },
  async ({ sign }) => {
    const data = SIGN_DATA[sign];
    if (!data) return errorResult(`Unknown sign: ${sign}`);
    return jsonResult({ sign, ...data });
  }
);

server.registerTool(
  'zodiac_sign_compatibility',
  {
    title: 'Sign Compatibility',
    description: 'Get compatible signs for a zodiac sign based on elemental affinity.',
    inputSchema: {
      sign: signEnum.describe('Zodiac sign'),
      count: z.number().min(1).max(11).default(3).describe('How many compatible signs to return'),
    },
  },
  async ({ sign, count }) => {
    const data = SIGN_DATA[sign];
    if (!data) return errorResult(`Unknown sign: ${sign}`);
    const compatElements = ELEMENT_COMPAT[data.element] || [];
    const compatible = Object.entries(SIGN_DATA)
      .filter(([s, d]) => s !== sign && compatElements.includes(d.element))
      .map(([s]) => s)
      .slice(0, count);
    return jsonResult({ sign, element: data.element, compatibleSigns: compatible });
  }
);

// ═══ PHILOSOPHER TOOLS ══════════════════════════════════════════════

server.registerTool(
  'philosopher_lookup',
  {
    title: 'Philosopher Lookup',
    description: 'Look up a philosopher by name — returns tradition, era, and metadata.',
    inputSchema: { name: z.string().describe('Philosopher name (case-insensitive)') },
  },
  async ({ name }) => {
    const p = PHILOSOPHERS.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (!p) return errorResult(`Philosopher not found: ${name}`);
    return jsonResult(p);
  }
);

server.registerTool(
  'philosopher_list',
  {
    title: 'List Philosophers',
    description: 'List philosophers, optionally filtered by tradition or era.',
    inputSchema: {
      tradition: z.string().optional().describe('Filter by tradition (e.g. "Stoicism", "Eastern Wisdom")'),
      era: z.string().optional().describe('Filter by era: ancient, medieval, modern, contemporary'),
    },
  },
  async ({ tradition, era }) => {
    let result = [...PHILOSOPHERS];
    if (tradition) result = result.filter(p => p.tradition.toLowerCase() === tradition.toLowerCase());
    if (era) result = result.filter(p => p.era === era);
    return jsonResult({ count: result.length, philosophers: result });
  }
);

server.registerTool(
  'philosopher_recommend',
  {
    title: 'Recommend Philosophers',
    description: 'Get philosopher recommendations for a zodiac sign based on elemental affinity.',
    inputSchema: {
      sign: signEnum.describe('Zodiac sign'),
      count: z.number().min(1).max(10).default(5).describe('How many to recommend'),
    },
  },
  async ({ sign, count }) => {
    const data = SIGN_DATA[sign];
    if (!data) return errorResult(`Unknown sign: ${sign}`);

    const affinityMap: Record<string, string[]> = {
      Fire: ['Stoicism', 'Poetry & Soul'],
      Earth: ['Stoicism', 'Science & Wonder'],
      Air: ['Classical', 'Contemporary', 'Existentialism'],
      Water: ['Eastern Wisdom', 'Spiritual Leaders', 'Poetry & Soul'],
    };
    const preferred = affinityMap[data.element] || [];
    const matched = PHILOSOPHERS.filter(p => preferred.includes(p.tradition));
    const recommended = matched.slice(0, count).map(p => ({
      name: p.name,
      tradition: p.tradition,
      reason: `${p.tradition} pairs well with ${data.element} sign energy.`,
    }));
    return jsonResult({ sign, element: data.element, recommended });
  }
);

// ═══ READING TOOLS (via API) ════════════════════════════════════════

server.registerTool(
  'reading_generate',
  {
    title: 'Generate Reading',
    description: 'Generate a personalized philosophical horoscope reading for a sign with an optional philosopher council.',
    inputSchema: {
      sign: signEnum.describe('Zodiac sign'),
      philosophers: z.string().optional().describe('Comma-separated philosopher names for the council'),
    },
  },
  async ({ sign, philosophers }) => {
    try {
      const params: Record<string, string> = { sign, type: 'daily' };
      if (philosophers) params.philosophers = philosophers;
      const res = await apiCall('/api/horoscope', params);
      if (!res.success) return errorResult(res.error || 'Generation failed');

      const d = res.data;
      const text = [
        `**${sign.charAt(0).toUpperCase() + sign.slice(1)} — ${d.date || 'Today'}**`,
        '',
        d.message,
        '',
        d.inspirational_quote ? `> "${d.inspirational_quote}" — ${d.quote_author}` : '',
        '',
        d.peaceful_thought ? `*${d.peaceful_thought}*` : '',
      ].filter(Boolean).join('\n');

      return textResult(text);
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  }
);

// ═══ CONTENT TOOLS ══════════════════════════════════════════════════

server.registerTool(
  'content_format',
  {
    title: 'Format for Platform',
    description: 'Format a reading for a specific platform (tiktok, instagram, x, facebook, email, push).',
    inputSchema: {
      sign: signEnum.describe('Zodiac sign'),
      message: z.string().describe('The reading message text'),
      quote: z.string().optional().describe('Inspirational quote'),
      quote_author: z.string().optional().describe('Quote author name'),
      platform: z.enum(['tiktok', 'instagram', 'x', 'facebook', 'email', 'push']).describe('Target platform'),
    },
  },
  async ({ sign, message, quote, quote_author, platform }) => {
    const signData = SIGN_DATA[sign];
    const emoji = signData?.symbol || '';

    let text = '';
    let hashtags: string[] = [];

    switch (platform) {
      case 'tiktok':
        text = `${emoji} ${sign.charAt(0).toUpperCase() + sign.slice(1)}: ${message.split('.')[0]}.\n\n${quote ? `"${quote}" — ${quote_author}` : ''}`;
        if (text.length > 300) text = text.substring(0, 297) + '...';
        hashtags = ['#astrology', '#horoscope', '#philosophy', `#${sign}`, '#astrologytok'];
        break;
      case 'instagram':
        text = `${quote ? `"${quote}"\n— ${quote_author}\n\n` : ''}${message}\n\n${emoji} Save this for later.`;
        hashtags = ['#astrology', '#horoscope', '#philosophy', `#${sign}`, '#dailyguidance'];
        break;
      case 'x':
        text = `${emoji} ${message.split('.')[0]}.`;
        if (text.length > 280) text = text.substring(0, 277) + '...';
        hashtags = [`#${sign}`, '#philosophy'];
        break;
      case 'facebook':
        text = `${emoji} ${sign.charAt(0).toUpperCase() + sign.slice(1)}\n\n${message}\n\n${quote ? `"${quote}" — ${quote_author}\n\n` : ''}How does this land for you today?`;
        hashtags = ['#horoscope', '#philosophy', `#${sign}`];
        break;
      case 'email':
        text = `<h2>${sign.charAt(0).toUpperCase() + sign.slice(1)} — Daily Philosophical Guidance</h2>\n<p>${message}</p>\n${quote ? `<blockquote>"${quote}" — ${quote_author}</blockquote>` : ''}`;
        break;
      case 'push':
        text = message.split('.')[0] + '.';
        if (text.length > 100) text = text.substring(0, 97) + '...';
        break;
    }

    return jsonResult({ platform, text, hashtags, characterCount: text.length });
  }
);

server.registerTool(
  'content_share_card',
  {
    title: 'Share Card',
    description: 'Generate a shareable SVG card (1080x1080) with a reading quote on a dark cosmic background with constellation art.',
    inputSchema: {
      sign: signEnum.describe('Zodiac sign'),
      quote: z.string().describe('The quote text'),
      quote_author: z.string().describe('Quote author name'),
    },
  },
  async ({ sign, quote, quote_author }) => {
    const result = generateShareCard({
      sign,
      quote,
      quoteAuthor: quote_author,
    });
    return jsonResult({ svg: result.svg, width: result.width, height: result.height, format: 'svg' });
  }
);

// ═══ AUDIENCE TOOLS (via API) ═══════════════════════════════════════

server.registerTool(
  'audience_subscribe',
  {
    title: 'Subscribe',
    description: 'Subscribe an email address to daily horoscope readings, optionally for a specific sign.',
    inputSchema: {
      email: z.string().email().describe('Email address'),
      sign: signEnum.optional().describe('Associate with a zodiac sign'),
    },
  },
  async ({ email, sign }) => {
    try {
      const res = await fetch(`${API_BASE}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, sign }),
      });
      const data = await res.json();
      return jsonResult(data);
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  }
);

server.registerTool(
  'audience_unsubscribe',
  {
    title: 'Unsubscribe',
    description: 'Unsubscribe an email address from daily horoscope readings.',
    inputSchema: { email: z.string().email().describe('Email address to unsubscribe') },
  },
  async ({ email }) => {
    try {
      const res = await fetch(`${API_BASE}/api/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      return jsonResult(data);
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  }
);

// ═══ COMPOSITE TOOLS ════════════════════════════════════════════════

server.registerTool(
  'daily_publish',
  {
    title: 'Daily Publish',
    description: 'Generate a reading for a sign, format it for a platform, and return both the reading and the formatted content. This is the core composition: assign → generate → format.',
    inputSchema: {
      sign: signEnum.describe('Zodiac sign'),
      platform: z.enum(['tiktok', 'instagram', 'x', 'facebook', 'email', 'push']).describe('Target platform'),
      philosophers: z.string().optional().describe('Comma-separated philosopher names'),
    },
  },
  async ({ sign, platform, philosophers }) => {
    try {
      const params: Record<string, string> = { sign, type: 'daily' };
      if (philosophers) params.philosophers = philosophers;
      const res = await apiCall('/api/horoscope', params);
      if (!res.success) return errorResult(res.error || 'Generation failed');

      const d = res.data;
      const signData = SIGN_DATA[sign];
      const emoji = signData?.symbol || '';
      let formatted = '';

      switch (platform) {
        case 'x':
          formatted = `${emoji} ${(d.message || '').split('.')[0]}.`;
          if (formatted.length > 280) formatted = formatted.substring(0, 277) + '...';
          break;
        case 'tiktok':
          formatted = `${emoji} ${sign.charAt(0).toUpperCase() + sign.slice(1)}: ${(d.message || '').split('.')[0]}.\n\n${d.inspirational_quote ? `"${d.inspirational_quote}" — ${d.quote_author}` : ''}`;
          if (formatted.length > 300) formatted = formatted.substring(0, 297) + '...';
          break;
        case 'instagram':
          formatted = `${d.inspirational_quote ? `"${d.inspirational_quote}"\n— ${d.quote_author}\n\n` : ''}${d.message}\n\n${emoji} Save this for later.`;
          break;
        default:
          formatted = `${emoji} ${sign.charAt(0).toUpperCase() + sign.slice(1)}\n\n${d.message}\n\n${d.inspirational_quote ? `"${d.inspirational_quote}" — ${d.quote_author}` : ''}`;
      }

      return jsonResult({
        reading: {
          sign: d.sign || sign,
          message: d.message,
          quote: d.inspirational_quote,
          quoteAuthor: d.quote_author,
          peacefulThought: d.peaceful_thought,
          bestMatch: d.best_match,
        },
        formatted: {
          platform,
          text: formatted,
          characterCount: formatted.length,
        },
      });
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  }
);

// ═══ START ═══════════════════════════════════════════════════════════

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('MCP server failed to start:', error);
  process.exit(1);
});
