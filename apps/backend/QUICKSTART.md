# Quick Start Guide

Get the NestJS Posts API running in under 5 minutes!

## Prerequisites

Choose one of the following:

**Option A: Local Development**
- Node.js 20+
- pnpm
- PostgreSQL running locally

**Option B: Docker (Recommended)**
- Docker & Docker Compose

## Quick Start (Docker - Recommended)

### 1. Navigate to Project Root

```bash
cd /Users/user/Workspace/my/test/docker_fullstack_next_nest
```

### 2. Start Services with Docker Compose

```bash
# Development mode (with hot reload)
docker-compose -f docker-compose.dev.yml up backend

# Or production mode
docker-compose -f docker-compose.prod.yml up backend
```

### 3. Verify API is Running

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "posts-api",
  "uptime": 5.123,
  "timestamp": "2025-12-28T21:30:00.000Z"
}
```

### 4. Create Your First Post

```bash
curl -X POST http://localhost:4000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "content": "Hello, NestJS!",
    "author": "Your Name"
  }'
```

### 5. Get All Posts

```bash
curl http://localhost:4000/posts
```

Done! Your API is ready.

---

## Quick Start (Local Development)

### 1. Navigate to Backend Directory

```bash
cd /Users/user/Workspace/my/test/docker_fullstack_next_nest/apps/backend
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env if needed (default values work with local PostgreSQL)
```

### 4. Start PostgreSQL

**Using Docker:**
```bash
docker run --name postgres-posts \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=posts_db \
  -p 5432:5432 \
  -d postgres:15-alpine
```

**Or use your local PostgreSQL installation**

### 5. Start Development Server

```bash
pnpm start:dev
```

You should see:
```
========================================
🚀 Backend API is running on: http://localhost:4000
📚 API Documentation: http://localhost:4000/posts
🌍 Environment: development
========================================
```

### 6. Test the API

```bash
# Health check
curl http://localhost:4000/health

# Create a post
curl -X POST http://localhost:4000/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "content": "Testing the API"}'

# Get all posts
curl http://localhost:4000/posts
```

---

## Project Structure

```
apps/backend/
├── src/
│   ├── posts/              # Posts module
│   │   ├── dto/            # Data transfer objects
│   │   ├── entities/       # TypeORM entities
│   │   ├── posts.controller.ts
│   │   ├── posts.service.ts
│   │   └── posts.module.ts
│   ├── app.module.ts       # Root module
│   ├── app.controller.ts   # Health checks
│   └── main.ts             # Application entry point
├── Dockerfile              # Production build
├── Dockerfile.dev          # Development build
├── package.json            # Dependencies & scripts
└── .env                    # Environment variables
```

---

## Available API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API status |
| GET | `/health` | Health check |
| POST | `/posts` | Create post |
| GET | `/posts` | Get all posts |
| GET | `/posts/:id` | Get post by ID |
| PATCH | `/posts/:id` | Update post |
| DELETE | `/posts/:id` | Delete post |

---

## Common Commands

```bash
# Development
pnpm start:dev          # Start with hot reload
pnpm build              # Build for production
pnpm start:prod         # Run production build

# Code Quality
pnpm lint               # Lint and auto-fix
pnpm format             # Format with Prettier

# Testing
pnpm test               # Run unit tests
pnpm test:cov           # Test coverage
pnpm test:e2e           # E2E tests
```

---

## Troubleshooting

### Cannot connect to database

**Solution 1: Check PostgreSQL is running**
```bash
docker ps | grep postgres
# or
pg_isready -h localhost -p 5432
```

**Solution 2: Verify environment variables**
```bash
cat .env
# Ensure DATABASE_HOST, DATABASE_PORT, etc. are correct
```

**Solution 3: Check database credentials**
```bash
# Try connecting manually
psql -h localhost -U postgres -d posts_db
```

### Port 4000 already in use

**Solution: Change the port in .env**
```bash
echo "PORT=4001" >> .env
```

### Dependencies installation fails

**Solution: Clear cache and reinstall**
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## Next Steps

1. **Explore the API**: See `API_EXAMPLES.md` for detailed API examples
2. **Read Documentation**: Check `README.md` for comprehensive documentation
3. **Add Features**: Extend the API with your own endpoints
4. **Connect Frontend**: Integrate with Next.js frontend
5. **Deploy**: Use the production Dockerfile for deployment

---

## Environment Variables Reference

```env
# Application
NODE_ENV=development        # development | production
PORT=4000                  # API port

# Frontend
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_HOST=localhost     # postgres for Docker
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=posts_db
```

---

## Support

For issues or questions:
- Check `README.md` for detailed documentation
- Review `API_EXAMPLES.md` for API usage examples
- Inspect logs: `docker logs <container-id>` (Docker) or console output (local)

---

**Happy coding!**
