"""API routes for Future Hacker News."""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.services.llm import generate_stories, generate_story_details
from app.core.config import settings
from app.core.database import get_db
from app.models import GenerationToken, FreeTrialTracking

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory cache for generated stories
_stories_cache: dict[str, list[dict]] = {}


class GenerateRequest(BaseModel):
    year: int = Field(..., ge=2030, le=2040)
    lang: str = Field(default="en", pattern=r"^(en|zh|ja|de|fr|ko|es)$")
    device_id: Optional[str] = None
    token: Optional[str] = None


class GenerateResponse(BaseModel):
    year: int
    stories: list[dict]


class TrialStatusResponse(BaseModel):
    has_free_trial: bool
    uses_remaining: int


async def check_and_use_free_trial(device_id: str, db: AsyncSession) -> bool:
    """Check if device has free trial remaining. If so, consume one use."""
    if not device_id:
        return False

    result = await db.execute(
        select(FreeTrialTracking).where(FreeTrialTracking.device_id == device_id)
    )
    tracking = result.scalar_one_or_none()

    if tracking is None:
        tracking = FreeTrialTracking(device_id=device_id, uses_count=1)
        db.add(tracking)
        await db.commit()
        return True
    elif tracking.uses_count < settings.FREE_TRIAL_LIMIT:
        tracking.uses_count += 1
        await db.commit()
        return True
    else:
        return False


async def check_and_use_token(token_str: str, db: AsyncSession) -> bool:
    """Validate token and consume one generation."""
    if not token_str:
        return False

    result = await db.execute(
        select(GenerationToken).where(GenerationToken.token == token_str)
    )
    token_obj = result.scalar_one_or_none()

    if token_obj and token_obj.use_generation():
        await db.commit()
        return True
    return False


@router.get("/trial-status/{device_id}", response_model=TrialStatusResponse)
async def get_trial_status(device_id: str, db: AsyncSession = Depends(get_db)):
    """Check free trial status for a device."""
    result = await db.execute(
        select(FreeTrialTracking).where(FreeTrialTracking.device_id == device_id)
    )
    tracking = result.scalar_one_or_none()

    if tracking is None:
        return TrialStatusResponse(has_free_trial=True, uses_remaining=settings.FREE_TRIAL_LIMIT)
    else:
        remaining = max(0, settings.FREE_TRIAL_LIMIT - tracking.uses_count)
        return TrialStatusResponse(has_free_trial=remaining > 0, uses_remaining=remaining)


@router.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest, db: AsyncSession = Depends(get_db)):
    """Generate 30 future HN stories for a given year."""
    # 1. Try paid token first
    if request.token:
        if not await check_and_use_token(request.token, db):
            raise HTTPException(
                status_code=402,
                detail="Token is invalid, expired, or has no remaining generations"
            )
    # 2. Try free trial
    elif request.device_id:
        if not await check_and_use_free_trial(request.device_id, db):
            raise HTTPException(
                status_code=402,
                detail="Free trial exhausted. Please purchase credits to continue."
            )
    else:
        raise HTTPException(
            status_code=400,
            detail="Either device_id (for free trial) or token (for paid use) is required"
        )

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
