"""LLM service for generating future HN content."""
import json
import os
import re
from openai import AsyncOpenAI

LLM_PROXY_URL = os.getenv("LLM_PROXY_URL", "https://llm-proxy.densematrix.ai")
LLM_PROXY_KEY = os.getenv("LLM_PROXY_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-2.5-flash")


def get_client() -> AsyncOpenAI:
    return AsyncOpenAI(base_url=LLM_PROXY_URL, api_key=LLM_PROXY_KEY)


def _extract_json(text: str):
    """Extract JSON from LLM response, handling markdown code blocks."""
    # Try to find JSON in code blocks first
    match = re.search(r"```(?:json)?\s*\n?([\s\S]*?)\n?```", text)
    if match:
        text = match.group(1)
    # Try to find JSON array or object
    text = text.strip()
    if not text.startswith("[") and not text.startswith("{"):
        # Find first [ or {
        idx_arr = text.find("[")
        idx_obj = text.find("{")
        if idx_arr == -1 and idx_obj == -1:
            raise ValueError("No JSON found in response")
        idx = min(i for i in [idx_arr, idx_obj] if i >= 0)
        text = text[idx:]
    return json.loads(text)


async def generate_stories(year: int, lang: str = "en") -> list[dict]:
    """Generate 30 future HN stories for a given year."""
    client = get_client()

    lang_instruction = ""
    if lang != "en":
        lang_map = {
            "zh": "Chinese (Simplified)",
            "ja": "Japanese",
            "de": "German",
            "fr": "French",
            "ko": "Korean",
            "es": "Spanish",
        }
        lang_name = lang_map.get(lang, lang)
        lang_instruction = f" Write ALL titles and content in {lang_name}."

    prompt = f"""Generate exactly 30 Hacker News front page stories from the year {year}. 
These should be realistic, creative predictions of what tech news might look like in {year}.
Include a mix of: AI breakthroughs, startup launches, open source projects, Show HN posts, 
Ask HN posts, scientific discoveries, tech policy, and cultural tech moments.{lang_instruction}

Return a JSON array with exactly 30 items. Each item must have:
- "id": integer (1-30)
- "title": string (HN-style title)
- "url": string (realistic future URL)
- "domain": string (domain from URL)
- "score": integer (100-3000, realistic distribution)
- "author": string (HN-style username)  
- "time": string (e.g. "3 hours ago", "1 day ago")
- "comments": integer (10-800)

Return ONLY the JSON array, no other text."""

    response = await client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.9,
        max_tokens=8000,
    )

    content = response.choices[0].message.content
    stories = _extract_json(content)

    # Ensure we have the right structure
    for i, story in enumerate(stories):
        story["id"] = i + 1
        story.setdefault("score", 100)
        story.setdefault("comments", 10)
        story.setdefault("time", "2 hours ago")
        story.setdefault("author", "anonymous")
        story.setdefault("domain", "example.com")
        story.setdefault("url", f"https://{story.get('domain', 'example.com')}")

    return stories[:30]


async def generate_story_details(story: dict) -> dict:
    """Generate detailed summary and comments for a story."""
    client = get_client()

    prompt = f"""For this Hacker News story from the future:
Title: {story.get('title', 'Unknown')}
URL: {story.get('url', '')}

Generate a detailed article summary and top comments as if this were a real HN thread.

Return a JSON object with:
- "summary": string (2-3 paragraph article summary, written as if the article exists)
- "comments": array of 5 comment objects, each with:
  - "author": string (HN username)
  - "text": string (realistic HN comment, 1-3 sentences)
  - "score": integer (1-200)
  - "time": string (e.g. "1 hour ago")

Return ONLY the JSON object, no other text."""

    response = await client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
        max_tokens=3000,
    )

    content = response.choices[0].message.content
    details = _extract_json(content)

    return details
