"""CLI interface for testing MongoDB queries."""
from core.agent import build_text_to_mql_agent
from core.config import DB_NAME
from core.mongodb import get_mongo_client
from core.config import OPENAI_API_KEY


def main():
    """Main CLI entry point."""
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
    if not OPENAI_API_KEY or OPENAI_API_KEY == "sk-...":
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

