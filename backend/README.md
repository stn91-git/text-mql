# MongoDB Text-to-MQL Backend

A FastAPI-based backend service that translates natural language queries into MongoDB queries using LangChain and OpenAI GPT-4.

## Project Structure

```
backend/
├── api/                    # API layer (FastAPI)
│   ├── main.py            # FastAPI app entry point
│   ├── routes/            # API routes
│   │   └── query.py       # Query endpoints
│   └── schemas/           # Pydantic models
│       └── models.py      # Request/response schemas
├── core/                   # Core business logic
│   ├── agent.py           # Agent setup and configuration
│   ├── config.py          # Configuration management
│   └── mongodb.py         # MongoDB tools and utilities
├── cli/                    # CLI interface
│   └── main.py           # CLI entry point for testing
├── tests/                  # Test files
├── main.py                # Main entry point (routes to API or CLI)
├── API.md                 # Frontend API documentation
├── env.example            # Example environment variables
└── pyproject.toml         # Dependencies

```

## Setup

1. **Install dependencies:**
   ```bash
   uv sync
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your credentials
   ```

3. **Required environment variables:**
   - `MONGO_URI` - MongoDB connection string
   - `OPENAI_API_KEY` - OpenAI API key
   - `DB_NAME` - MongoDB database name (default: AURA-DEV)

## Running the Application

### Run API Server

```bash
# From backend directory
python main.py

# Or directly with uvicorn
uvicorn api.main:app --reload
```

The API will be available at:
- **API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Run CLI Interface

```bash
# From backend directory
python main.py cli

# Or directly
python -m cli.main
```

The CLI provides an interactive interface for testing queries without the frontend.

## API Endpoints

See [API.md](./API.md) for complete API documentation.

### Quick Examples

**Query Database:**
```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me the top 10 funds with highest 3-year CAGR"}'
```

**List Collections:**
```bash
curl http://localhost:8000/api/collections
```

**Get Schema:**
```bash
curl http://localhost:8000/api/schema/month-mutual-funds
```

**Health Check:**
```bash
curl http://localhost:8000/health
```

## Development

### Code Organization

- **`core/`**: Contains all business logic, reusable across API and CLI
- **`api/`**: FastAPI application with routes and schemas
- **`cli/`**: Command-line interface for testing
- **`tests/`**: Test files (to be implemented)

### Key Features

- **Separation of Concerns**: API, CLI, and core logic are separated
- **Reusability**: Core agent logic shared between API and CLI
- **Type Safety**: Pydantic models for request/response validation
- **Auto Documentation**: FastAPI generates Swagger/OpenAPI docs
- **CORS Support**: Configured for frontend communication
- **Error Handling**: Proper HTTP status codes and error messages

## Configuration

All configuration is managed through environment variables (see `env.example`):

- **MongoDB**: `MONGO_URI`, `DB_NAME`, `COLLECTION_NAME`
- **OpenAI**: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_TEMPERATURE`
- **API**: `API_PORT`, `API_HOST`, `CORS_ORIGINS`

## Testing

### Manual Testing with CLI

```bash
python main.py cli
```

Then enter queries like:
- "What collections are available?"
- "Show me the top 10 funds with highest 3-year CAGR"
- "Find equity funds with Sharpe ratio above 0.7"

### Testing API Endpoints

Use the interactive Swagger documentation at http://localhost:8000/docs or use curl/Postman.

## Architecture

The application follows a clean architecture pattern:

1. **Core Layer**: Business logic and domain models
2. **API Layer**: HTTP interface and request/response handling
3. **CLI Layer**: Command-line interface for testing

The core agent logic is shared between API and CLI, ensuring consistency.

## Notes

- Each API query creates a fresh agent instance to prevent context accumulation
- Results are automatically limited to prevent large responses
- ISIN (unique identifier) is always included in financial fund queries
- The API uses GPT-4o model by default (configurable)

## Troubleshooting

**MongoDB Connection Issues:**
- Verify `MONGO_URI` is set correctly in `.env`
- Check network connectivity to MongoDB
- Use `/health` endpoint to check connection status

**OpenAI API Issues:**
- Verify `OPENAI_API_KEY` is set correctly
- Check API key has sufficient credits
- Use `/health` endpoint to check configuration

**Import Errors:**
- Ensure you're running from the `backend/` directory
- Verify all dependencies are installed: `uv sync`
- Check Python path includes the backend directory

## License

[Add your license here]

