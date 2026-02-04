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

export interface TrialStatus {
  has_free_trial: boolean;
  uses_remaining: number;
}

export interface Product {
  sku: string;
  name: string;
  price_cents: number;
  generations: number;
  discount_percent: number | null;
}

export interface CreateCheckoutRequest {
  product_sku: string;
  device_id: string;
  optional_email?: string;
  success_url: string;
  cancel_url: string;
}

export interface CreateCheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export interface TokenInfo {
  token: string;
  remaining_generations: number;
  total_generations: number;
  expires_at: string;
  product_sku: string;
}

export async function generateStories(
  year: number,
  lang: string,
  device_id?: string,
  token?: string,
): Promise<GenerateResponse> {
  const body: Record<string, unknown> = { year, lang };
  if (token) body.token = token;
  else if (device_id) body.device_id = device_id;

  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.detail || `HTTP ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }
  return res.json();
}

export async function getStoryDetails(storyId: number, year: number, lang: string): Promise<StoryDetails> {
  const res = await fetch(`${API_BASE}/story/${storyId}/details?year=${year}&lang=${lang}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getTrialStatus(deviceId: string): Promise<TrialStatus> {
  const res = await fetch(`${API_BASE}/trial-status/${deviceId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/payment/products`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function createCheckout(request: CreateCheckoutRequest): Promise<CreateCheckoutResponse> {
  const res = await fetch(`${API_BASE}/payment/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getTokenInfo(token: string): Promise<TokenInfo> {
  const res = await fetch(`${API_BASE}/tokens/info/${token}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getTokensByDevice(deviceId: string): Promise<TokenInfo[]> {
  try {
    const res = await fetch(`${API_BASE}/tokens/by-device/${deviceId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.tokens || [];
  } catch {
    return [];
  }
}
