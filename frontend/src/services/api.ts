const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export interface Story {
  id: number;
  title: string;
  url: string;
  domain: string;
  score: number;
  author: string;
  time: string;
  comments: number;
}

export interface StoryDetails {
  story_id: number;
  summary: string;
  comments: Array<{
    author: string;
    text: string;
    score: number;
    time: string;
  }>;
}

export interface GenerateResponse {
  year: number;
  stories: Story[];
}

export async function generateStories(year: number, lang: string): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, lang }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getStoryDetails(storyId: number, year: number, lang: string): Promise<StoryDetails> {
  const res = await fetch(`${API_BASE}/story/${storyId}/details?year=${year}&lang=${lang}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
