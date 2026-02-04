"""Tests for the LLM service."""
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.llm import _extract_json, generate_stories, generate_story_details, get_client


def test_extract_json_plain_array():
    text = '[{"id": 1, "title": "Test"}]'
    result = _extract_json(text)
    assert result == [{"id": 1, "title": "Test"}]


def test_extract_json_code_block():
    text = '```json\n[{"id": 1}]\n```'
    result = _extract_json(text)
    assert result == [{"id": 1}]


def test_extract_json_code_block_no_lang():
    text = '```\n{"key": "value"}\n```'
    result = _extract_json(text)
    assert result == {"key": "value"}


def test_extract_json_with_prefix():
    text = 'Here is the JSON:\n[{"id": 1}]'
    result = _extract_json(text)
    assert result == [{"id": 1}]


def test_extract_json_object():
    text = '{"summary": "test", "comments": []}'
    result = _extract_json(text)
    assert result == {"summary": "test", "comments": []}


def test_extract_json_no_json():
    with pytest.raises(ValueError, match="No JSON found"):
        _extract_json("no json here at all")


def test_get_client():
    with patch.dict("os.environ", {"LLM_PROXY_URL": "https://test.com", "LLM_PROXY_KEY": "test-key"}):
        client = get_client()
        assert client is not None


@pytest.mark.anyio
async def test_generate_stories():
    mock_stories = [
        {
            "id": i,
            "title": f"Future Story {i}",
            "url": f"https://future{i}.dev",
            "domain": f"future{i}.dev",
            "score": 200 + i * 10,
            "author": f"hacker{i}",
            "time": f"{i} hours ago",
            "comments": 50 + i * 5,
        }
        for i in range(1, 31)
    ]

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = json.dumps(mock_stories)

    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

    with patch("app.services.llm.get_client", return_value=mock_client):
        result = await generate_stories(2035, "en")
        assert len(result) == 30
        assert result[0]["title"] == "Future Story 1"
        assert result[0]["id"] == 1


@pytest.mark.anyio
async def test_generate_stories_with_lang():
    mock_stories = [{"id": 1, "title": "未来ストーリー"}] * 30

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = json.dumps(mock_stories)

    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

    with patch("app.services.llm.get_client", return_value=mock_client):
        result = await generate_stories(2035, "ja")
        assert len(result) == 30
        # Verify language was included in prompt
        call_args = mock_client.chat.completions.create.call_args
        prompt = call_args.kwargs["messages"][0]["content"]
        assert "Japanese" in prompt


@pytest.mark.anyio
async def test_generate_stories_defaults():
    """Test that missing fields get defaults."""
    mock_stories = [{"title": f"Story {i}"} for i in range(30)]

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = json.dumps(mock_stories)

    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

    with patch("app.services.llm.get_client", return_value=mock_client):
        result = await generate_stories(2035)
        assert len(result) == 30
        assert result[0]["id"] == 1
        assert result[0]["score"] == 100
        assert result[0]["author"] == "anonymous"
        assert result[0]["domain"] == "example.com"


@pytest.mark.anyio
async def test_generate_stories_truncates_to_30():
    """Test that results are truncated to 30."""
    mock_stories = [{"id": i, "title": f"Story {i}"} for i in range(50)]

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = json.dumps(mock_stories)

    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

    with patch("app.services.llm.get_client", return_value=mock_client):
        result = await generate_stories(2035)
        assert len(result) == 30


@pytest.mark.anyio
async def test_generate_story_details():
    mock_details = {
        "summary": "This is a futuristic article about quantum computing.",
        "comments": [
            {"author": "quantum_fan", "text": "Mind-blowing!", "score": 120, "time": "30 minutes ago"},
            {"author": "skeptic99", "text": "I'll believe it when I see it.", "score": 45, "time": "1 hour ago"},
        ],
    }

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = json.dumps(mock_details)

    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

    story = {"id": 1, "title": "Quantum Breakthrough", "url": "https://quantum.dev"}

    with patch("app.services.llm.get_client", return_value=mock_client):
        result = await generate_story_details(story)
        assert "summary" in result
        assert len(result["comments"]) == 2


@pytest.mark.anyio
async def test_generate_story_details_minimal_story():
    """Test with a story that has minimal fields."""
    mock_details = {"summary": "Test", "comments": []}

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = json.dumps(mock_details)

    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

    story = {}  # Minimal story

    with patch("app.services.llm.get_client", return_value=mock_client):
        result = await generate_story_details(story)
        assert result["summary"] == "Test"


@pytest.mark.anyio
async def test_generate_stories_code_block_response():
    """Test handling of code block wrapped response."""
    mock_stories = [{"id": 1, "title": "Test Story"}] * 30

    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = f"```json\n{json.dumps(mock_stories)}\n```"

    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

    with patch("app.services.llm.get_client", return_value=mock_client):
        result = await generate_stories(2035)
        assert len(result) == 30


@pytest.mark.anyio
async def test_generate_stories_all_languages():
    """Test that all supported languages work."""
    for lang in ["en", "zh", "ja", "de", "fr", "ko", "es"]:
        mock_stories = [{"id": 1, "title": f"Story in {lang}"}] * 30
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = json.dumps(mock_stories)

        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        with patch("app.services.llm.get_client", return_value=mock_client):
            result = await generate_stories(2035, lang)
            assert len(result) == 30
