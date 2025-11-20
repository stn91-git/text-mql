"""API routes for MongoDB queries."""
from fastapi import APIRouter, HTTPException
from core.agent import build_text_to_mql_agent
from core.mongodb import list_collections_tool, get_collection_schema_tool
from api.schemas.models import (
    QueryRequest,
    QueryResponse,
    CollectionListResponse,
    SchemaResponse
)

router = APIRouter(prefix="/api", tags=["query"])


@router.post("/query", response_model=QueryResponse)
async def query_database(request: QueryRequest):
    """
    Execute a natural language query against the MongoDB database.
    
    This endpoint uses an AI agent to translate natural language queries
    into MongoDB queries and return the results.
    """
    try:
        # Create a fresh agent executor for each query to prevent context accumulation
        agent_executor = build_text_to_mql_agent()
        
        # Execute the query
        response = agent_executor.invoke({"input": request.query})
        
        return QueryResponse(
            result=response.get('output', ''),
            success=True
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error executing query: {str(e)}"
        )


@router.get("/collections", response_model=CollectionListResponse)
async def get_collections():
    """
    Get list of all available collections in the MongoDB database.
    """
    try:
        result = list_collections_tool("")
        # Parse the result to extract collection names
        if result.startswith("Available collections: "):
            collections_str = result.replace("Available collections: ", "")
            collections = [c.strip() for c in collections_str.split(",") if c.strip()]
        else:
            # If there's an error, return empty list
            return CollectionListResponse(
                collections=[],
                success=False,
                error=result
            )
        
        return CollectionListResponse(
            collections=collections,
            success=True
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listing collections: {str(e)}"
        )


@router.get("/schema/{collection_name}", response_model=SchemaResponse)
async def get_schema(collection_name: str):
    """
    Get the schema and sample data for a specific collection.
    """
    try:
        schema_info = get_collection_schema_tool(collection_name)
        
        if schema_info.startswith("Error"):
            return SchemaResponse(
                schema_info="",
                success=False,
                error=schema_info
            )
        
        return SchemaResponse(
            schema_info=schema_info,
            success=True
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting schema: {str(e)}"
        )

