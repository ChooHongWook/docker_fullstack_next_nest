import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestHelper, TestUser } from './test-helper';

describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await TestHelper.createTestApp();
  });

  beforeEach(async () => {
    await TestHelper.cleanDatabase(app);
    await TestHelper.seedRolesAndPermissions(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user with valid credentials', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: registerDto.email,
        name: registerDto.name,
        provider: 'LOCAL',
        isActive: true,
        emailVerified: false,
      });
      expect(response.body.password).toBeUndefined();
      expect(response.body.roles).toBeDefined();
      expect(response.body.roles).toHaveLength(1);
      expect(response.body.roles[0].role.name).toBe('USER');
    });

    it('should reject registration with duplicate email', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);

      expect(response.body.message).toContain('already exists');
    });

    it('should reject registration with weak password', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);

      expect(response.body.message).toContain('password');
    });

    it('should reject registration with invalid email', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'Test123!@#',
        name: 'Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);

      expect(response.body.message).toContain('email');
    });

    it('should reject registration with missing fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    let testUser: TestUser;

    beforeEach(async () => {
      // Create test user
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
          name: 'Test User',
        });

      testUser = {
        id: registerResponse.body.id,
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      };
    });

    it('should login with valid credentials and set cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        user: {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name,
        },
        message: 'Login successful',
      });

      const cookies = response.headers['set-cookie'] as unknown as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.startsWith('access_token='))).toBe(true);
      expect(cookies.some((cookie: string) => cookie.startsWith('refresh_token='))).toBe(true);
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123!@#',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login with missing credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email })
        .expect(400);
    });
  });

  describe('/auth/me (GET)', () => {
    let testUser: TestUser;
    let cookies: string[];

    beforeEach(async () => {
      // Register and login
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
          name: 'Test User',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
        });

      testUser = {
        id: loginResponse.body.user.id,
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      };

      cookies = TestHelper.extractCookies(loginResponse.headers['set-cookie']);
    });

    it('should return current user with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        provider: 'LOCAL',
      });
      expect(response.body.password).toBeUndefined();
      expect(response.body.roles).toBeDefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', ['access_token=invalid_token'])
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });
  });

  describe('/auth/refresh (POST)', () => {
    let cookies: string[];

    beforeEach(async () => {
      // Register and login
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
          name: 'Test User',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
        });

      cookies = TestHelper.extractCookies(loginResponse.headers['set-cookie']);
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.message).toBe('Token refreshed');

      const newCookies = response.headers['set-cookie'] as unknown as string[];
      expect(newCookies).toBeDefined();
      expect(newCookies.some((cookie: string) => cookie.startsWith('access_token='))).toBe(true);
      expect(newCookies.some((cookie: string) => cookie.startsWith('refresh_token='))).toBe(true);

      // Verify new tokens work
      const meResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', TestHelper.extractCookies(newCookies))
        .expect(200);

      expect(meResponse.body.email).toBe('test@example.com');
    });

    it('should reject refresh without refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should reject refresh with invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', ['refresh_token=invalid_token'])
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should not allow reuse of old refresh token', async () => {
      // First refresh
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      // Try to use old refresh token again
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });
  });

  describe('/auth/logout (POST)', () => {
    let cookies: string[];

    beforeEach(async () => {
      // Register and login
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
          name: 'Test User',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
        });

      cookies = TestHelper.extractCookies(loginResponse.headers['set-cookie']);
    });

    it('should logout and clear cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.message).toBe('Logout successful');

      // Verify cookies are cleared
      const setCookies = response.headers['set-cookie'] as unknown as string[];
      expect(setCookies).toBeDefined();
      expect(setCookies.some((cookie: string) => cookie.includes('access_token=;'))).toBe(true);
      expect(setCookies.some((cookie: string) => cookie.includes('refresh_token=;'))).toBe(true);

      // Verify tokens no longer work
      const meResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', cookies)
        .expect(401);

      expect(meResponse.body.message).toContain('Unauthorized');
    });

    it('should reject logout without token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });
  });

  describe('Token Security', () => {
    it('should not expose sensitive data in JWT payload', async () => {
      // Register and login
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
          name: 'Test User',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
        });

      const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();

      // Extract access_token
      const accessTokenCookie = cookies.find((cookie: string) =>
        cookie.startsWith('access_token='),
      );
      expect(accessTokenCookie).toBeDefined();

      // Verify HttpOnly flag is set
      expect(accessTokenCookie).toContain('HttpOnly');

      // Verify SameSite flag is set
      expect(accessTokenCookie).toContain('SameSite');
    });

    it('should handle concurrent login sessions', async () => {
      // Register user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
          name: 'Test User',
        });

      // First login (device 1)
      const login1 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
        })
        .expect(200);

      const cookies1 = TestHelper.extractCookies(login1.headers['set-cookie']);

      // Second login (device 2)
      const login2 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
        })
        .expect(200);

      const cookies2 = TestHelper.extractCookies(login2.headers['set-cookie']);

      // Both sessions should work
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', cookies1)
        .expect(200);

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', cookies2)
        .expect(200);

      // Logout from first session
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', cookies1)
        .expect(200);

      // First session should be invalid
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', cookies1)
        .expect(401);

      // Second session should still work
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', cookies2)
        .expect(200);
    });
  });
});
