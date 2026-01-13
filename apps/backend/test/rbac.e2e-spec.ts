import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestHelper } from './test-helper';
import { PrismaService } from '../src/prisma/prisma.service';

describe('RBAC - Roles and Permissions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let userCookies: string[];
  let moderatorCookies: string[];
  let adminCookies: string[];

  let userId: string;
  let moderatorId: string;
  let adminId: string;

  beforeAll(async () => {
    app = await TestHelper.createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await TestHelper.cleanDatabase(app);
    await TestHelper.seedRolesAndPermissions(app);

    // Create USER
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'user@example.com',
      password: 'User123!@#',
      name: 'Regular User',
    });

    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@example.com',
        password: 'User123!@#',
      });

    userCookies = TestHelper.extractCookies(userLogin.headers['set-cookie']);
    userId = userLogin.body.user.id;

    // Create MODERATOR
    const moderatorRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'moderator@example.com',
        password: 'Mod123!@#',
        name: 'Moderator User',
      });

    moderatorId = moderatorRegister.body.id;

    // Assign MODERATOR role
    const moderatorRole = await prisma.role.findUnique({
      where: { name: 'MODERATOR' },
    });

    await prisma.userRole.create({
      data: {
        userId: moderatorId,
        roleId: moderatorRole.id,
      },
    });

    const moderatorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'moderator@example.com',
        password: 'Mod123!@#',
      });

    moderatorCookies = TestHelper.extractCookies(
      moderatorLogin.headers['set-cookie'],
    );

    // Create ADMIN
    const adminRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'Admin123!@#',
        name: 'Admin User',
      });

    adminId = adminRegister.body.id;

    // Assign ADMIN role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'ADMIN' },
    });

    await prisma.userRole.create({
      data: {
        userId: adminId,
        roleId: adminRole.id,
      },
    });

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin123!@#',
      });

    adminCookies = TestHelper.extractCookies(adminLogin.headers['set-cookie']);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Role Assignment', () => {
    it('should assign USER role by default on registration', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Test123!@#',
          name: 'New User',
        })
        .expect(201);

      expect(response.body.roles).toHaveLength(1);
      expect(response.body.roles[0].role.name).toBe('USER');
    });

    it('should return user roles in /auth/me', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', userCookies)
        .expect(200);

      expect(response.body.roles).toBeDefined();
      expect(response.body.roles.length).toBeGreaterThan(0);
      expect(response.body.roles[0].role).toMatchObject({
        name: expect.any(String),
        permissions: expect.any(Array),
      });
    });

    it('should support multiple roles per user', async () => {
      // Add MODERATOR role to existing user
      const moderatorRole = await prisma.role.findUnique({
        where: { name: 'MODERATOR' },
      });

      await prisma.userRole.create({
        data: {
          userId: userId,
          roleId: moderatorRole.id,
        },
      });

      // Login again to get new token with updated roles
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user@example.com',
          password: 'User123!@#',
        });

      const newCookies = TestHelper.extractCookies(
        loginResponse.headers['set-cookie'],
      );

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', newCookies)
        .expect(200);

      expect(response.body.roles.length).toBeGreaterThanOrEqual(2);
      const roleNames = response.body.roles.map((ur: any) => ur.role.name);
      expect(roleNames).toContain('USER');
      expect(roleNames).toContain('MODERATOR');
    });
  });

  describe('Permission-Based Access Control', () => {
    let userPostId: string;
    let moderatorPostId: string;

    beforeEach(async () => {
      // Create post as USER
      const userPost = await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', userCookies)
        .send({
          title: 'User Post',
          content: 'User Content',
        });

      userPostId = userPost.body.id;

      // Create post as MODERATOR
      const moderatorPost = await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', moderatorCookies)
        .send({
          title: 'Moderator Post',
          content: 'Moderator Content',
        });

      moderatorPostId = moderatorPost.body.id;
    });

    it('USER should be able to create posts', async () => {
      await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', userCookies)
        .send({
          title: 'New User Post',
          content: 'New Content',
        })
        .expect(201);
    });

    it('USER should be able to update own posts', async () => {
      await request(app.getHttpServer())
        .patch(`/posts/${userPostId}`)
        .set('Cookie', userCookies)
        .send({
          title: 'Updated User Post',
        })
        .expect(200);
    });

    it('USER should be able to delete own posts', async () => {
      await request(app.getHttpServer())
        .delete(`/posts/${userPostId}`)
        .set('Cookie', userCookies)
        .expect(200);
    });

    it('USER should NOT be able to update other user posts', async () => {
      await request(app.getHttpServer())
        .patch(`/posts/${moderatorPostId}`)
        .set('Cookie', userCookies)
        .send({
          title: 'Hacked Moderator Post',
        })
        .expect(403);
    });

    it('USER should NOT be able to delete other user posts', async () => {
      await request(app.getHttpServer())
        .delete(`/posts/${moderatorPostId}`)
        .set('Cookie', userCookies)
        .expect(403);
    });

    it('MODERATOR should be able to update any post', async () => {
      await request(app.getHttpServer())
        .patch(`/posts/${userPostId}`)
        .set('Cookie', moderatorCookies)
        .send({
          title: 'Moderated User Post',
        })
        .expect(200);
    });

    it('MODERATOR should be able to delete any post', async () => {
      await request(app.getHttpServer())
        .delete(`/posts/${userPostId}`)
        .set('Cookie', moderatorCookies)
        .expect(200);
    });

    it('ADMIN should have all permissions', async () => {
      // Admin can update any post
      await request(app.getHttpServer())
        .patch(`/posts/${userPostId}`)
        .set('Cookie', adminCookies)
        .send({
          title: 'Admin Updated Post',
        })
        .expect(200);

      // Admin can delete any post
      await request(app.getHttpServer())
        .delete(`/posts/${moderatorPostId}`)
        .set('Cookie', adminCookies)
        .expect(200);
    });
  });

  describe('Role Hierarchy', () => {
    it('should verify USER role has basic permissions', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', userCookies)
        .expect(200);

      const permissions = response.body.roles
        .flatMap((ur: any) => ur.role.permissions)
        .map((rp: any) => rp.permission.name);

      expect(permissions).toContain('posts:create');
      expect(permissions).toContain('posts:read');
      expect(permissions).toContain('posts:update');
      expect(permissions).toContain('posts:delete');
      expect(permissions).not.toContain('users:manage');
      expect(permissions).not.toContain('roles:manage');
    });

    it('should verify MODERATOR role has extended permissions', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', moderatorCookies)
        .expect(200);

      const permissions = response.body.roles
        .flatMap((ur: any) => ur.role.permissions)
        .map((rp: any) => rp.permission.name);

      expect(permissions).toContain('posts:create');
      expect(permissions).toContain('posts:read');
      expect(permissions).toContain('posts:update');
      expect(permissions).toContain('posts:delete');
      expect(permissions).toContain('users:manage');
      expect(permissions).not.toContain('roles:manage');
    });

    it('should verify ADMIN role has all permissions', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', adminCookies)
        .expect(200);

      const permissions = response.body.roles
        .flatMap((ur: any) => ur.role.permissions)
        .map((rp: any) => rp.permission.name);

      expect(permissions).toContain('posts:create');
      expect(permissions).toContain('posts:read');
      expect(permissions).toContain('posts:update');
      expect(permissions).toContain('posts:delete');
      expect(permissions).toContain('users:manage');
      expect(permissions).toContain('roles:manage');
    });
  });

  describe('Permission Enforcement', () => {
    it('should enforce permission requirements on protected endpoints', async () => {
      // Create unauthenticated user (no token)
      const response = await request(app.getHttpServer())
        .post('/posts')
        .send({
          title: 'Unauthorized Post',
          content: 'Should fail',
        })
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should check permissions before ownership for delete', async () => {
      // Create post as user
      const userPost = await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', userCookies)
        .send({
          title: 'User Post',
          content: 'User Content',
        });

      const postId = userPost.body.id;

      // Try to delete without auth (should fail at auth level)
      await request(app.getHttpServer()).delete(`/posts/${postId}`).expect(401);

      // Verify post still exists
      await request(app.getHttpServer()).get(`/posts/${postId}`).expect(200);
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with no roles', async () => {
      // Remove all roles from user
      await prisma.userRole.deleteMany({
        where: { userId: userId },
      });

      // Login again to get token without roles
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user@example.com',
          password: 'User123!@#',
        });

      const newCookies = TestHelper.extractCookies(
        loginResponse.headers['set-cookie'],
      );

      // Try to create post (should fail - no permissions)
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', newCookies)
        .send({
          title: 'No Permission Post',
          content: 'Should fail',
        })
        .expect(403);

      expect(response.body.message).toContain('permission');
    });

    it('should handle role with no permissions', async () => {
      // Create new role with no permissions
      const emptyRole = await prisma.role.create({
        data: {
          name: 'EMPTY_ROLE',
          description: 'Role with no permissions',
        },
      });

      // Assign to user
      await prisma.userRole.create({
        data: {
          userId: userId,
          roleId: emptyRole.id,
        },
      });

      // Login again
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user@example.com',
          password: 'User123!@#',
        });

      const newCookies = TestHelper.extractCookies(
        loginResponse.headers['set-cookie'],
      );

      const meResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', newCookies)
        .expect(200);

      // User should still have USER role permissions
      const roleNames = meResponse.body.roles.map((ur: any) => ur.role.name);
      expect(roleNames).toContain('USER');
      expect(roleNames).toContain('EMPTY_ROLE');
    });

    it('should check ownership for update when user has permission', async () => {
      // Create post as user
      const userPost = await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', userCookies)
        .send({
          title: 'User Post',
          content: 'User Content',
        });

      const postId = userPost.body.id;

      // Create another user
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'other@example.com',
        password: 'Other123!@#',
        name: 'Other User',
      });

      const otherLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'other@example.com',
          password: 'Other123!@#',
        });

      const otherCookies = TestHelper.extractCookies(
        otherLogin.headers['set-cookie'],
      );

      // Other user (with USER role) should NOT be able to update
      await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Cookie', otherCookies)
        .send({
          title: 'Hacked Title',
        })
        .expect(403);

      // But MODERATOR should be able to update
      await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Cookie', moderatorCookies)
        .send({
          title: 'Moderated Title',
        })
        .expect(200);
    });
  });
});
