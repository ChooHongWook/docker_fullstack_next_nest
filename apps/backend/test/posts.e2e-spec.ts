import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestHelper, TestUser } from './test-helper';

describe('Posts CRUD (e2e)', () => {
  let app: INestApplication;
  let userCookies: string[];
  let userId: string;

  beforeAll(async () => {
    app = await TestHelper.createTestApp();
  });

  beforeEach(async () => {
    await TestHelper.cleanDatabase(app);
    await TestHelper.seedRolesAndPermissions(app);

    // Create and login test user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user@example.com',
        password: 'User123!@#',
        name: 'Test User',
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@example.com',
        password: 'User123!@#',
      });

    userCookies = TestHelper.extractCookies(loginResponse.headers['set-cookie']);
    userId = loginResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /posts', () => {
    it('should return empty array when no posts exist (public)', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all posts without authentication (public)', async () => {
      // Create posts
      await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', userCookies)
        .send({
          title: 'Post 1',
          content: 'Content 1',
        });

      await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', userCookies)
        .send({
          title: 'Post 2',
          content: 'Content 2',
        });

      // Get posts without auth
      const response = await request(app.getHttpServer())
        .get('/posts')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        title: 'Post 1',
        content: 'Content 1',
      });
    });

    it('should include author information in posts', async () => {
      await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', userCookies)
        .send({
          title: 'Post 1',
          content: 'Content 1',
        });

      const response = await request(app.getHttpServer())
        .get('/posts')
        .expect(200);

      expect(response.body[0].author).toBeDefined();
      expect(response.body[0].author.email).toBe('user@example.com');
      expect(response.body[0].author.name).toBe('Test User');
      expect(response.body[0].author.password).toBeUndefined();
    });
  });

  describe('GET /posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', userCookies)
        .send({
          title: 'Test Post',
          content: 'Test Content',
        });

      postId = createResponse.body.id;
    });

    it('should return single post without authentication (public)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: postId,
        title: 'Test Post',
        content: 'Test Content',
      });
      expect(response.body.author).toBeDefined();
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app.getHttpServer())
        .get(`/posts/${fakeId}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('POST /posts', () => {
    it('should create post with authentication', async () => {
      const createDto = {
        title: 'New Post',
        content: 'New Content',
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', userCookies)
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: createDto.title,
        content: createDto.content,
        authorId: userId,
      });
      expect(response.body.author).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should reject post creation without authentication', async () => {
      const createDto = {
        title: 'New Post',
        content: 'New Content',
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .send(createDto)
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should reject post with missing title', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', userCookies)
        .send({
          content: 'New Content',
        })
        .expect(400);

      expect(response.body.message).toContain('title');
    });

    it('should reject post with missing content', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', userCookies)
        .send({
          title: 'New Post',
        })
        .expect(400);

      expect(response.body.message).toContain('content');
    });

    it('should reject post with title too long', async () => {
      const longTitle = 'a'.repeat(300);
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', userCookies)
        .send({
          title: longTitle,
          content: 'Content',
        })
        .expect(400);

      expect(response.body.message).toContain('title');
    });
  });

  describe('PATCH /posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', userCookies)
        .send({
          title: 'Original Title',
          content: 'Original Content',
        });

      postId = createResponse.body.id;
    });

    it('should update own post', async () => {
      const updateDto = {
        title: 'Updated Title',
        content: 'Updated Content',
      };

      const response = await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Cookie', userCookies)
        .send(updateDto)
        .expect(200);

      expect(response.body).toMatchObject({
        id: postId,
        title: updateDto.title,
        content: updateDto.content,
      });
      expect(response.body.updatedAt).not.toBe(response.body.createdAt);
    });

    it('should update post with partial data', async () => {
      const updateDto = {
        title: 'Only Title Updated',
      };

      const response = await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Cookie', userCookies)
        .send(updateDto)
        .expect(200);

      expect(response.body.title).toBe(updateDto.title);
      expect(response.body.content).toBe('Original Content');
    });

    it('should reject update without authentication', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .send({
          title: 'Updated Title',
        })
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should reject update of non-existent post', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app.getHttpServer())
        .patch(`/posts/${fakeId}`)
        .set('Cookie', userCookies)
        .send({
          title: 'Updated Title',
        })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it("should reject update of other user's post", async () => {
      // Create another user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other@example.com',
          password: 'Other123!@#',
          name: 'Other User',
        });

      const otherLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'other@example.com',
          password: 'Other123!@#',
        });

      const otherCookies = TestHelper.extractCookies(
        otherLoginResponse.headers['set-cookie'],
      );

      // Try to update first user's post
      const response = await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Cookie', otherCookies)
        .send({
          title: 'Hacked Title',
        })
        .expect(403);

      expect(response.body.message).toContain('permission');
    });
  });

  describe('DELETE /posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', userCookies)
        .send({
          title: 'Post to Delete',
          content: 'Content to Delete',
        });

      postId = createResponse.body.id;
    });

    it('should delete own post', async () => {
      await request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Cookie', userCookies)
        .expect(200);

      // Verify post is deleted
      await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(404);
    });

    it('should reject delete without authentication', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should reject delete of non-existent post', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app.getHttpServer())
        .delete(`/posts/${fakeId}`)
        .set('Cookie', userCookies)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it("should reject delete of other user's post", async () => {
      // Create another user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other@example.com',
          password: 'Other123!@#',
          name: 'Other User',
        });

      const otherLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'other@example.com',
          password: 'Other123!@#',
        });

      const otherCookies = TestHelper.extractCookies(
        otherLoginResponse.headers['set-cookie'],
      );

      // Try to delete first user's post
      const response = await request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Cookie', otherCookies)
        .expect(403);

      expect(response.body.message).toContain('permission');

      // Verify post still exists
      await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);
    });
  });

  describe('Post Ownership and Authorization', () => {
    let user1Cookies: string[];
    let user2Cookies: string[];
    let user1PostId: string;

    beforeEach(async () => {
      // Create two users
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'user1@example.com',
          password: 'User1123!@#',
          name: 'User 1',
        });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'user2@example.com',
          password: 'User2123!@#',
          name: 'User 2',
        });

      // Login both users
      const login1 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user1@example.com',
          password: 'User1123!@#',
        });

      const login2 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user2@example.com',
          password: 'User2123!@#',
        });

      user1Cookies = TestHelper.extractCookies(login1.headers['set-cookie']);
      user2Cookies = TestHelper.extractCookies(login2.headers['set-cookie']);

      // Create post as user1
      const createResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Cookie', user1Cookies)
        .send({
          title: 'User 1 Post',
          content: 'User 1 Content',
        });

      user1PostId = createResponse.body.id;
    });

    it('should allow reading any post', async () => {
      // User 2 can read User 1's post
      const response = await request(app.getHttpServer())
        .get(`/posts/${user1PostId}`)
        .set('Cookie', user2Cookies)
        .expect(200);

      expect(response.body.title).toBe('User 1 Post');
    });

    it('should not allow updating another user\'s post', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/posts/${user1PostId}`)
        .set('Cookie', user2Cookies)
        .send({
          title: 'Hacked by User 2',
        })
        .expect(403);

      expect(response.body.message).toContain('permission');
    });

    it('should not allow deleting another user\'s post', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/posts/${user1PostId}`)
        .set('Cookie', user2Cookies)
        .expect(403);

      expect(response.body.message).toContain('permission');
    });
  });
});
