from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler

from .config import get_settings
from .db import run_migrations
from .rate_limit import limiter
from .routes import auth, detections, history


settings = get_settings()

app = FastAPI(title="PotholeAI API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SlowAPIMiddleware)

app.include_router(auth.router)
app.include_router(detections.router)
app.include_router(history.router)


@app.on_event("startup")
def startup() -> None:
    if settings.run_migrations_on_startup:
        run_migrations()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
