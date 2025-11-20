"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import CORS_ORIGINS, OPENAI_API_KEY
from core.mongodb import get_mongo_client
from api.routes.query import router as query_router
from api.schemas.models import HealthResponse

app = FastAPI(
    title="MongoDB Text-to-MQL API",
    description="API for querying MongoDB databases using natural language",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(query_router)


@app.get("/", tags=["health"])
async def root():
    """Root endpoint."""
    return {
        "message": "MongoDB Text-to-MQL API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check():
    """
    Health check endpoint to verify API, MongoDB, and OpenAI connectivity.
    """
    mongodb_status = "disconnected"
    openai_status = "not configured"
    
    # Check MongoDB connection
    try:
        client = get_mongo_client()
        client.server_info()
        mongodb_status = "connected"
        client.close()
    except Exception as e:
        mongodb_status = f"error: {str(e)[:50]}"
    
    # Check OpenAI key
    if OPENAI_API_KEY:
        openai_status = "configured"
    else:
        openai_status = "not configured"
    
    return HealthResponse(
        status="healthy" if mongodb_status == "connected" and openai_status == "configured" else "degraded",
        mongodb=mongodb_status,
        openai=openai_status
    )


if __name__ == "__main__":
    import uvicorn
    from core.config import API_HOST, API_PORT
    
    uvicorn.run(
        "api.main:app",
        host=API_HOST,
        port=API_PORT,
        reload=True
    )

