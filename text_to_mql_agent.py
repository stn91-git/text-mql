"""
MongoDB Text-to-MQL Agent
A simplified, reliable implementation using current LangChain versions
"""
import os
import json
import ast
import codecs
import re
from dotenv import load_dotenv
from pymongo import MongoClient
from langchain_openai import ChatOpenAI
from langchain.agents import Tool, AgentExecutor, create_react_agent
from langchain.prompts import PromptTemplate

# Load environment variables from .env file
load_dotenv()

# ------------------------------------------------------------------------------
# CONFIGURATION
# ------------------------------------------------------------------------------
MONGO_URI = os.getenv("MONGO_URI")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "month-mutual-funds")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DB_NAME = os.getenv("DB_NAME", "AURA-DEV")  # Your financial database

# Validate required environment variables
if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable is required")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required")

# ------------------------------------------------------------------------------
# MONGODB TOOLS
# ------------------------------------------------------------------------------

def get_mongo_client():
    """Get MongoDB client connection"""
    return MongoClient(MONGO_URI)

def list_collections_tool(query: str) -> str:
    """Lists all collections in the MongoDB database"""
    try:
        client = get_mongo_client()
        db = client[DB_NAME]
        collections = db.list_collection_names()
        client.close()
        return f"Available collections: {', '.join(collections)}"
    except Exception as e:
        return f"Error listing collections: {str(e)}"

def get_collection_schema_tool(collection_name: str) -> str:
    """
    Gets the schema of a MongoDB collection by sampling documents.
    Input should be just the collection name (e.g., 'movies' or 'users')
    """
    try:
        client = get_mongo_client()
        db = client[DB_NAME]
        
        # Sample only 1 document - we only need structure
        sample = list(db[collection_name].find().limit(1))
        
        if not sample:
            client.close()
            return f"Collection '{collection_name}' is empty or doesn't exist"
        
        # Get field names and types from first document
        schema_info = {}
        for field, value in sample[0].items():
            schema_info[field] = type(value).__name__
        
        client.close()
        
        # Format schema concisely - only essential info
        schema_str = f"Collection '{collection_name}' fields:\n"
        for field, field_type in schema_info.items():
            schema_str += f"  {field} ({field_type})\n"
        
        # Include only minimal sample - first 7 fields with truncated values
        sample_doc = sample[0]
        sample_fields = list(sample_doc.items())[:7]
        minimal_sample = {}
        for k, v in sample_fields:
            val_str = str(v)
            if len(val_str) > 30:
                val_str = val_str[:30] + "..."
            minimal_sample[k] = val_str
        
        schema_str += f"\nSample (first 7 fields): {json.dumps(minimal_sample, default=str)}"
        
        return schema_str
    except Exception as e:
        return f"Error getting schema for '{collection_name}': {str(e)}"

def execute_mongodb_query_tool(query_json: str) -> str:
    """
    Executes a MongoDB query. 
    Input should be a JSON string with 'collection', 'operation', and 'query' keys.
    Example: {"collection": "movies", "operation": "find", "query": {"year": 1999}, "limit": 5}
    """
    try:
        # Try multiple parsing strategies to handle various input formats
        query_json = query_json.strip()
        query_dict = None
        last_error = None
        
        # Strategy 1: Try parsing as-is (normal JSON)
        try:
            query_dict = json.loads(query_json)
        except json.JSONDecodeError as e:
            last_error = e
            # Strategy 2: Strip quotes multiple times if needed
            working_str = query_json
            stripped_once = False
            # Remove outer quotes repeatedly until we can't anymore
            while working_str.startswith('"') and working_str.endswith('"') and len(working_str) > 2:
                working_str = working_str[1:-1]
                stripped_once = True
                # Try parsing after each strip
                try:
                    query_dict = json.loads(working_str)
                    break
                except json.JSONDecodeError:
                    continue
            
            # Strategy 3: If still not parsed, try unescaping with ast.literal_eval
            if query_dict is None:
                try:
                    # Use ast.literal_eval to properly unescape Python string literals
                    # Try on original string first
                    unescaped = ast.literal_eval(query_json)
                    query_dict = json.loads(unescaped)
                except (ValueError, SyntaxError, json.JSONDecodeError) as e:
                    last_error = e
                    # Strategy 4: Manual unescaping as fallback
                    # Use the working_str from Strategy 2 (already stripped) or original
                    inner = working_str if stripped_once else query_json
                    if inner.startswith('"') and inner.endswith('"'):
                        inner = inner[1:-1]
                    
                    # Use codecs.decode to handle all escape sequences properly
                    try:
                        decoded = codecs.decode(inner, 'unicode_escape')
                        query_dict = json.loads(decoded)
                    except (UnicodeDecodeError, json.JSONDecodeError) as e:
                        last_error = e
                        # Strategy 5: Try direct replacement of escaped quotes
                        inner_cleaned = inner.replace('\\"', '"').replace('\\\\', '\\')
                        try:
                            query_dict = json.loads(inner_cleaned)
                        except json.JSONDecodeError as e:
                            last_error = e
                            # Strategy 6: Try to find JSON-like content (starts with { and ends with })
                            json_match = re.search(r'\{.*\}', inner_cleaned, re.DOTALL)
                            if json_match:
                                try:
                                    query_dict = json.loads(json_match.group())
                                except json.JSONDecodeError:
                                    pass
        
        if query_dict is None:
            # Provide more helpful error message
            error_msg = f"Invalid JSON input: Could not parse the input as JSON"
            if last_error:
                error_msg += f". Error: {str(last_error)}"
            error_msg += f". Input received: {query_json[:200]}..." if len(query_json) > 200 else f". Input received: {query_json}"
            return error_msg
        
        collection_name = query_dict.get("collection")
        operation = query_dict.get("operation", "find")
        query = query_dict.get("query", {})
        # Default limit to 10 to prevent large results, but allow override
        limit = query_dict.get("limit", 10)
        # Cap limit at 50 to prevent context overflow (reduced from 100)
        if limit > 50:
            limit = 50
        sort = query_dict.get("sort")
        
        client = get_mongo_client()
        db = client[DB_NAME]
        collection = db[collection_name]
        
        # Execute based on operation type
        if operation == "find":
            # find() returns all fields by default, so ISIN will be included
            cursor = collection.find(query)
            if sort:
                cursor = cursor.sort(list(sort.items()))
            if limit:
                cursor = cursor.limit(limit)
            results = list(cursor)
            
        elif operation == "count":
            results = [{"count": collection.count_documents(query)}]
            
        elif operation == "aggregate":
            pipeline = query_dict.get("pipeline", [])
            # Ensure aggregate pipeline has a limit stage to prevent large results
            has_limit = any(stage.get("$limit") for stage in pipeline if isinstance(stage, dict))
            if not has_limit and len(pipeline) > 0:
                # Add a default limit if not present (reduced from 100)
                pipeline.append({"$limit": 50})
            
            # Ensure ISIN is always included in aggregate results
            # Check if there's a $project stage doing field inclusion (has 1 values)
            for stage in pipeline:
                if isinstance(stage, dict) and "$project" in stage:
                    project_fields = stage["$project"]
                    if isinstance(project_fields, dict):
                        # Check if this is an inclusion projection (has 1 values)
                        # If so, ensure ISIN is included
                        has_inclusion = any(v == 1 for v in project_fields.values() if isinstance(v, (int, bool)))
                        if has_inclusion:
                            # This is an inclusion projection - add ISIN if not present
                            if "isin" not in project_fields and "ISIN" not in project_fields:
                                project_fields["isin"] = 1
                                project_fields["ISIN"] = 1
                        # If it's an exclusion projection (has 0 values) or no projection,
                        # ISIN will be included by default, so no action needed
                    break
            
            results = list(collection.aggregate(pipeline))
        
        else:
            client.close()
            return f"Unsupported operation: {operation}"
        
        client.close()
        
        # Format results
        if not results:
            return "Query returned no results"
        
        # Much stricter limits to prevent context overflow
        MAX_RESULTS = 10  # Reduced from 50 - only show what's needed for context
        MAX_RESULT_SIZE = 15000  # Increased to accommodate 10 results with full document fields
        
        # Truncate results if too many
        total_count = len(results)
        if total_count > MAX_RESULTS:
            results = results[:MAX_RESULTS]
            # Compact formatting - indent=1 instead of 2
            result_str = json.dumps(results, indent=1, default=str)
            result_str += f"\n[Showing {MAX_RESULTS} of {total_count} results]"
        else:
            # Compact formatting
            result_str = json.dumps(results, indent=1, default=str)
        
        # Truncate if result string is too large
        if len(result_str) > MAX_RESULT_SIZE:
            truncated = result_str[:MAX_RESULT_SIZE]
            truncated += f"\n[Truncated at {MAX_RESULT_SIZE} chars, {total_count} total results]"
            return truncated
        
        return result_str
        
    except json.JSONDecodeError as e:
        return f"Invalid JSON input: {str(e)}"
    except Exception as e:
        return f"Error executing query: {str(e)}"

# ------------------------------------------------------------------------------
# AGENT SETUP
# ------------------------------------------------------------------------------

def build_text_to_mql_agent():
    """
    Builds a LangChain ReAct agent with custom MongoDB tools
    """
    # Initialize LLM
    llm = ChatOpenAI(
        model="gpt-4o",
        temperature=0,
        openai_api_key=OPENAI_API_KEY
    )
    
    # Define tools
    tools = [
        Tool(
            name="list_collections",
            func=list_collections_tool,
            description="Lists all available collections in the MongoDB database. Use this first to see what data is available. Input can be anything."
        ),
        Tool(
            name="get_schema",
            func=get_collection_schema_tool,
            description="Gets the schema and sample data for a specific MongoDB collection. Input should be the collection name (e.g., 'movies', 'users', 'comments')."
        ),
        Tool(
            name="query_mongodb",
            func=execute_mongodb_query_tool,
            description="""Executes a MongoDB query. Input must be a valid JSON string with these keys:
            - collection: name of the collection
            - operation: 'find', 'count', or 'aggregate'
            - query: MongoDB query document (for find/count)
            - pipeline: aggregation pipeline array (for aggregate)
            - limit: max number of results (optional, default 10, max 50). IMPORTANT: Always use a reasonable limit (10-50) to prevent large results.
            - sort: sort specification as object (optional)
            
            Example for find: {"collection": "movies", "operation": "find", "query": {"year": 1999}, "limit": 10}
            Example for aggregate: {"collection": "movies", "operation": "aggregate", "pipeline": [{"$match": {"year": 1999}}, {"$limit": 10}]}
            
            IMPORTANT: 
            - Always specify a limit parameter (10-50 recommended) to avoid returning too many results.
            - For financial data queries, always ensure ISIN (unique identifier) is included in results. If using $project in aggregate pipelines, include "isin": 1 or "ISIN": 1.
            """
        )
    ]
    
    # Create a ReAct prompt template
    template = """You are a MongoDB expert assistant that helps users query their database using natural language.

You have access to the following tools:

{tools}

Tool Names: {tool_names}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

IMPORTANT: 
- Always start by listing collections to see what's available, then get the schema of relevant collections, then construct and execute the appropriate query.
- For financial fund queries, ALWAYS ensure ISIN (the unique identifier) is included in query results. This is critical for identifying funds uniquely.

Begin!

Question: {input}
Thought: {agent_scratchpad}"""
    
    prompt = PromptTemplate.from_template(template)
    
    # Create agent
    agent = create_react_agent(llm, tools, prompt)
    
    # Create executor
    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        handle_parsing_errors=True,
        max_iterations=10
    )
    
    return agent_executor

# ------------------------------------------------------------------------------
# MAIN
# ------------------------------------------------------------------------------

def main():
    print("=" * 70)
    print("MongoDB Text-to-MQL Agent")
    print("=" * 70)
    print(f"Database: {DB_NAME}")
    print(f"Model: GPT-4o")
    print("=" * 70)
    
    try:
        # Test MongoDB connection first
        client = get_mongo_client()
        client.server_info()  # Will raise exception if can't connect
        print("✓ MongoDB connection successful")
        client.close()
    except Exception as e:
        print(f"✗ MongoDB connection failed: {e}")
        print("\nPlease set your MONGO_URI environment variable:")
        print("  export MONGO_URI='your_connection_string'")
        return
    
    # Check OpenAI key
    if OPENAI_API_KEY == "sk-...":
        print("\n✗ Please set your OPENAI_API_KEY environment variable:")
        print("  export OPENAI_API_KEY='your_api_key'")
        return
    
    print("✓ OpenAI API key configured")
    print("\n" + "=" * 70)
    print("Initializing agent...")
    print("=" * 70 + "\n")
    
    try:
        agent_executor = build_text_to_mql_agent()
    except Exception as e:
        print(f"Error initializing agent: {e}")
        return
    
    print("Agent ready! Ask questions about your MongoDB database.")
    print("Type 'exit' or 'quit' to stop.\n")
    
    # Example queries
    print("Example queries:")
    print("  - What collections are available?")
    print("  - Show me the top 10 funds with highest 3-year CAGR")
    print("  - Find equity funds with Sharpe ratio above 0.7")
    print("  - What's the average expense ratio for funds?")
    print("  - Show funds from the Equity - Consumption category")
    print("  - Which funds have the lowest max drawdown?")
    print()
    
    while True:
        try:
            user_input = input("\n🔍 Your question: ").strip()
            
            if user_input.lower() in ["exit", "quit", "q"]:
                print("\nGoodbye! 👋")
                break
            
            if not user_input:
                continue
            
            # Create a fresh agent executor for each query to prevent context accumulation
            # This ensures each query starts with a clean slate and doesn't exceed token limits
            print()  # Blank line before agent output
            agent_executor = build_text_to_mql_agent()
            response = agent_executor.invoke({"input": user_input})
            
            print("\n" + "=" * 70)
            print("📊 ANSWER:")
            print("=" * 70)
            print(response['output'])
            print("=" * 70)
            
        except KeyboardInterrupt:
            print("\n\nInterrupted. Goodbye! 👋")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            print("Please try rephrasing your question.\n")

if __name__ == "__main__":
    main()
