"""MongoDB tools and utilities."""
import json
import ast
import codecs
import re
from pymongo import MongoClient
from core.config import MONGO_URI, DB_NAME


def get_mongo_client():
    """Get MongoDB client connection."""
    return MongoClient(MONGO_URI)


def list_collections_tool(query: str) -> str:
    """Lists all collections in the MongoDB database."""
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

