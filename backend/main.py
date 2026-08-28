from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import upload, pipeline, reports, bonus

app = FastAPI(title="Evalora API", description="AI-powered candidate evaluation platform")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api/v1")
app.include_router(pipeline.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(bonus.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Welcome to Evalora API"}
