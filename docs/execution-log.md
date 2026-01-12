# Authentication/Authorization Implementation Log

## Overview
Implementation of JWT + OAuth2 authentication system with RBAC

**Start Date**: 2026-01-12
**Plan**: [docs/plan.md](plan.md)

---

## Phase 1: Database Schema & Seed Data

### Step 1: Create execution log file
**Status**: ✅ Completed
**Time**: 2026-01-12

**Decision**: Created execution log to track all changes and decisions during implementation

### Step 2: Update Prisma schema
**Status**: ✅ Completed
**Time**: 2026-01-12
**File**: [apps/backend/prisma/schema.prisma](../apps/backend/prisma/schema.prisma)

**Changes Made**:
1. Added `AuthProvider` enum (LOCAL, GOOGLE, GITHUB, KAKAO)
2. Created `User` model with:
   - UUID primary key
   - Email/password fields (password nullable for OAuth)
   - Profile fields (name, avatar, bio, phone)
   - Auth metadata (provider, providerId, isActive, emailVerified, lastLoginAt)
   - Relations to UserRole, RefreshToken, Post
3. Created `Role` model (id, name, description)
4. Created `Permission` model (id, name, description, resource, action)
5. Created `UserRole` junction table (many-to-many User ↔ Role)
6. Created `RolePermission` junction table (many-to-many Role ↔ Permission)
7. Created `RefreshToken` model for token metadata (tokenHash, deviceId, ipAddress, userAgent, isRevoked, expiresAt, lastUsedAt)
8. Updated `Post` model: changed `author String?` to `authorId String?` with User relation

**Decisions**:
- Used UUID for User ID (more secure than sequential integers)
- Made password nullable to support OAuth-only users
- Used snake_case for database column names (Prisma convention)
- Added indexes on email, provider/providerId, tokenHash, expiresAt for performance
- Used `onDelete: Cascade` for junction tables to automatically clean up orphaned records
- Used `onDelete: SetNull` for Post.author to preserve posts when user is deleted

### Step 3: Create seed file
**Status**: ✅ Completed
**Time**: 2026-01-12
**File**: [apps/backend/prisma/seed.ts](../apps/backend/prisma/seed.ts)

**Changes Made**:
1. Created seed file with bcrypt password hashing
2. Seeds default roles (USER, MODERATOR, ADMIN)
3. Seeds permissions (posts:create, posts:read, posts:update, posts:delete, users:manage, roles:manage)
4. Assigns permissions to roles:
   - USER: posts:create, posts:read, posts:update
   - MODERATOR: all post permissions + users:manage
   - ADMIN: all permissions
5. Creates test accounts:
   - admin@example.com / Admin123! (ADMIN role)
   - user@example.com / User123! (USER role)

**Decisions**:
- Used bcrypt with cost factor 10 for password hashing
- Used upsert to make seed idempotent (can run multiple times safely)
- Created two test accounts for testing both regular users and admins

### Step 4: Configure package.json for seed
**Status**: ✅ Completed
**Time**: 2026-01-12
**File**: [apps/backend/package.json](../apps/backend/package.json)

**Changes Made**:
1. Added `prisma:seed` script: `ts-node prisma/seed.ts`
2. Added `prisma.seed` configuration so Prisma CLI knows how to run the seed
3. Installed bcrypt dependencies for seed file

### Step 5: Fix seed file for Prisma 7
**Status**: ✅ Completed
**Time**: 2026-01-12
**File**: [apps/backend/prisma/seed.ts](../apps/backend/prisma/seed.ts)

**Issue**: Prisma 7 with PostgreSQL adapter requires explicit adapter configuration in seed file

**Fix Applied**:
- Added PostgreSQL Pool and PrismaPg adapter initialization
- Updated PrismaClient construction to use adapter
- Added DATABASE_URL fallback for local execution

### Step 6: Run database sync and seed
**Status**: ✅ Completed
**Time**: 2026-01-12

**Method**: Used `prisma db push` instead of `migrate dev` to avoid interactive requirement

**Results**:
- ✅ Database schema synchronized successfully
- ✅ Seed executed successfully
- ✅ Created 3 roles (USER, MODERATOR, ADMIN)
- ✅ Created 6 permissions (posts:create, read, update, delete, users:manage, roles:manage)
- ✅ Assigned permissions to roles
- ✅ Created 2 test accounts:
  - admin@example.com / Admin123! (ADMIN)
  - user@example.com / User123! (USER)

**Decision**: `db push` is acceptable for development since it syncs schema without creating migration files. For production, proper migrations will be needed.

---

## Phase 2: Redis Integration

### Step 1: Add Redis to docker-compose
**Status**: ✅ Completed
**File**: [docker-compose.yml](../docker-compose.yml)

**Changes**:
- Added Redis 7-alpine service
- Port 6379 exposed
- Persistent volume (redis_data)
- Password protection with REDIS_PASSWORD env var
- AOF persistence enabled
- Health check configured

### Step 2: Update backend environment variables
**Status**: ✅ Completed
**File**: [apps/backend/.env](../apps/backend/.env)

**Added**:
- JWT secrets (ACCESS, REFRESH)
- JWT expiration times (15m, 7d)
- Redis connection config
- OAuth provider placeholders (Google, GitHub, Kakao)

### Step 3: Create Redis module and service
**Status**: ✅ Completed
**Files**:
- [apps/backend/src/redis/redis.module.ts](../apps/backend/src/redis/redis.module.ts)
- [apps/backend/src/redis/redis.service.ts](../apps/backend/src/redis/redis.service.ts)

**Features**:
- Global Redis module
- ioredis client with retry strategy
- Refresh token methods (set, validate, revoke, revokeAll)
- Key prefix pattern for refresh tokens

### Step 4: Install authentication dependencies
**Status**: ✅ Completed

**Installed**:
- @nestjs/jwt, @nestjs/passport
- passport, passport-local, passport-jwt
- passport-google-oauth20, passport-github2, passport-kakao
- All TypeScript types

---

## Phase 3: Backend Authentication Module

### Step 1: Create TokenService
**Status**: ✅ Completed
**File**: [apps/backend/src/auth/token.service.ts](../apps/backend/src/auth/token.service.ts)

**Features**:
- JWT payload interface (sub, email, roles)
- Generate access token (15min expiry)
- Generate refresh token (7d expiry)
- Verify access/refresh tokens
- Hash tokens with SHA256 for storage
- TokenPair type for access + refresh

**Decisions**:
- Used crypto.createHash for token hashing (faster than bcrypt for tokens)
- Separate methods for access and refresh tokens (different secrets and expiration)

### Step 2: Create AuthService
**Status**: ✅ Completed
**File**: [apps/backend/src/auth/auth.service.ts](../apps/backend/src/auth/auth.service.ts)

**Features**:
- register(): Create new user with bcrypt hashed password, assign USER role
- validateLocalUser(): Email/password validation for local strategy
- createRefreshToken(): Store token hash in DB with device metadata, set in Redis
- validateRefreshToken(): Check Redis validity and DB metadata
- revokeRefreshToken(): Mark as revoked in DB, remove from Redis
- findOrCreateOAuthUser(): OAuth user creation/retrieval (for future OAuth implementation)

**Decisions**:
- User must include roles with permissions when queried (for guards)
- Refresh tokens validated in both Redis (fast) and DB (metadata)
- Device tracking via x-device-id header for multi-device support

### Step 3: Create decorators
**Status**: ✅ Completed
**Files**:
- [apps/backend/src/auth/decorators/public.decorator.ts](../apps/backend/src/auth/decorators/public.decorator.ts)
- [apps/backend/src/auth/decorators/current-user.decorator.ts](../apps/backend/src/auth/decorators/current-user.decorator.ts)
- [apps/backend/src/auth/decorators/roles.decorator.ts](../apps/backend/src/auth/decorators/roles.decorator.ts)
- [apps/backend/src/auth/decorators/permissions.decorator.ts](../apps/backend/src/auth/decorators/permissions.decorator.ts)

**Features**:
- @Public(): Bypass JWT authentication (for login, register)
- @CurrentUser(): Extract user from request
- @Roles(...roles): Require specific roles
- @Permissions(...permissions): Require specific permissions

### Step 4: Create DTOs
**Status**: ✅ Completed
**Files**:
- [apps/backend/src/auth/dto/register.dto.ts](../apps/backend/src/auth/dto/register.dto.ts)
- [apps/backend/src/auth/dto/login.dto.ts](../apps/backend/src/auth/dto/login.dto.ts)

**Validation**:
- Email must be valid email format
- Password minimum 8 characters
- All fields required and non-empty

### Step 5: Create Passport strategies
**Status**: ✅ Completed
**Files**:
- [apps/backend/src/auth/strategies/local.strategy.ts](../apps/backend/src/auth/strategies/local.strategy.ts)
- [apps/backend/src/auth/strategies/jwt.strategy.ts](../apps/backend/src/auth/strategies/jwt.strategy.ts)

**Features**:
- LocalStrategy: Validates email/password via AuthService
- JwtStrategy: Extracts JWT from access_token cookie, loads user with roles/permissions

**Decisions**:
- JWT extracted from httpOnly cookies (not Authorization header)
- User validation includes roles → permissions chain for guards

### Step 6: Create guards
**Status**: ✅ Completed
**Files**:
- [apps/backend/src/auth/guards/jwt-auth.guard.ts](../apps/backend/src/auth/guards/jwt-auth.guard.ts)
- [apps/backend/src/auth/guards/local-auth.guard.ts](../apps/backend/src/auth/guards/local-auth.guard.ts)
- [apps/backend/src/auth/guards/roles.guard.ts](../apps/backend/src/auth/guards/roles.guard.ts)
- [apps/backend/src/auth/guards/permissions.guard.ts](../apps/backend/src/auth/guards/permissions.guard.ts)

**Features**:
- JwtAuthGuard: Global guard that respects @Public() decorator
- LocalAuthGuard: Email/password authentication
- RolesGuard: Role-based access control (OR logic)
- PermissionsGuard: Permission-based access control (AND logic)

**Decisions**:
- JwtAuthGuard checks @Public() metadata before validating JWT
- RolesGuard uses `some()` - user needs at least one of the required roles
- PermissionsGuard uses `every()` - user needs all required permissions

### Step 7: Create AuthController
**Status**: ✅ Completed
**File**: [apps/backend/src/auth/auth.controller.ts](../apps/backend/src/auth/auth.controller.ts)

**Endpoints**:
- POST /auth/register - Register with email/password, returns user without password
- POST /auth/login - Login, set httpOnly cookies (access_token, refresh_token), return user
- POST /auth/refresh - Token rotation (revoke old, issue new)
- POST /auth/logout - Clear cookies, revoke refresh token
- GET /auth/me - Get current authenticated user

**Security Decisions**:
- httpOnly: true (XSS protection)
- secure: production only (HTTPS requirement)
- sameSite: 'lax' (CSRF protection)
- Access token: 15min expiry
- Refresh token: 7d expiry
- Token rotation on refresh (old token revoked)
- Device tracking via x-device-id header

### Step 8: Create AuthModule
**Status**: ✅ Completed
**File**: [apps/backend/src/auth/auth.module.ts](../apps/backend/src/auth/auth.module.ts)

**Configuration**:
- Imports: PassportModule (defaultStrategy: jwt), JwtModule, PrismaModule, RedisModule
- Providers: AuthService, TokenService, all Strategies, all Guards
- Controller: AuthController
- Exports: AuthService, TokenService

**Decisions**:
- JwtModule configured via registerAsync for dynamic config injection
- PassportModule with jwt as default strategy

### Step 9: Update AppModule with global guards
**Status**: ✅ Completed
**File**: [apps/backend/src/app.module.ts](../apps/backend/src/app.module.ts)

**Changes**:
- Imported RedisModule and AuthModule
- Added global guards via APP_GUARD:
  1. JwtAuthGuard - Authenticates all endpoints except @Public()
  2. RolesGuard - Enforces @Roles() decorator
  3. PermissionsGuard - Enforces @Permissions() decorator

**Decisions**:
- Guards applied in order: Auth → Roles → Permissions
- All routes protected by default (opt-out with @Public())

---

