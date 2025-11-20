const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8000';

type ApiOptions = RequestInit & { asPlainText?: boolean };

async function request<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { asPlainText, ...fetchOptions } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers || {}),
    },
    ...fetchOptions,
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const errorBody = await response.json();
      detail = errorBody.error || errorBody.detail || detail;
    } catch (error) {
      // ignore JSON parse errors
    }
    throw new Error(detail || 'Request failed');
  }

  if (asPlainText) {
    return (await response.text()) as T;
  }

  return response.json() as Promise<T>;
}

export type QueryResponse = {
  result: string;
  success: boolean;
  error: string | null;
};

export async function queryDatabase(query: string): Promise<QueryResponse> {
  return request<QueryResponse>('/api/query', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export type HealthResponse = {
  status: string;
  mongodb: string;
  openai: string;
};

export function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health');
}

export type CollectionsResponse = {
  collections: string[];
  success: boolean;
  error: string | null;
};

export function fetchCollections(): Promise<CollectionsResponse> {
  return request<CollectionsResponse>('/api/collections');
}

export type SchemaResponse = {
  schema_info: string;
  success: boolean;
  error: string | null;
};

export function fetchCollectionSchema(collectionName: string): Promise<SchemaResponse> {
  return request<SchemaResponse>(`/api/schema/${encodeURIComponent(collectionName)}`);
}
