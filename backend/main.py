from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from db.mongodb import connect_to_mongo, close_mongo_connection
import contextlib

from api import auth, incidents, ai, threats, assets, compliance, dashboard, assistant


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,        prefix="/api/v1/auth",       tags=["Authentication"])
app.include_router(incidents.router,   prefix="/api/v1/incidents",  tags=["Incidents"])
app.include_router(threats.router,     prefix="/api/v1/threats",    tags=["Threats"])
app.include_router(assets.router,      prefix="/api/v1/assets",     tags=["Assets"])
app.include_router(compliance.router,  prefix="/api/v1/compliance", tags=["Compliance"])
app.include_router(dashboard.router,   prefix="/api/v1/dashboard",  tags=["Dashboard"])
app.include_router(assistant.router,   prefix="/api/v1/assistant",  tags=["AI Assistant"])
app.include_router(ai.router,          prefix="/api/v1/ai",         tags=["AI Inference"])


@app.get("/")
async def root():
    return {"message": "AegisSec API v1.0", "docs": "/docs"}
