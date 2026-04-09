import { buildNarrationScript } from '@/utils/voiceover';

describe('buildNarrationScript', () => {
  it('includes all scenes: hook, philosopher, reading, quote, peaceful, CTA', () => {
    const result = buildNarrationScript(
      'scorpio',
      'Today is your day.',
      'Know thyself.',
      'Socrates',
      'Rest well tonight.'
    );
    expect(result).toContain('Scorpio');
    expect(result).toContain('Stop scrolling');
    expect(result).toContain('Guided by Socrates');
    expect(result).toContain('Today is your day.');
    expect(result).toContain('Know thyself.');
    expect(result).toContain('Rest well tonight.');
    expect(result).toContain('Comment your sign below');
  });

  it('capitalizes sign name', () => {
    const result = buildNarrationScript('aries', 'Message.', 'Quote.', 'Author', 'Thought.');
    expect(result).toContain('Aries');
    expect(result).not.toContain('aries');
  });

  it('handles empty quote gracefully', () => {
    const result = buildNarrationScript('leo', 'Message.', '', '', 'Thought.');
    expect(result).toContain('Leo');
    expect(result).toContain('Message.');
    expect(result).toContain('Thought.');
    expect(result).not.toContain('Guided by');
  });

  it('handles empty peaceful thought gracefully', () => {
    const result = buildNarrationScript('virgo', 'Message.', 'Quote.', 'Author', '');
    expect(result).toContain('Message.');
    expect(result).toContain('Quote.');
    expect(result).not.toContain('undefined');
  });

  it('trims whitespace from all parts', () => {
    const result = buildNarrationScript(
      '  gemini  ',
      '  Hello world.  ',
      '  A quote.  ',
      '  Author  ',
      '  A thought.  '
    );
    expect(result).toContain('Gemini');
    expect(result).toContain('Hello world.');
    expect(result).toContain('A quote.');
  });
});

// generateVoiceover uses edge-tts CLI — tested via integration (render-and-post.ts)
// Not unit-tested here because it requires the edge-tts binary installed
