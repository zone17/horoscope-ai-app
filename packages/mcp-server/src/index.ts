#!/usr/bin/env node

/**
 * MCP Server for Daily Philosophical Horoscope Guidance.
 *
 * Provides a single tool `get_daily_guidance` that fetches personalized
 * philosophical horoscope readings from the gettodayshoroscope.com API.
 *
 * Usage with Claude Desktop:
 *   Add to claude_desktop_config.json:
 *   {
 *     "mcpServers": {
 *       "horoscope": {
 *         "command": "npx",
 *         "args": ["horoscope-philosophy-mcp"]
 *       }
 *     }
 *   }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const VALID_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;

const API_BASE_URL = process.env.HOROSCOPE_API_URL || 'https://api.gettodayshoroscope.com';

interface GuidanceResponse {
  sign: string;
  reading: string;
  short: string;
  quote: string;
  philosopher: string;
  date: string;
  peaceful_thought: string;
}

async function fetchGuidance(sign: string, philosophers?: string): Promise<GuidanceResponse> {
  const params = new URLSearchParams({ sign });
  if (philosophers) {
    params.set('philosophers', philosophers);
  }

  const url = `${API_BASE_URL}/api/guidance?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API returned ${response.status}: ${body}`);
  }

  return response.json() as Promise<GuidanceResponse>;
}

// Server setup

const server = new McpServer({
  name: 'horoscope-philosophy-mcp',
  version: '1.0.0',
});

server.tool(
  'get_daily_guidance',
  'Get a personalized daily philosophical horoscope reading for a zodiac sign, optionally blended with specific philosophers.',
  {
    sign: z.enum(VALID_SIGNS).describe(
      'Zodiac sign (lowercase). One of: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces'
    ),
    philosophers: z.string().optional().describe(
      'Comma-separated list of philosopher names to blend into the reading (e.g. "Seneca,Lao Tzu,Alan Watts"). Optional — uses default rotation if omitted.'
    ),
  },
  async ({ sign, philosophers }) => {
    try {
      const guidance = await fetchGuidance(sign, philosophers);

      const text = [
        `**${guidance.sign.charAt(0).toUpperCase() + guidance.sign.slice(1)} — ${guidance.date}**`,
        '',
        guidance.reading,
        '',
        `> "${guidance.quote}" — ${guidance.philosopher}`,
        '',
        `*${guidance.peaceful_thought}*`,
      ].join('\n');

      return {
        content: [
          {
            type: 'text' as const,
            text,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Failed to fetch guidance: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Start

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('MCP server failed to start:', error);
  process.exit(1);
});
