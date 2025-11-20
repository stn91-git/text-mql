"""Main entry point - routes to API or CLI based on arguments."""
import sys


def main():
    """Route to API server or CLI based on command line arguments."""
    if len(sys.argv) > 1 and sys.argv[1] == "cli":
        # Run CLI interface
        from cli.main import main as cli_main
        cli_main()
    else:
        # Run API server
        import uvicorn
        from core.config import API_HOST, API_PORT
        
        print(f"Starting API server on {API_HOST}:{API_PORT}")
        print("API Documentation available at: http://localhost:8000/docs")
        print("Use 'python main.py cli' to run the CLI interface")
        print()
        
        uvicorn.run(
            "api.main:app",
            host=API_HOST,
            port=API_PORT,
            reload=True
        )


if __name__ == "__main__":
    main()
