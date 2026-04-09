import { buildNarrationScript } from '@/utils/voiceover';

// Mock OpenAI and fs for generateVoiceover tests
jest.mock('openai', () => {
  const mockCreate = jest.fn().mockResolvedValue({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
  });
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      audio: { speech: { create: mockCreate } },
    })),
    _mockCreate: mockCreate,
  };
});

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe('buildNarrationScript', () => {
  it('concatenates message and quote with pause', () => {
    const result = buildNarrationScript(
      'Today is your day.',
      'Know thyself.',
      'Socrates'
    );
    expect(result).toBe('Today is your day. ... Know thyself. ... by Socrates');
  });

  it('returns only message when quote is empty', () => {
    const result = buildNarrationScript('Today is your day.', '', '');
    expect(result).toBe('Today is your day.');
  });

  it('trims whitespace from all parts', () => {
    const result = buildNarrationScript(
      '  Hello world.  ',
      '  A quote.  ',
      '  Author  '
    );
    expect(result).toBe('Hello world. ... A quote. ... by Author');
  });
});

describe('generateVoiceover', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns null when OPENAI_API_KEY is missing', async () => {
    delete process.env.OPENAI_API_KEY;
    const { generateVoiceover } = await import('@/utils/voiceover');
    const result = await generateVoiceover('Test text', '/tmp/test.mp3');
    expect(result).toBeNull();
  });

  it('calls OpenAI TTS and writes file on success', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    // Clear module cache to pick up the env var
    jest.resetModules();
    const { generateVoiceover } = await import('@/utils/voiceover');
    const fs = require('fs');

    const result = await generateVoiceover('Hello world', '/tmp/test.mp3');
    expect(result).toBe('/tmp/test.mp3');
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('returns null on API error without throwing', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    jest.resetModules();

    // Override OpenAI to throw
    jest.doMock('openai', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({
        audio: {
          speech: {
            create: jest.fn().mockRejectedValue(new Error('API error')),
          },
        },
      })),
    }));

    const { generateVoiceover } = await import('@/utils/voiceover');
    const result = await generateVoiceover('Test', '/tmp/fail.mp3');
    expect(result).toBeNull();
  });
});
