import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
  accessToken?: string;
  refreshToken?: string;
  cookies?: string[];
}

export class TestHelper {
  static async createTestApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();

    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    });

    await app.init();
    return app;
  }

  static async cleanDatabase(app: INestApplication): Promise<void> {
    const prisma = app.get(PrismaService);
    const redis = app.get(RedisService);

    // Clean Redis
    await redis.flushdb();

    // Clean database tables in correct order (respecting foreign key constraints)
    await prisma.$transaction([
      prisma.refreshToken.deleteMany(),
      prisma.post.deleteMany(),
      prisma.userRole.deleteMany(),
      prisma.rolePermission.deleteMany(),
      prisma.permission.deleteMany(),
      prisma.role.deleteMany(),
      prisma.user.deleteMany(),
    ]);
  }

  static async seedRolesAndPermissions(app: INestApplication): Promise<void> {
    const prisma = app.get(PrismaService);

    // Create permissions
    const permissions = await Promise.all([
      prisma.permission.upsert({
        where: { name: 'posts:create' },
        update: {},
        create: {
          name: 'posts:create',
          description: 'Create posts',
          resource: 'posts',
          action: 'create',
        },
      }),
      prisma.permission.upsert({
        where: { name: 'posts:read' },
        update: {},
        create: {
          name: 'posts:read',
          description: 'Read posts',
          resource: 'posts',
          action: 'read',
        },
      }),
      prisma.permission.upsert({
        where: { name: 'posts:update' },
        update: {},
        create: {
          name: 'posts:update',
          description: 'Update posts',
          resource: 'posts',
          action: 'update',
        },
      }),
      prisma.permission.upsert({
        where: { name: 'posts:delete' },
        update: {},
        create: {
          name: 'posts:delete',
          description: 'Delete posts',
          resource: 'posts',
          action: 'delete',
        },
      }),
      prisma.permission.upsert({
        where: { name: 'users:manage' },
        update: {},
        create: {
          name: 'users:manage',
          description: 'Manage users',
          resource: 'users',
          action: 'manage',
        },
      }),
      prisma.permission.upsert({
        where: { name: 'roles:manage' },
        update: {},
        create: {
          name: 'roles:manage',
          description: 'Manage roles',
          resource: 'roles',
          action: 'manage',
        },
      }),
    ]);

    // Create roles
    const userRole = await prisma.role.upsert({
      where: { name: 'USER' },
      update: {},
      create: {
        name: 'USER',
        description: 'Regular user with basic permissions',
      },
    });

    const moderatorRole = await prisma.role.upsert({
      where: { name: 'MODERATOR' },
      update: {},
      create: {
        name: 'MODERATOR',
        description: 'Moderator with content management permissions',
      },
    });

    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        description: 'Administrator with full permissions',
      },
    });

    // Assign permissions to roles
    // USER: posts:create, posts:read, posts:update (own), posts:delete (own)
    await prisma.rolePermission.createMany({
      data: [
        { roleId: userRole.id, permissionId: permissions[0].id },
        { roleId: userRole.id, permissionId: permissions[1].id },
        { roleId: userRole.id, permissionId: permissions[2].id },
        { roleId: userRole.id, permissionId: permissions[3].id },
      ],
      skipDuplicates: true,
    });

    // MODERATOR: all posts permissions + users:manage
    await prisma.rolePermission.createMany({
      data: [
        { roleId: moderatorRole.id, permissionId: permissions[0].id },
        { roleId: moderatorRole.id, permissionId: permissions[1].id },
        { roleId: moderatorRole.id, permissionId: permissions[2].id },
        { roleId: moderatorRole.id, permissionId: permissions[3].id },
        { roleId: moderatorRole.id, permissionId: permissions[4].id },
      ],
      skipDuplicates: true,
    });

    // ADMIN: all permissions
    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: adminRole.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });
  }

  static extractCookies(setCookieHeaders: string | string[]): string[] {
    const headers = Array.isArray(setCookieHeaders)
      ? setCookieHeaders
      : [setCookieHeaders];
    return headers.map((cookie) => cookie.split(';')[0]);
  }

  static parseCookies(cookies: string[]): Record<string, string> {
    const parsed: Record<string, string> = {};
    cookies.forEach((cookie) => {
      const [key, value] = cookie.split('=');
      parsed[key] = value;
    });
    return parsed;
  }
}
