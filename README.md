# Future Hacker News

> What will Hacker News look like in 10 years? AI-generated front pages from the future.

## Features

- 🔮 Generate AI-predicted HN front pages for years 2030-2040
- 📰 1:1 Hacker News classic UI recreation
- 💬 Click any story to see AI-generated article summaries and comments
- 🌍 Supports 7 languages (EN, 中文, 日本語, DE, FR, 한국어, ES)
- ⚡ Powered by Gemini 2.5 Flash via LLM Proxy

## Tech Stack

- **Frontend:** React + Vite + TypeScript + react-i18next
- **Backend:** Python FastAPI + OpenAI SDK
- **AI:** Gemini 2.5 Flash via llm-proxy.densematrix.ai
- **Deploy:** Docker Compose + Nginx

## Quick Start

```bash
# Clone
git clone https://github.com/densematrix-labs/future-hacker-news.git
cd future-hacker-news

# Setup env
cp .env.example .env
# Edit .env and add your LLM_PROXY_KEY

# Run with Docker
docker-compose up --build
```

Open http://localhost:3000

## Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/generate` | Generate 30 future HN stories |
| GET | `/api/story/{id}/details` | Get story summary + comments |
| GET | `/health` | Health check |

## License

MIT
