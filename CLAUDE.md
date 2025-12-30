# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Docker-based fullstack monorepo with Next.js 14 frontend, NestJS backend, and PostgreSQL database. Uses pnpm workspaces for dependency management.

## Development Commands

### Docker Workflow (Primary)
```bash
# Start all services (PostgreSQL, Backend, Frontend)
pnpm dev                    # or docker-compose up
pnpm dev:build             # Build and start
pnpm dev:down              # Stop services
pnpm dev:clean             # Stop and remove volumes (clean database)

# View logs
pnpm logs                  # All services
pnpm logs:frontend         # Frontend only
pnpm logs:backend          # Backend only
pnpm logs:db               # Database only
```

### Local Development (Without Docker)

#### Backend
```bash
pnpm backend start:dev     # Development server with watch mode
pnpm backend build         # Production build
pnpm backend start:prod    # Run production build

# Prisma
pnpm backend prisma:generate         # Generate Prisma Client
pnpm backend prisma:migrate          # Run migrations (dev)
pnpm backend prisma:migrate:deploy   # Deploy migrations (prod)
pnpm backend prisma:studio           # Open Prisma Studio
```

#### Frontend
```bash
pnpm frontend dev          # Development server
pnpm frontend build        # Production build
pnpm frontend start        # Run production build
pnpm frontend type-check   # TypeScript type checking
```

### Code Quality
```bash
pnpm lint                  # Lint both apps
pnpm format                # Format both apps
pnpm format:check          # Check formatting
```

### Testing
```bash
# Backend tests
pnpm backend test          # Run unit tests
pnpm backend test:watch    # Watch mode
pnpm backend test:cov      # Coverage report
pnpm backend test:e2e      # E2E tests
```

## Architecture

### Backend (NestJS + Prisma)

**ORM Migration (Important)**: Recently migrated from TypeORM to Prisma 7 with PostgreSQL adapter.

**Database Connection**:
- Uses Prisma 7 with `@prisma/adapter-pg` for PostgreSQL connection pooling
- `PrismaService` (apps/backend/src/prisma/prisma.service.ts) extends PrismaClient
- Connection configured via `DATABASE_URL` environment variable
- Pool adapter pattern: `new Pool() → PrismaPg adapter → PrismaClient`

**Module Structure**:
- `AppModule` → Root module with ConfigModule (global), PrismaModule, PostsModule
- `PrismaModule` → Exports PrismaService globally
- `PostsModule` → CRUD operations for posts (controller, service, DTOs)

**Global Pipes**:
- `ValidationPipe` configured with `whitelist: true`, `transform: true`, `forbidNonWhitelisted: true`

**CORS**:
- Enabled for `FRONTEND_URL` with credentials support

**Prisma Schema Location**: apps/backend/prisma/schema.prisma

**Adding New Endpoints**:
1. Generate Prisma Client after schema changes: `pnpm backend prisma:generate`
2. Run migrations: `pnpm backend prisma:migrate`
3. Create module with NestJS CLI or manually
4. Use PrismaService injection for database operations

### Frontend (Next.js 14 + React Query)

**Data Fetching**:
- Uses TanStack React Query (v5) for server state management
- API client in [apps/frontend/src/lib/api.ts](apps/frontend/src/lib/api.ts)
- Custom `ApiErrorException` for proper error serialization with Suspense boundaries

**Suspense + ErrorBoundary Rules** (CRITICAL):

See [docs/suspense-error-boundary-rules.md](docs/suspense-error-boundary-rules.md) for complete rules. Key points:

1. **Required Structure for Initial Page Data**:
   ```tsx
   <ErrorBoundary fallback={<ErrorView />}>
     <Suspense fallback={<Skeleton />}>
       <DataComponent />
     </Suspense>
   </ErrorBoundary>
   ```

2. **MUST use `useSuspenseQuery`** inside Suspense boundaries (not `useQuery`)

3. **FORBIDDEN to use Suspense for**:
   - User-triggered actions (onClick, onSubmit)
   - Mutations (useMutation)
   - Form inputs or optional data

4. **Data components inside Suspense**:
   - MUST assume data is always available
   - NO `isLoading`, `isError`, or conditional rendering
   - All loading/error states delegated to boundaries

5. **Decision Checklist** (all must be YES to use Suspense):
   - Is data required for initial page render?
   - Is UI meaningless without this data?
   - NOT triggered by user interaction?
   - Page-level or section-level component?

**Component Structure**:
- [apps/frontend/src/components/ErrorBoundary.tsx](apps/frontend/src/components/ErrorBoundary.tsx) → Custom error boundary
- UI components in [apps/frontend/src/components/ui/](apps/frontend/src/components/ui/) → Shadcn/ui based
- Custom hooks in [apps/frontend/src/hooks/](apps/frontend/src/hooks/)

**Styling**: Tailwind CSS with custom configuration

### Environment Variables

**Root `.env`**:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=posts_db
NEXT_PUBLIC_API_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
```

**Backend** (apps/backend/.env):
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/posts_db
FRONTEND_URL=http://localhost:3000
```

**Frontend** (apps/frontend/.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Database Access

```bash
# Connect to PostgreSQL in Docker
docker exec -it fullstack_postgres psql -U postgres -d posts_db

# Or from host (if psql installed)
psql -h localhost -p 5432 -U postgres -d posts_db
```

### Service URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **PostgreSQL**: localhost:5432
- **Health Check**: http://localhost:4000/health

## Common Patterns

### Adding a New Backend Endpoint

1. Update Prisma schema if needed (apps/backend/prisma/schema.prisma)
2. Generate Prisma Client: `pnpm backend prisma:generate`
3. Create migration: `pnpm backend prisma:migrate`
4. Create/update NestJS module:
   - DTOs with class-validator decorators
   - Service with PrismaService injection
   - Controller with proper HTTP decorators
5. Import module in AppModule

### Adding a New Frontend Feature

1. Create API function in [apps/frontend/src/lib/api.ts](apps/frontend/src/lib/api.ts)
2. Create custom hook with `useSuspenseQuery` or `useMutation` in [apps/frontend/src/hooks/](apps/frontend/src/hooks/)
3. Wrap page-level data components with ErrorBoundary + Suspense
4. Use mutations without Suspense for user interactions

### Workspace Package Management

```bash
# Add dependency to specific app
pnpm --filter frontend add <package>
pnpm --filter backend add <package>

# Remove dependency
pnpm --filter frontend remove <package>
pnpm --filter backend remove <package>
```

## Important Notes

- **Node.js version**: >=20.0.0 (check package.json engines)
- **Package manager**: pnpm >=8.0.0 (enforced)
- **Backend runs Prisma generate** automatically before build and dev (prebuild/prestart:dev hooks)
- **Docker service names**: `frontend`, `backend`, `postgres` (use these for inter-container communication)
- **Hot reload** is configured in Docker via volume mounts (excludes node_modules)
