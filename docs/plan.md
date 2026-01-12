# Authentication/Authorization Implementation Plan

## Requirements Summary

### Authentication Methods
- **JWT**: Primary token-based authentication with HttpOnly cookies
- **OAuth2**: Social login integration (Google, GitHub, Kakao)
- **Local Auth**: Email/password with bcrypt hashing

### Architecture Decisions
- **Refresh Tokens**: Redis (validation) + PostgreSQL (metadata with user_id, device_id, last_used_at, revoked)
- **RBAC**: Complex role + permission system (many-to-many relationships)
- **OAuth Redirect**: Return to previous page using base64-encoded state parameter
- **Token Storage**: HttpOnly, Secure cookies (access_token, refresh_token)
- **Token Expiry**: Access 15min, Refresh 7 days

### User Model Fields
- Basic: email, password (nullable for OAuth), name
- OAuth: provider, providerId
- Profile: avatar, bio, phone
- Status: isActive, emailVerified, lastLoginAt

## Current Architecture Analysis

### Backend
- **Framework**: NestJS with Prisma 7 + PostgreSQL adapter
- **Current State**: NO auth infrastructure (clean slate)
- **Modules**: AppModule → ConfigModule (global), PrismaModule (global), PostsModule
- **Database**: Single Post table (author field is string, needs migration to User relation)

### Frontend
- **Framework**: Next.js 14 App Router
- **Data Fetching**: TanStack React Query v5 with useSuspenseQuery for page data
- **API Client**: Axios with custom ApiErrorException
- **Error Handling**: ErrorBoundary + Suspense pattern
- **Current State**: NO auth (no guards, no protected routes, no cookies)

### Infrastructure
- **Docker Services**: PostgreSQL 16-alpine (need to add Redis)
- **Ports**: 3000 (frontend), 4000 (backend), 5432 (postgres)
- **CORS**: Enabled with credentials support already configured

---

## Implementation Plan

### Phase 1: Database Schema & Seed Data (Priority 1)

**File**: [apps/backend/prisma/schema.prisma](apps/backend/prisma/schema.prisma)

**Changes**:
1. Add User model with all fields (id, email, password, name, avatar, bio, phone, provider, providerId, isActive, emailVerified, lastLoginAt, createdAt, updatedAt)
2. Add Role model (id, name, description)
3. Add Permission model (id, name, description, resource, action)
4. Add UserRole junction table (userId, roleId, assignedAt)
5. Add RolePermission junction table (roleId, permissionId, grantedAt)
6. Add RefreshToken model (id, userId, tokenHash, deviceId, ipAddress, userAgent, isRevoked, expiresAt, lastUsedAt, createdAt)
7. Update Post model: change `author String?` to `authorId String?` with User relation

**Seed File**: [apps/backend/prisma/seed.ts](apps/backend/prisma/seed.ts) (NEW)
- Create default roles: USER, MODERATOR, ADMIN
- Create permissions: posts:create, posts:read, posts:update, posts:delete, users:manage, roles:manage
- Assign permissions to roles
- Create test admin user: admin@example.com / Admin123!

**Commands**:
```bash
pnpm backend prisma:generate
pnpm backend prisma:migrate dev --name add-auth-system
pnpm backend prisma db seed
```

---

### Phase 2: Redis Integration (Priority 1)

**Docker Compose**: [docker-compose.yml](docker-compose.yml)
- Add Redis 7-alpine service (port 6379)
- Add redis_data volume
- Add healthcheck for Redis
- Set REDIS_PASSWORD environment variable

**Backend Environment**: [apps/backend/.env](apps/backend/.env)
```env
# JWT Secrets
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_password
REDIS_DB=0

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:4000/auth/github/callback

KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
KAKAO_CALLBACK_URL=http://localhost:4000/auth/kakao/callback
```

**New Files**:
1. [apps/backend/src/redis/redis.module.ts](apps/backend/src/redis/redis.module.ts) - Global Redis module with ioredis client
2. [apps/backend/src/redis/redis.service.ts](apps/backend/src/redis/redis.service.ts) - Service with refresh token methods (setRefreshToken, validateRefreshToken, revokeRefreshToken, revokeAllUserTokens)

**Dependencies**:
```bash
pnpm --filter backend add ioredis
```

---

### Phase 3: Backend Authentication Module (Priority 1)

**Module Structure**: [apps/backend/src/auth/](apps/backend/src/auth/)

**Core Services**:
1. **token.service.ts** - JWT generation/validation, token hashing
2. **auth.service.ts** - User registration, validation, refresh token management, OAuth user creation

**Strategies** (Passport.js):
1. **strategies/local.strategy.ts** - Email/password validation
2. **strategies/jwt.strategy.ts** - Extract JWT from cookies, validate user
3. **strategies/jwt-refresh.strategy.ts** - Refresh token validation
4. **strategies/google.strategy.ts** - Google OAuth
5. **strategies/github.strategy.ts** - GitHub OAuth
6. **strategies/kakao.strategy.ts** - Kakao OAuth

**Guards**:
1. **guards/jwt-auth.guard.ts** - Global JWT guard (respects @Public decorator)
2. **guards/local-auth.guard.ts** - Local login guard
3. **guards/jwt-refresh.guard.ts** - Refresh token guard
4. **guards/roles.guard.ts** - Role-based access control
5. **guards/permissions.guard.ts** - Permission-based access control

**Decorators**:
1. **decorators/public.decorator.ts** - @Public() to bypass JWT guard
2. **decorators/current-user.decorator.ts** - @CurrentUser() to get authenticated user
3. **decorators/roles.decorator.ts** - @Roles('ADMIN', 'MODERATOR')
4. **decorators/permissions.decorator.ts** - @Permissions('posts:create', 'posts:delete')

**DTOs**:
1. **dto/register.dto.ts** - Email, password (strong validation), name
2. **dto/login.dto.ts** - Email, password
3. **dto/auth-response.dto.ts** - User without password

**Controller**: [apps/backend/src/auth/auth.controller.ts](apps/backend/src/auth/auth.controller.ts)

**Endpoints**:
- `POST /auth/register` - Register with email/password
- `POST /auth/login` - Login, set httpOnly cookies
- `POST /auth/logout` - Clear cookies, revoke refresh token
- `POST /auth/refresh` - Token rotation (revoke old, issue new)
- `GET /auth/me` - Get current user (protected)
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/github/callback` - GitHub OAuth callback
- `GET /auth/kakao` - Initiate Kakao OAuth
- `GET /auth/kakao/callback` - Kakao OAuth callback

**Dependencies**:
```bash
pnpm --filter backend add @nestjs/jwt @nestjs/passport passport passport-local passport-jwt passport-google-oauth20 passport-github2 passport-kakao bcrypt
pnpm --filter backend add -D @types/passport-local @types/passport-jwt @types/bcrypt @types/passport-google-oauth20 @types/passport-github2 @types/passport-kakao
```

**AppModule Update**: [apps/backend/src/app.module.ts](apps/backend/src/app.module.ts)
- Import RedisModule, AuthModule
- Add global guards: JwtAuthGuard, RolesGuard, PermissionsGuard (using APP_GUARD provider)

---

### Phase 4: Backend Posts Module Update (Priority 2)

**File**: [apps/backend/src/posts/posts.controller.ts](apps/backend/src/posts/posts.controller.ts)

**Changes**:
- Add `@Public()` to GET endpoints (list, detail)
- Add `@Permissions('posts:create')` to POST
- Add `@Permissions('posts:update')` to PATCH with ownership check
- Add `@Permissions('posts:delete')` to DELETE with ownership check
- Inject `@CurrentUser()` to get authenticated user
- Use `user.id` as authorId when creating posts

**File**: [apps/backend/src/posts/posts.service.ts](apps/backend/src/posts/posts.service.ts)
- Update `create()` method signature to accept `authorId: string`
- Update Prisma queries to include author relation

---

### Phase 5: Frontend API Client Update (Priority 1)

**File**: [apps/frontend/src/lib/api.ts](apps/frontend/src/lib/api.ts)

**Changes**:
1. Add `withCredentials: true` to axios config
2. Add request interceptor for device ID header (x-device-id)
3. Add response interceptor for 401 handling with token refresh
4. Implement request queue to prevent race conditions during refresh
5. Add `authApi` object with methods:
   - register(data): Promise<User>
   - login(data): Promise<{user, message}>
   - logout(): Promise<void>
   - getCurrentUser(): Promise<User>
   - refresh(): Promise<void>
   - getOAuthUrl(provider, returnUrl?): string

**Device ID Generation**:
- Store in localStorage: `device_${timestamp}_${random}`
- Send in x-device-id header for refresh token tracking

---

### Phase 6: Frontend Auth Types (Priority 2)

**File**: [apps/frontend/src/lib/types.ts](apps/frontend/src/lib/types.ts) (UPDATE)

**Add Types**:
- User (with roles array)
- Role (with permissions array)
- Permission
- UserRole, RolePermission
- RegisterDto, LoginDto

---

### Phase 7: Frontend Auth Hooks (Priority 1)

**File**: [apps/frontend/src/hooks/useAuth.ts](apps/frontend/src/hooks/useAuth.ts) (NEW)

**Hooks** (React Query):
1. `useCurrentUser()` - useQuery for current user (NOT useSuspenseQuery, staleTime: 5min)
2. `useLogin()` - useMutation for login, updates query cache, redirects to /
3. `useRegister()` - useMutation for registration, redirects to /login
4. `useLogout()` - useMutation for logout, clears cache, redirects to /login

**Pattern**: Use regular `useQuery` (not Suspense) for auth state because:
- Auth is checked on every route (not just initial page load)
- Should not block rendering with Suspense
- Cache with staleTime for performance

---

### Phase 8: Frontend Auth Pages (Priority 2)

**New Pages**:
1. [apps/frontend/src/app/login/page.tsx](apps/frontend/src/app/login/page.tsx)
   - Email/password form
   - Social login buttons (Google, GitHub, Kakao)
   - Link to register
   - Handle returnUrl query param

2. [apps/frontend/src/app/register/page.tsx](apps/frontend/src/app/register/page.tsx)
   - Registration form with validation
   - Link to login

3. [apps/frontend/src/app/auth/callback/page.tsx](apps/frontend/src/app/auth/callback/page.tsx)
   - OAuth callback handler
   - Fetch current user
   - Redirect to returnUrl or /

4. [apps/frontend/src/app/auth/error/page.tsx](apps/frontend/src/app/auth/error/page.tsx) (NEW)
   - OAuth error page

**UI Components**: Use existing shadcn/ui components (Button, Input, Label, Card)

---

### Phase 9: Frontend Route Protection (Priority 2)

**File**: [apps/frontend/src/middleware.ts](apps/frontend/src/middleware.ts) (NEW)

**Logic**:
- Check for access_token cookie
- Public paths: /login, /register, /auth/callback, /auth/error, /posts (list), /posts/[id]
- Redirect authenticated users away from /login, /register
- Redirect unauthenticated users to /login with returnUrl

**File**: [apps/frontend/src/components/ProtectedRoute.tsx](apps/frontend/src/components/ProtectedRoute.tsx) (NEW)
- Client-side route guard component
- Check roles and permissions
- Redirect if unauthorized

**File**: [apps/frontend/src/components/RoleGuard.tsx](apps/frontend/src/components/RoleGuard.tsx) (NEW)
- Conditional rendering based on roles/permissions
- Used for UI elements (buttons, links)

---

### Phase 10: Frontend Layout Update (Priority 2)

**File**: [apps/frontend/src/app/layout.tsx](apps/frontend/src/app/layout.tsx)

**No changes needed** - QueryProvider already wraps children

**Optional**: Create AuthProvider context if you prefer Context API over React Query for auth state

---

## Critical Files Summary

1. **[apps/backend/prisma/schema.prisma](apps/backend/prisma/schema.prisma)** - Database foundation
2. **[apps/backend/src/auth/auth.service.ts](apps/backend/src/auth/auth.service.ts)** - Core auth logic
3. **[apps/backend/src/auth/token.service.ts](apps/backend/src/auth/token.service.ts)** - JWT management
4. **[apps/backend/src/auth/auth.controller.ts](apps/backend/src/auth/auth.controller.ts)** - API endpoints
5. **[apps/frontend/src/lib/api.ts](apps/frontend/src/lib/api.ts)** - HTTP client with interceptors
6. **[apps/frontend/src/hooks/useAuth.ts](apps/frontend/src/hooks/useAuth.ts)** - Auth hooks
7. **[apps/frontend/src/middleware.ts](apps/frontend/src/middleware.ts)** - Route protection
8. **[docker-compose.yml](docker-compose.yml)** - Redis service

---

## Implementation Order

### Week 1: Backend Foundation
**Day 1-2**: Database & Redis
- Update Prisma schema
- Create migration
- Create seed file
- Add Redis to docker-compose
- Create RedisModule and RedisService
- Test connections

**Day 3-4**: Auth Core
- Install dependencies
- Create TokenService
- Create AuthService
- Create JWT strategies
- Create guards and decorators
- Test with manual HTTP requests

**Day 5**: Auth Endpoints
- Create AuthController
- Implement all endpoints
- Test with Postman

### Week 2: OAuth & Frontend
**Day 6**: OAuth Integration
- Register OAuth apps (get client IDs/secrets)
- Create OAuth strategies
- Test OAuth flows

**Day 7-8**: Frontend Auth Infrastructure
- Update API client with interceptors
- Create auth types
- Create auth hooks
- Test token refresh

**Day 9-10**: Frontend UI
- Create login/register pages
- Create OAuth callback page
- Create protected route components
- Create middleware

---

## Verification Checklist

### Backend
- [ ] User can register with email/password
- [ ] User can login and receive httpOnly cookies
- [ ] JWT is validated on protected endpoints
- [ ] Refresh token rotation works
- [ ] User can logout (cookies cleared, tokens revoked)
- [ ] Google OAuth flow works
- [ ] GitHub OAuth flow works
- [ ] Kakao OAuth flow works
- [ ] Role-based access control works (e.g., only ADMIN can delete any post)
- [ ] Permission-based access control works
- [ ] Unauthorized requests return 401/403

### Frontend
- [ ] User can register via form
- [ ] User can login via form
- [ ] User can login via Google/GitHub/Kakao
- [ ] Protected routes redirect to login
- [ ] Authenticated users redirected away from /login
- [ ] Token refresh happens automatically on 401
- [ ] User can logout
- [ ] Role-based UI rendering works (e.g., admin buttons)
- [ ] OAuth returns to previous page after login

### Integration
- [ ] Create post as authenticated user (authorId set correctly)
- [ ] Update own post succeeds
- [ ] Update other's post fails (unless admin)
- [ ] Delete own post succeeds
- [ ] Delete other's post fails (unless admin)
- [ ] Access /auth/me returns current user with roles
- [ ] Multiple devices can have separate refresh tokens

---

## Security Notes

### Production Checklist
1. Generate strong JWT secrets (256+ bits)
2. Enable `secure: true` for cookies (HTTPS only)
3. Use `sameSite: 'strict'` in production
4. Add rate limiting to auth endpoints (@nestjs/throttler)
5. Add CSRF protection (csurf middleware)
6. Add Helmet for security headers
7. Use strong Redis password
8. Enable Redis AUTH
9. Validate all DTOs with class-validator
10. Add password strength requirements

### Current Security Measures
- HttpOnly cookies (XSS protection)
- CORS with credentials
- Bcrypt password hashing (cost factor 10)
- Refresh token rotation (prevents reuse)
- Token revocation support
- Device tracking for refresh tokens
- Input validation with class-validator

---

## Potential Issues & Solutions

### Issue 1: Cookie Not Sent in CORS
**Solution**: Ensure `withCredentials: true` in Axios config

### Issue 2: Refresh Token Race Condition
**Solution**: Request queue implemented in API client interceptor

### Issue 3: OAuth State Parameter
**Solution**: Base64 encode/decode returnUrl in state parameter

### Issue 4: Suspense vs Regular Query for Auth
**Decision**: Use regular `useQuery` (NOT useSuspenseQuery) for auth state
- Auth needs to be fast and non-blocking
- Cache with staleTime prevents unnecessary refetches
- Only use Suspense for page-level data AFTER authentication

### Issue 5: Infinite Redirect Loop
**Solution**: Exclude /login, /register, /auth/* from middleware protection

### Issue 6: Post.author Migration
**Solution**: Run data migration to populate authorId from existing author names (or set null)
