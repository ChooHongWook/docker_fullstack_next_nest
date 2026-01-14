# Docker Fullstack Next.js + NestJS CRUD Application

[English](README.md) | [한국어](README.ko.md)

Complete Docker-based fullstack application with Next.js frontend, NestJS backend, and PostgreSQL database for managing posts/articles.

## Features

### Core Features

- **Frontend**: Modern Next.js 14 with TypeScript, Tailwind CSS, and React Query
- **Backend**: NestJS with Prisma ORM and PostgreSQL
- **Database**: PostgreSQL 16 in Docker with persistent volumes
- **Monorepo**: pnpm workspaces for efficient dependency management
- **Docker**: Complete containerization for development and production
- **CRUD Operations**: Create, read, update, and delete posts
- **Hot Reload**: Development mode with live code updates
- **Type Safety**: Full TypeScript support across the stack
- **Responsive UI**: Mobile-first design that works on all devices

### Authentication & Authorization

- **JWT Authentication**: Access token (15min) + Refresh token (7d)
- **Cookie-based Storage**: HttpOnly cookies for XSS protection
- **OAuth 2.0**: Google, GitHub, Kakao integration
- **RBAC System**: Role-Based Access Control with permissions
- **Token Refresh**: Automatic token refresh with retry queue
- **Route Protection**: Next.js middleware for protected routes
- **Session Management**: Redis + PostgreSQL hybrid storage

### Monitoring & Observability

- **Prometheus**: Real-time metrics collection from all services
- **Grafana**: Pre-configured dashboards for visualization
- **Application Metrics**: NestJS performance, response times, error rates
- **Database Metrics**: PostgreSQL connections, queries, cache hits
- **Cache Metrics**: Redis operations, memory usage, key statistics
- **System Metrics**: CPU, memory, disk, network usage

## Technology Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **SWR** - Data fetching and caching
- **Axios** - HTTP client

### Backend

- **NestJS** - Progressive Node.js framework
- **TypeORM** - ORM for TypeScript and JavaScript
- **PostgreSQL** - Relational database
- **class-validator** - Validation decorators
- **class-transformer** - Object transformation

### DevOps & Monitoring

- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **pnpm** - Fast, disk space efficient package manager
- **Prometheus** - Metrics collection and monitoring
- **Grafana** - Metrics visualization and dashboards
- **Exporters** - PostgreSQL, Redis, and Node.js system metrics

## Project Structure

```
docker_fullstack_next_nest/
├── apps/
│   ├── frontend/              # Next.js application
│   │   ├── src/
│   │   │   ├── app/           # App router pages
│   │   │   ├── components/    # React components
│   │   │   ├── lib/           # API client & types
│   │   │   └── hooks/         # Custom React hooks
│   │   ├── Dockerfile         # Production build
│   │   └── Dockerfile.dev     # Development build
│   └── backend/               # NestJS application
│       ├── src/
│       │   ├── posts/         # Posts CRUD module
│       │   ├── app.module.ts  # Root module
│       │   └── main.ts        # Entry point
│       ├── Dockerfile         # Production build
│       └── Dockerfile.dev     # Development build
├── docker-compose.yml         # Main development config
├── docker-compose.dev.yml     # Development with hot reload
├── docker-compose.prod.yml    # Production config
├── package.json               # Root workspace config
└── pnpm-workspace.yaml        # Workspace definition
```

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- pnpm installed (optional for local development)
- Git installed

### 1. Clone and Setup

```bash
# Navigate to project directory
cd docker_fullstack_next_nest

# Copy environment file
cp .env.example .env
```

### 2. Start with Docker Compose

```bash
# Start all services (PostgreSQL, Backend, Frontend)
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

This will start:

- **PostgreSQL** on http://localhost:5432
- **Backend API** on http://localhost:4000
- **Frontend UI** on http://localhost:3000
- **Prometheus** on http://localhost:9090
- **Grafana** on http://localhost:3001

### 3. Access the Application

Open your browser and visit:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Health Check**: http://localhost:4000/health
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Backend Metrics**: http://localhost:4000/metrics

### 4. Stop Services

```bash
# Stop services
docker-compose down

# Stop and remove volumes (clean database)
docker-compose down -v
```

## Development Workflow

### Using Docker Compose (Recommended)

```bash
# Start all services with hot reload
pnpm dev
# or
docker-compose up

# Build and start
pnpm dev:build
# or
docker-compose up --build

# View logs
pnpm logs              # All services
pnpm logs:frontend     # Frontend only
pnpm logs:backend      # Backend only
pnpm logs:db           # Database only
pnpm logs:prometheus   # Prometheus only
pnpm logs:grafana      # Grafana only

# Monitoring services
pnpm monitoring:up      # Start monitoring stack only
pnpm monitoring:down    # Stop monitoring stack
pnpm monitoring:restart # Restart Prometheus and Grafana

# Stop services
pnpm dev:down
# or
docker-compose down

# Clean everything (including volumes)
pnpm dev:clean
# or
docker-compose down -v
```

### Monitoring Setup

The project includes a complete monitoring stack:

1. **Prometheus** collects metrics from:
   - NestJS backend (application metrics)
   - PostgreSQL (database metrics)
   - Redis (cache metrics)
   - Node Exporter (system metrics)

2. **Grafana** provides visualization:
   - Pre-configured Prometheus datasource
   - NestJS application dashboard
   - Access at http://localhost:3001 (admin/admin)

3. **Metrics Endpoints**:
   - Backend: http://localhost:4000/metrics
   - PostgreSQL Exporter: http://localhost:9187/metrics
   - Redis Exporter: http://localhost:9121/metrics
   - Node Exporter: http://localhost:9100/metrics

### Local Development (Without Docker)

#### Backend

```bash
cd apps/backend

# Install dependencies
pnpm install

# Create .env file
cp .env.example .env

# Run development server
pnpm start:dev

# Build for production
pnpm build

# Run production
pnpm start:prod
```

#### Frontend

```bash
cd apps/frontend

# Install dependencies
pnpm install

# Create .env.local file
cp .env.example .env.local

# Run development server
pnpm dev

# Build for production
pnpm build

# Run production
pnpm start
```

## Environment Variables

### Root `.env`

```env
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=posts_db

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000

# Backend Configuration
FRONTEND_URL=http://localhost:3000
```

### Backend `.env`

```env
NODE_ENV=development
PORT=4000

DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=posts_db

FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## API Endpoints

### Posts API

Base URL: `http://localhost:4000`

| Method | Endpoint     | Description     | Request Body                  |
| ------ | ------------ | --------------- | ----------------------------- |
| GET    | `/posts`     | List all posts  | -                             |
| GET    | `/posts/:id` | Get post by ID  | -                             |
| POST   | `/posts`     | Create new post | `{title, content, author?}`   |
| PATCH  | `/posts/:id` | Update post     | `{title?, content?, author?}` |
| DELETE | `/posts/:id` | Delete post     | -                             |

### Example Requests

#### Create Post

```bash
curl -X POST http://localhost:4000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "content": "This is the content of my first post.",
    "author": "John Doe"
  }'
```

#### Get All Posts

```bash
curl http://localhost:4000/posts
```

#### Get Single Post

```bash
curl http://localhost:4000/posts/1
```

#### Update Post

```bash
curl -X PATCH http://localhost:4000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title"
  }'
```

#### Delete Post

```bash
curl -X DELETE http://localhost:4000/posts/1
```

## Database Access

### Connect to PostgreSQL

```bash
# Using Docker exec
docker exec -it fullstack_postgres psql -U postgres -d posts_db

# Using psql from host (if installed)
psql -h localhost -p 5432 -U postgres -d posts_db
```

### Database Schema

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Production Deployment

### Build Production Images

```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Start production services
pnpm prod:build
# or
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production services
pnpm prod:down
# or
docker-compose -f docker-compose.prod.yml down
```

### Production Environment Variables

Update `.env` for production:

```env
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=strong_password_here
POSTGRES_DB=posts_db_prod

NEXT_PUBLIC_API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

## Workspace Commands

```bash
# Run frontend-specific commands
pnpm frontend dev
pnpm frontend build
pnpm frontend lint

# Run backend-specific commands
pnpm backend start:dev
pnpm backend build
pnpm backend lint

# Install package for specific app
pnpm --filter frontend add <package-name>
pnpm --filter backend add <package-name>

# Install dependencies for all workspaces
pnpm install
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000
lsof -i :4000
lsof -i :5432

# Kill the process or change port in docker-compose.yml
```

### Database Connection Failed

- Check PostgreSQL container is healthy: `docker ps`
- Verify environment variables in backend
- Ensure DATABASE_HOST is set to 'postgres' (service name in Docker)

### Frontend Can't Reach Backend

- Verify NEXT_PUBLIC_API_URL in frontend .env
- Check CORS configuration in backend main.ts
- Ensure backend container is running: `docker ps`

### Hot Reload Not Working

- Verify volume mounts in docker-compose.yml
- Restart containers with `--build` flag
- Check node_modules is in .dockerignore

### Clean Start

```bash
# Stop all containers
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Rebuild everything
docker-compose up --build
```

## Features & Functionality

### Frontend Features

- **Posts List**: Beautiful grid layout with responsive design
- **Create Post**: Form with validation and error handling
- **View Post**: Detailed post view with metadata
- **Edit Post**: Pre-filled form for updating posts
- **Delete Post**: Confirmation dialog before deletion
- **Loading States**: Skeleton screens during data fetching
- **Error Handling**: User-friendly error messages
- **Optimistic Updates**: Immediate UI feedback
- **Responsive Design**: Works on mobile, tablet, desktop

### Backend Features

- **RESTful API**: Standard HTTP methods and status codes
- **Input Validation**: class-validator decorators on DTOs
- **Error Handling**: Proper exception filters and responses
- **Database Integration**: TypeORM with PostgreSQL
- **CORS**: Configured for frontend origin
- **Health Checks**: /health endpoint for monitoring
- **Auto-sync**: Database schema synchronization in development
- **Logging**: Request/response logging in development

## Testing

### Manual Testing

1. **Create a Post**
   - Go to http://localhost:3000/posts/new
   - Fill in title, content, and optional author
   - Click "Create Post"
   - Verify redirect to posts list

2. **View Posts**
   - Go to http://localhost:3000/posts
   - See all posts in grid layout
   - Click "View" on any post

3. **Edit Post**
   - From post detail or list, click "Edit"
   - Update fields
   - Click "Update Post"
   - Verify changes

4. **Delete Post**
   - Click "Delete" button
   - Confirm in dialog
   - Verify post is removed

### API Testing

```bash
# Test health endpoint
curl http://localhost:4000/health

# Test create
curl -X POST http://localhost:4000/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "content": "Test content"}'

# Test read all
curl http://localhost:4000/posts

# Test read one
curl http://localhost:4000/posts/1

# Test update
curl -X PATCH http://localhost:4000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated"}'

# Test delete
curl -X DELETE http://localhost:4000/posts/1
```

## Contributing

### Code Style

- **Frontend**: ESLint + Prettier with Next.js config
- **Backend**: ESLint + Prettier with NestJS config
- **TypeScript**: Strict mode enabled

### Commit Guidelines

1. Create feature branch
2. Make changes
3. Test locally
4. Commit with clear message
5. Create pull request

## Performance Optimization

### Frontend

- SWR for client-side caching
- Next.js Image component for optimized images
- Code splitting with dynamic imports
- Static generation where possible

### Backend

- Database connection pooling (TypeORM default)
- Query optimization with proper indexes
- Pagination for large datasets (to be implemented)

### Docker

- Multi-stage builds for smaller images
- Alpine Linux base images
- Layer caching optimization
- .dockerignore to exclude unnecessary files

## Security Considerations

### Backend

- Input validation with class-validator
- SQL injection protection via TypeORM
- CORS restricted to frontend URL
- Environment variables for secrets
- Non-root user in production container

### Frontend

- HTTPS in production (recommended)
- Environment variables for API URLs
- Input sanitization
- XSS protection via React

## Documentation

- **Backend API**: See [apps/backend/README.md](apps/backend/README.md)
- **Frontend**: See [apps/frontend/README.md](apps/frontend/README.md)
- **API Examples**: See [apps/backend/API_EXAMPLES.md](apps/backend/API_EXAMPLES.md)

## License

MIT

## Support

For issues, questions, or contributions:

1. Check existing documentation
2. Review troubleshooting section
3. Check Docker logs: `docker-compose logs`
4. Create an issue with detailed information

## Roadmap

### Short-term

- [ ] Add authentication (JWT)
- [ ] Implement search functionality
- [ ] Add post categories/tags
- [ ] Rich text editor
- [ ] Image uploads

### Long-term

- [ ] Comment system
- [ ] User profiles
- [ ] Like/favorite posts
- [ ] Email notifications
- [ ] GraphQL API option

---

**Built with specialized agents**:

- Senior Backend Developer (10 years NestJS experience)
- Senior Frontend Developer (10 years Next.js experience)

Made with ❤️ using Docker, Next.js, NestJS, and PostgreSQL
