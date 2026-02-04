import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateStories, getStoryDetails } from '../src/services/api';

describe('API Service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('generateStories sends correct request', async () => {
    const mockResponse = { year: 2035, stories: [{ id: 1, title: 'Test' }] };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await generateStories(2035, 'en');

    expect(global.fetch).toHaveBeenCalledWith('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: 2035, lang: 'en' }),
    });
    expect(result).toEqual(mockResponse);
  });

  it('generateStories throws on HTTP error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(generateStories(2035, 'en')).rejects.toThrow('HTTP 500');
  });

  it('getStoryDetails sends correct request', async () => {
    const mockResponse = { story_id: 1, summary: 'Test', comments: [] };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await getStoryDetails(1, 2035, 'en');

    expect(global.fetch).toHaveBeenCalledWith('/api/story/1/details?year=2035&lang=en');
    expect(result).toEqual(mockResponse);
  });

  it('getStoryDetails throws on HTTP error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(getStoryDetails(1, 2035, 'en')).rejects.toThrow('HTTP 404');
  });
});
