# API Examples and Testing Guide

## Base URL
```
http://localhost:4000
```

## Health Check Endpoints

### Root Endpoint
```bash
curl http://localhost:4000/

# Response
{
  "status": "ok",
  "message": "Posts API is running",
  "timestamp": "2025-12-28T21:30:00.000Z"
}
```

### Health Check
```bash
curl http://localhost:4000/health

# Response
{
  "status": "healthy",
  "service": "posts-api",
  "uptime": 123.456,
  "timestamp": "2025-12-28T21:30:00.000Z"
}
```

## Posts CRUD Operations

### 1. Create a Post

**Request:**
```bash
curl -X POST http://localhost:4000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Getting Started with NestJS",
    "content": "NestJS is a progressive Node.js framework for building efficient and scalable server-side applications.",
    "author": "John Doe"
  }'
```

**Response (201 Created):**
```json
{
  "id": 1,
  "title": "Getting Started with NestJS",
  "content": "NestJS is a progressive Node.js framework for building efficient and scalable server-side applications.",
  "author": "John Doe",
  "createdAt": "2025-12-28T21:30:00.000Z",
  "updatedAt": "2025-12-28T21:30:00.000Z"
}
```

### 2. Create Post Without Author (Optional Field)

**Request:**
```bash
curl -X POST http://localhost:4000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "TypeORM Best Practices",
    "content": "Learn how to use TypeORM effectively in your NestJS applications."
  }'
```

**Response (201 Created):**
```json
{
  "id": 2,
  "title": "TypeORM Best Practices",
  "content": "Learn how to use TypeORM effectively in your NestJS applications.",
  "author": null,
  "createdAt": "2025-12-28T21:31:00.000Z",
  "updatedAt": "2025-12-28T21:31:00.000Z"
}
```

### 3. Validation Error - Missing Required Field

**Request:**
```bash
curl -X POST http://localhost:4000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Invalid Post"
  }'
```

**Response (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": [
    "content should not be empty",
    "content must be a string"
  ],
  "error": "Bad Request"
}
```

### 4. Get All Posts

**Request:**
```bash
curl http://localhost:4000/posts
```

**Response (200 OK):**
```json
[
  {
    "id": 2,
    "title": "TypeORM Best Practices",
    "content": "Learn how to use TypeORM effectively in your NestJS applications.",
    "author": null,
    "createdAt": "2025-12-28T21:31:00.000Z",
    "updatedAt": "2025-12-28T21:31:00.000Z"
  },
  {
    "id": 1,
    "title": "Getting Started with NestJS",
    "content": "NestJS is a progressive Node.js framework for building efficient and scalable server-side applications.",
    "author": "John Doe",
    "createdAt": "2025-12-28T21:30:00.000Z",
    "updatedAt": "2025-12-28T21:30:00.000Z"
  }
]
```

### 5. Get Single Post

**Request:**
```bash
curl http://localhost:4000/posts/1
```

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Getting Started with NestJS",
  "content": "NestJS is a progressive Node.js framework for building efficient and scalable server-side applications.",
  "author": "John Doe",
  "createdAt": "2025-12-28T21:30:00.000Z",
  "updatedAt": "2025-12-28T21:30:00.000Z"
}
```

### 6. Get Non-Existent Post

**Request:**
```bash
curl http://localhost:4000/posts/999
```

**Response (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Post with ID 999 not found",
  "error": "Not Found"
}
```

### 7. Update Post - Partial Update

**Request:**
```bash
curl -X PATCH http://localhost:4000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Getting Started with NestJS - Updated Edition"
  }'
```

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Getting Started with NestJS - Updated Edition",
  "content": "NestJS is a progressive Node.js framework for building efficient and scalable server-side applications.",
  "author": "John Doe",
  "createdAt": "2025-12-28T21:30:00.000Z",
  "updatedAt": "2025-12-28T21:35:00.000Z"
}
```

### 8. Update Post - Multiple Fields

**Request:**
```bash
curl -X PATCH http://localhost:4000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advanced NestJS Concepts",
    "content": "Deep dive into advanced patterns and practices in NestJS.",
    "author": "Jane Smith"
  }'
```

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Advanced NestJS Concepts",
  "content": "Deep dive into advanced patterns and practices in NestJS.",
  "author": "Jane Smith",
  "createdAt": "2025-12-28T21:30:00.000Z",
  "updatedAt": "2025-12-28T21:36:00.000Z"
}
```

### 9. Delete Post

**Request:**
```bash
curl -X DELETE http://localhost:4000/posts/1
```

**Response (204 No Content):**
```
(Empty response body)
```

### 10. Delete Non-Existent Post

**Request:**
```bash
curl -X DELETE http://localhost:4000/posts/999
```

**Response (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Post with ID 999 not found",
  "error": "Not Found"
}
```

## Testing with Different Tools

### Using HTTPie

```bash
# Install HTTPie
brew install httpie  # macOS
# or
pip install httpie

# Create a post
http POST localhost:4000/posts title="Test Post" content="Test content" author="HTTPie User"

# Get all posts
http GET localhost:4000/posts

# Get single post
http GET localhost:4000/posts/1

# Update post
http PATCH localhost:4000/posts/1 title="Updated Title"

# Delete post
http DELETE localhost:4000/posts/1
```

### Using Postman

1. Import this collection URL or create requests manually
2. Set base URL: `http://localhost:4000`
3. Use the endpoints described above

### Using JavaScript/Fetch

```javascript
// Create a post
const createPost = async () => {
  const response = await fetch('http://localhost:4000/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'JavaScript Test Post',
      content: 'Created using fetch API',
      author: 'JS Developer'
    })
  });
  return response.json();
};

// Get all posts
const getAllPosts = async () => {
  const response = await fetch('http://localhost:4000/posts');
  return response.json();
};

// Update a post
const updatePost = async (id) => {
  const response = await fetch(`http://localhost:4000/posts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Updated via JavaScript'
    })
  });
  return response.json();
};

// Delete a post
const deletePost = async (id) => {
  const response = await fetch(`http://localhost:4000/posts/${id}`, {
    method: 'DELETE'
  });
  return response.status === 204;
};
```

## Validation Rules

### CreatePostDto
- `title`: Required, string, max 255 characters
- `content`: Required, string
- `author`: Optional, string, max 100 characters

### UpdatePostDto
- `title`: Optional, string, max 255 characters
- `content`: Optional, string
- `author`: Optional, string, max 100 characters

## Common Error Responses

### 400 Bad Request
Invalid input data or validation failure

### 404 Not Found
Resource not found (post with specified ID doesn't exist)

### 500 Internal Server Error
Server-side error (database connection issues, etc.)

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Posts are returned in descending order by creation date (newest first)
- The DELETE endpoint returns 204 No Content on success (empty response body)
- All POST/PATCH requests require `Content-Type: application/json` header
