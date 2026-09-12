import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from api import copilot, customer, copilot_admin
from config import settings
from core.db import init_db
from models import (  # noqa: F401
    CopilotMessage, CopilotOperation, CopilotSession,
)
from services.migrations import ensure_copilot_operation_columns
from tools import register_all

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    register_all()
    try:
        await init_db()
        await ensure_copilot_operation_columns()
        logger.info("Database initialized (incl. schema migrations)")
    except Exception:
        logger.exception("Database init failed")
    logger.info("AI service started. Chat model=%s, Tool model=%s", settings.models.chat, settings.models.tool)
    yield


app = FastAPI(
    title="AI Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["http://localhost:8000", "http://localhost:8001", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(copilot.router)
app.include_router(copilot_admin.router)
app.include_router(customer.router)


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    logging.basicConfig(level=settings.log_level.upper())
    uvicorn.run(
        "main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.is_local,
    )
