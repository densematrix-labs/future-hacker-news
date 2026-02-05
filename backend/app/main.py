"""Future Hacker News - FastAPI Backend"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.database import init_db
from app.core.metrics import record_generation, generation_timer
from app.routes.api import router as api_router
from app.api.payment import router as payment_router
from app.api.tokens import router as tokens_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables on startup."""
    await init_db()
    yield


app = FastAPI(title="Future Hacker News API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
app.include_router(payment_router, prefix="/api")
app.include_router(tokens_router, prefix="/api")

# Prometheus metrics
Instrumentator().instrument(app).expose(app, endpoint="/api/metrics")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "future-hacker-news"}
