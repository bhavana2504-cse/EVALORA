from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import upload, pipeline, reports, bonus
from database.database import engine, Base
import database.models  # ensure models are registered

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Evalora API", 
    description="AI-powered candidate evaluation platform",
    lifespan=lifespan
)

import os
import time
from collections import defaultdict
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

# Determine allowed origins from environment or safe defaults for local/development workflows
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

# In-memory sliding-window rate limiter for sensitive/expensive evaluation endpoints
RATE_LIMIT_BUCKET = defaultdict(list)
RATE_LIMIT_MAX_REQUESTS = 30  # Max 30 requests per minute per IP
RATE_LIMIT_WINDOW = 60  # 60 seconds

class SecurityAndRateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Rate limit expensive evaluation endpoints
        path = request.url.path
        if any(path.startswith(prefix) for prefix in ["/api/v1/pipeline", "/api/v1/upload/process-structured-batch"]):
            client_ip = request.client.host if request.client else "unknown"
            now = time.time()
            timestamps = [t for t in RATE_LIMIT_BUCKET[client_ip] if now - t < RATE_LIMIT_WINDOW]
            if len(timestamps) >= RATE_LIMIT_MAX_REQUESTS:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many evaluation requests. Please slow down and try again shortly."}
                )
            timestamps.append(now)
            RATE_LIMIT_BUCKET[client_ip] = timestamps

        response = await call_next(request)

        # 2. Inject recommended security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        
        return response

app.add_middleware(SecurityAndRateLimitMiddleware)

# Mount API routers
app.include_router(upload.router, prefix="/api/v1")
app.include_router(pipeline.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
# Mount bonus router under both /api/v1/bonus and /api/v1 for seamless compatibility
app.include_router(bonus.router, prefix="/api/v1/bonus")
app.include_router(bonus.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Welcome to Evalora API", "status": "online"}

@app.get("/api/v1/health")
def health():
    return {"status": "healthy", "service": "evalora-backend"}

