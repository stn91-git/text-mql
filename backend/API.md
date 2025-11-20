# MongoDB Text-to-MQL API Documentation

## Base URL

```
http://localhost:8000
```

## Authentication

Currently, no authentication is required. All endpoints are publicly accessible.

## CORS Configuration

The API is configured to accept requests from any origin (`*`). For production, update `CORS_ORIGINS` in your `.env` file.

## Endpoints

### 1. Health Check

**GET** `/health`

Check API, MongoDB, and OpenAI connectivity status.

**Response:**
```json
{
  "status": "healthy",
  "mongodb": "connected",
  "openai": "configured"
}
```

**Example:**
```bash
curl http://localhost:8000/health
```

---

### 2. Query Database

**POST** `/api/query`

Execute a natural language query against the MongoDB database. The AI agent translates your question into MongoDB queries and returns results.

**Request Body:**
```json
{
  "query": "Show me the top 10 funds with highest 3-year CAGR"
}
```

**Response:**
```json
{
  "result": "The top 10 funds with highest 3-year CAGR are:\n1. Fund A - 69.04%\n2. Fund B - 68.42%\n...",
  "success": true,
  "error": null
}
```

**Error Response:**
```json
{
  "result": "",
  "success": false,
  "error": "Error message here"
}
```

**Example with curl:**
```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What collections are available?"}'
```

**Example with JavaScript (fetch):**
```javascript
const response = await fetch('http://localhost:8000/api/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: 'Show me the top 10 funds with highest 3-year CAGR'
  })
});

const data = await response.json();
console.log(data.result);
```

**Example with JavaScript (axios):**
```javascript
import axios from 'axios';

const response = await axios.post('http://localhost:8000/api/query', {
  query: 'Show me the top 10 funds with highest 3-year CAGR'
});

console.log(response.data.result);
```

---

### 3. List Collections

**GET** `/api/collections`

Get a list of all available collections in the MongoDB database.

**Response:**
```json
{
  "collections": ["month-mutual-funds", "users", "transactions"],
  "success": true,
  "error": null
}
```

**Example:**
```bash
curl http://localhost:8000/api/collections
```

**Example with JavaScript:**
```javascript
const response = await fetch('http://localhost:8000/api/collections');
const data = await response.json();
console.log(data.collections); // Array of collection names
```

---

### 4. Get Collection Schema

**GET** `/api/schema/{collection_name}`

Get the schema and sample data for a specific collection.

**Path Parameters:**
- `collection_name` (string, required): Name of the collection

**Response:**
```json
{
  "schema_info": "Collection 'month-mutual-funds' fields:\n  fund_name (str)\n  isin (str)\n  cagr_3y (float)\n...",
  "success": true,
  "error": null
}
```

**Example:**
```bash
curl http://localhost:8000/api/schema/month-mutual-funds
```

**Example with JavaScript:**
```javascript
const collectionName = 'month-mutual-funds';
const response = await fetch(`http://localhost:8000/api/schema/${collectionName}`);
const data = await response.json();
console.log(data.schema_info);
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Successful request
- `422 Unprocessable Entity` - Validation error (invalid request body)
- `500 Internal Server Error` - Server error

Error responses include an `error` field in the response body with details.

**Example Error Response:**
```json
{
  "detail": "Error executing query: Connection timeout"
}
```

---

## Example Queries

Here are some example natural language queries you can use:

1. **"What collections are available?"**
2. **"Show me the top 10 funds with highest 3-year CAGR"**
3. **"Find equity funds with Sharpe ratio above 0.7"**
4. **"What's the average expense ratio for funds?"**
5. **"Show funds from the Equity - Consumption category"**
6. **"Which funds have the lowest max drawdown?"**

---

## Interactive API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

You can test all endpoints directly from these pages.

---

## Rate Limiting

Currently, there is no rate limiting implemented. Consider implementing rate limiting for production use.

---

## Notes

- Each query creates a fresh agent instance to prevent context accumulation
- Results are automatically limited to prevent large responses
- ISIN (unique identifier) is always included in financial fund queries
- The API uses GPT-4o model by default (configurable via `OPENAI_MODEL`)

---

## Support

For issues or questions, refer to the backend README.md or check the API health endpoint.

