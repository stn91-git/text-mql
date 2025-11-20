"""Pydantic models for API request/response validation."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class QueryRequest(BaseModel):
    """Request model for natural language query."""
    query: str = Field(..., description="Natural language query about the MongoDB database")


class QueryResponse(BaseModel):
    """Response model for query results."""
    result: str = Field(..., description="The query result or answer")
    success: bool = Field(..., description="Whether the query was successful")
    error: Optional[str] = Field(None, description="Error message if query failed")


class CollectionListResponse(BaseModel):
    """Response model for collection list."""
    collections: List[str] = Field(..., description="List of available collection names")
    success: bool = Field(True, description="Whether the operation was successful")
    error: Optional[str] = Field(None, description="Error message if operation failed")


class SchemaResponse(BaseModel):
    """Response model for collection schema."""
    schema_info: str = Field(..., description="Schema information for the collection")
    success: bool = Field(True, description="Whether the operation was successful")
    error: Optional[str] = Field(None, description="Error message if operation failed")


class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str = Field(..., description="Health status")
    mongodb: str = Field(..., description="MongoDB connection status")
    openai: str = Field(..., description="OpenAI API key status")

