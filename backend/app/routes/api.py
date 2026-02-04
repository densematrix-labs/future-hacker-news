"""API routes for Future Hacker News."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.llm import generate_stories, generate_story_details

router = APIRouter()

# In-memory cache for generated stories
_stories_cache: dict[str, list[dict]] = {}


class GenerateRequest(BaseModel):
    year: int = Field(..., ge=2030, le=2040)
    lang: str = Field(default="en", pattern=r"^(en|zh|ja|de|fr|ko|es)$")


class GenerateResponse(BaseModel):
    year: int
    stories: list[dict]


@router.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    """Generate 30 future HN stories for a given year."""
    cache_key = f"{request.year}_{request.lang}"

    stories = await generate_stories(request.year, request.lang)
    _stories_cache[cache_key] = stories

    return GenerateResponse(year=request.year, stories=stories)


@router.get("/story/{story_id}/details")
async def get_story_details(story_id: int, year: int = 2035, lang: str = "en"):
    """Get detailed summary and comments for a story."""
    cache_key = f"{year}_{lang}"
    stories = _stories_cache.get(cache_key, [])

    story = None
    for s in stories:
        if s.get("id") == story_id:
            story = s
            break

    if not story:
        story = {"id": story_id, "title": f"Future Story #{story_id}", "url": "https://example.com"}

    details = await generate_story_details(story)
    return {"story_id": story_id, **details}
