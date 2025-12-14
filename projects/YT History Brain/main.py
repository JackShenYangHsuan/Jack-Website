"""Main FastAPI application for YT History Brain."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router as api_router
from api.connections import router as connections_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    print("YT History Brain starting up...")
    yield
    print("YT History Brain shutting down...")


app = FastAPI(
    title="YT History Brain",
    description="RAG-powered search over your YouTube watch history",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix="/api")
app.include_router(connections_router)  # Already has /api/connections prefix

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    """Serve the main UI."""
    return FileResponse("static/index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
