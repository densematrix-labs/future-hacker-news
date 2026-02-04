"""Tests for the FastAPI backend."""
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.anyio
async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.anyio
async def test_generate_stories(client):
    mock_stories = [
        {
            "id": i,
            "title": f"Story {i}",
            "url": f"https://example{i}.com",
            "domain": f"example{i}.com",
            "score": 100 + i,
            "author": f"user{i}",
            "time": "2 hours ago",
            "comments": 50 + i,
        }
        for i in range(1, 31)
    ]

    with patch("app.routes.api.generate_stories", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_stories
        response = await client.post(
            "/api/generate",
            json={"year": 2035, "lang": "en"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["year"] == 2035
        assert len(data["stories"]) == 30
        mock_gen.assert_called_once_with(2035, "en")


@pytest.mark.anyio
async def test_generate_stories_invalid_year(client):
    response = await client.post(
        "/api/generate",
        json={"year": 2020, "lang": "en"},
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_generate_stories_invalid_lang(client):
    response = await client.post(
        "/api/generate",
        json={"year": 2035, "lang": "xx"},
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_generate_stories_default_lang(client):
    mock_stories = [{"id": 1, "title": "Test", "url": "https://test.com", "domain": "test.com", "score": 100, "author": "u", "time": "1h", "comments": 10}]
    with patch("app.routes.api.generate_stories", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_stories
        response = await client.post("/api/generate", json={"year": 2030})
        assert response.status_code == 200
        mock_gen.assert_called_once_with(2030, "en")


@pytest.mark.anyio
async def test_story_details(client):
    mock_details = {
        "summary": "A great article about the future.",
        "comments": [
            {"author": "alice", "text": "Amazing!", "score": 50, "time": "1h ago"}
        ],
    }

    with patch("app.routes.api.generate_story_details", new_callable=AsyncMock) as mock_det:
        mock_det.return_value = mock_details
        response = await client.get("/api/story/1/details?year=2035&lang=en")
        assert response.status_code == 200
        data = response.json()
        assert data["story_id"] == 1
        assert "summary" in data
        assert len(data["comments"]) == 1


@pytest.mark.anyio
async def test_story_details_with_cached_story(client):
    """Test that cached stories are used when available."""
    from app.routes.api import _stories_cache

    _stories_cache["2035_en"] = [
        {"id": 5, "title": "Cached Story", "url": "https://cached.com"}
    ]

    mock_details = {"summary": "Cached detail", "comments": []}

    with patch("app.routes.api.generate_story_details", new_callable=AsyncMock) as mock_det:
        mock_det.return_value = mock_details
        response = await client.get("/api/story/5/details?year=2035&lang=en")
        assert response.status_code == 200
        # Verify the cached story was passed
        call_args = mock_det.call_args[0][0]
        assert call_args["title"] == "Cached Story"

    # Clean up
    _stories_cache.clear()


@pytest.mark.anyio
async def test_story_details_no_cache(client):
    """Test fallback when story is not in cache."""
    from app.routes.api import _stories_cache
    _stories_cache.clear()

    mock_details = {"summary": "Fallback detail", "comments": []}

    with patch("app.routes.api.generate_story_details", new_callable=AsyncMock) as mock_det:
        mock_det.return_value = mock_details
        response = await client.get("/api/story/99/details?year=2040&lang=zh")
        assert response.status_code == 200
        call_args = mock_det.call_args[0][0]
        assert call_args["id"] == 99
        assert "Future Story" in call_args["title"]
