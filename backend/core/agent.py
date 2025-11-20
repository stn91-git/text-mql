"""Agent setup and configuration."""
from langchain_openai import ChatOpenAI
from langchain.agents import Tool, AgentExecutor, create_react_agent
from langchain.prompts import PromptTemplate
from core.config import OPENAI_API_KEY, OPENAI_MODEL, OPENAI_TEMPERATURE
from core.mongodb import list_collections_tool, get_collection_schema_tool, execute_mongodb_query_tool


def build_text_to_mql_agent():
    """
    Builds a LangChain ReAct agent with custom MongoDB tools.
    """
    # Initialize LLM
    llm = ChatOpenAI(
        model=OPENAI_MODEL,
        temperature=OPENAI_TEMPERATURE,
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

