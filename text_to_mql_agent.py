"""
MongoDB Text-to-MQL Agent
A simplified, reliable implementation using current LangChain versions
"""
import os
import json
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
        
        # Sample a few documents to infer schema
        sample = list(db[collection_name].find().limit(3))
        
        if not sample:
            client.close()
            return f"Collection '{collection_name}' is empty or doesn't exist"
        
        # Get field names and types from first document
        schema_info = {}
        for doc in sample:
            for field, value in doc.items():
                if field not in schema_info:
                    schema_info[field] = type(value).__name__
        
        client.close()
        
        # Format schema nicely
        schema_str = f"Schema for '{collection_name}':\n"
        for field, field_type in schema_info.items():
            schema_str += f"  - {field}: {field_type}\n"
        
        # Add sample document
        schema_str += f"\nSample document:\n{json.dumps(sample[0], indent=2, default=str)}"
        
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
        # Handle case where LLM double-stringifies the JSON (wraps it in quotes)
        # Strip outer quotes if present
        query_json = query_json.strip()
        if query_json.startswith('"') and query_json.endswith('"'):
            # Remove outer quotes and unescape inner quotes
            query_json = query_json[1:-1].replace('\\"', '"').replace('\\n', '\n')
        
        # Parse the query
        query_dict = json.loads(query_json)
        collection_name = query_dict.get("collection")
        operation = query_dict.get("operation", "find")
        query = query_dict.get("query", {})
        limit = query_dict.get("limit", 10)
        sort = query_dict.get("sort")
        
        client = get_mongo_client()
        db = client[DB_NAME]
        collection = db[collection_name]
        
        # Execute based on operation type
        if operation == "find":
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
            results = list(collection.aggregate(pipeline))
        
        else:
            client.close()
            return f"Unsupported operation: {operation}"
        
        client.close()
        
        # Format results
        if not results:
            return "Query returned no results"
        
        return json.dumps(results, indent=2, default=str)
        
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
            - limit: max number of results (optional, default 10)
            - sort: sort specification as object (optional)
            
            Example for find: {"collection": "movies", "operation": "find", "query": {"year": 1999}, "limit": 5}
            Example for aggregate: {"collection": "movies", "operation": "aggregate", "pipeline": [{"$match": {"year": 1999}}, {"$limit": 5}]}
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

IMPORTANT: Always start by listing collections to see what's available, then get the schema of relevant collections, then construct and execute the appropriate query.

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
            
            print()  # Blank line before agent output
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
