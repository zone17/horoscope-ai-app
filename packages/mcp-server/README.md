# horoscope-philosophy-mcp

MCP server for daily philosophical horoscope guidance from [gettodayshoroscope.com](https://gettodayshoroscope.com).

## Tool

### `get_daily_guidance`

Get a personalized daily philosophical horoscope reading for a zodiac sign.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `sign` | string | Yes | Zodiac sign (lowercase): aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces |
| `philosophers` | string | No | Comma-separated philosopher names to blend into the reading (e.g. `"Seneca,Lao Tzu,Alan Watts"`) |

**Returns:** A formatted reading with the horoscope message, an inspirational quote, and a peaceful thought.

## Setup with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "horoscope": {
      "command": "npx",
      "args": ["horoscope-philosophy-mcp"]
    }
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOROSCOPE_API_URL` | `https://api.gettodayshoroscope.com` | Base URL for the guidance API |

## Development

```bash
npm install
npm run build
npm start
```
