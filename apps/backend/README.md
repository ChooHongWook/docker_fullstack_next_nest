# NestJS Posts API Backend

A production-ready NestJS backend API for managing blog posts with PostgreSQL database integration.

## Features

- Complete CRUD operations for posts
- TypeORM with PostgreSQL integration
- Input validation with class-validator
- CORS enabled for frontend integration
- Docker support (development & production)
- TypeScript with strict type checking
- ESLint & Prettier code formatting
- Environment-based configuration

## Tech Stack

- **Framework**: NestJS 10.x
- **Database**: PostgreSQL with TypeORM
- **Validation**: class-validator & class-transformer
- **Runtime**: Node.js 20 (Alpine)
- **Package Manager**: pnpm

## Project Structure

```
apps/backend/
├── src/
│   ├── posts/
│   │   ├── dto/
│   │   │   ├── create-post.dto.ts
│   │   │   └── update-post.dto.ts
│   │   ├── entities/
│   │   │   └── post.entity.ts
│   │   ├── posts.controller.ts
│   │   ├── posts.service.ts
│   │   └── posts.module.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
├── Dockerfile (production)
├── Dockerfile.dev (development)
├── package.json
└── tsconfig.json
```

## API Endpoints

### Posts

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| POST | `/posts` | Create a new post | 201 |
| GET | `/posts` | Get all posts | 200 |
| GET | `/posts/:id` | Get post by ID | 200 |
| PATCH | `/posts/:id` | Update post | 200 |
| DELETE | `/posts/:id` | Delete post | 204 |

### Post Schema

```typescript
{
  id: number;           // Auto-generated
  title: string;        // Max 255 chars, required
  content: string;      // Text, required
  author?: string;      // Max 100 chars, optional
  createdAt: Date;      // Auto-generated
  updatedAt: Date;      // Auto-updated
}
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL (or Docker)

### Installation

```bash
# Install dependencies
pnpm install
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000

DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=posts_db
```

### Running Locally

```bash
# Development mode (with hot reload)
pnpm start:dev

# Production mode
pnpm build
pnpm start:prod
```

### Running with Docker

#### Development Mode (Hot Reload)

```bash
docker build -f Dockerfile.dev -t backend-dev .
docker run -p 4000:4000 -v $(pwd):/app backend-dev
```

#### Production Mode

```bash
docker build -t backend-prod .
docker run -p 4000:4000 backend-prod
```

## Development

### Code Quality

```bash
# Lint code
pnpm lint

# Format code
pnpm format
```

### Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## API Usage Examples

### Create a Post

```bash
curl -X POST http://localhost:4000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "content": "This is the content of my first post",
    "author": "John Doe"
  }'
```

### Get All Posts

```bash
curl http://localhost:4000/posts
```

### Get Single Post

```bash
curl http://localhost:4000/posts/1
```

### Update Post

```bash
curl -X PATCH http://localhost:4000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "content": "Updated content"
  }'
```

### Delete Post

```bash
curl -X DELETE http://localhost:4000/posts/1
```

## Database

The application uses TypeORM with PostgreSQL. Database schema is automatically synchronized in development mode.

### Migrations (Production)

For production, disable `synchronize` and use migrations:

```bash
# Generate migration
pnpm typeorm migration:generate -n MigrationName

# Run migrations
pnpm typeorm migration:run

# Revert migration
pnpm typeorm migration:revert
```

## Configuration

### CORS

CORS is enabled for the frontend URL specified in `FRONTEND_URL` environment variable (default: `http://localhost:3000`).

### Validation

Global validation pipe is configured with:
- `whitelist: true` - Strip non-whitelisted properties
- `transform: true` - Transform payloads to DTO instances
- `forbidNonWhitelisted: true` - Throw error on non-whitelisted properties

## Production Deployment

The production Dockerfile uses a multi-stage build for optimized image size:

1. **Dependencies Stage**: Install production dependencies only
2. **Builder Stage**: Build TypeScript to JavaScript
3. **Runner Stage**: Minimal runtime with non-root user

## Error Handling

The API uses NestJS built-in exception filters:

- `400 Bad Request` - Validation errors
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server errors

## Security

- Input validation on all endpoints
- SQL injection prevention via TypeORM
- CORS configured for specific origins
- Non-root user in production Docker image
- No sensitive data in logs

## License

MIT
