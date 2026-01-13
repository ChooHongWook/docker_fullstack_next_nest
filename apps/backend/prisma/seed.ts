import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

// Get DATABASE_URL from environment or use default
const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/posts_db?schema=public';

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Create Roles
  console.log('Creating roles...');
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
      description: 'Moderator with extended permissions',
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

  console.log('✅ Roles created');

  // Create Permissions
  console.log('Creating permissions...');
  const permissions = [
    {
      name: 'posts:create',
      description: 'Create new posts',
      resource: 'posts',
      action: 'create',
    },
    {
      name: 'posts:read',
      description: 'Read posts',
      resource: 'posts',
      action: 'read',
    },
    {
      name: 'posts:update',
      description: 'Update posts',
      resource: 'posts',
      action: 'update',
    },
    {
      name: 'posts:delete',
      description: 'Delete posts',
      resource: 'posts',
      action: 'delete',
    },
    {
      name: 'users:manage',
      description: 'Manage users',
      resource: 'users',
      action: 'manage',
    },
    {
      name: 'roles:manage',
      description: 'Manage roles and permissions',
      resource: 'roles',
      action: 'manage',
    },
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    createdPermissions.push(permission);
  }

  console.log('✅ Permissions created');

  // Assign Permissions to Roles
  console.log('Assigning permissions to roles...');

  // USER: can create, read, update own posts
  const userPermissions = createdPermissions.filter((p) =>
    ['posts:create', 'posts:read', 'posts:update'].includes(p.name),
  );

  for (const permission of userPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId: permission.id,
      },
    });
  }

  // MODERATOR: all post permissions + users:manage
  const moderatorPermissions = createdPermissions.filter((p) =>
    [
      'posts:create',
      'posts:read',
      'posts:update',
      'posts:delete',
      'users:manage',
    ].includes(p.name),
  );

  for (const permission of moderatorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: moderatorRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: moderatorRole.id,
        permissionId: permission.id,
      },
    });
  }

  // ADMIN: all permissions
  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ Permissions assigned to roles');

  // Create test admin user
  console.log('Creating test admin user...');
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      provider: 'LOCAL',
      emailVerified: true,
      isActive: true,
    },
  });

  // Assign ADMIN role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log('✅ Test admin user created (admin@example.com / Admin123!)');

  // Create test regular user
  console.log('Creating test regular user...');
  const userPassword = await bcrypt.hash('User123!', 10);

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      name: 'Regular User',
      provider: 'LOCAL',
      emailVerified: true,
      isActive: true,
    },
  });

  // Assign USER role to regular user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: regularUser.id,
        roleId: userRole.id,
      },
    },
    update: {},
    create: {
      userId: regularUser.id,
      roleId: userRole.id,
    },
  });

  console.log('✅ Test regular user created (user@example.com / User123!)');

  // Create k6 load test users
  console.log('Creating k6 load test users...');

  const k6Users = [
    {
      email: 'loadtest@example.com',
      password: 'TestPassword123!',
      name: 'Load Test User',
    },
    {
      email: 'user1@test.com',
      password: 'Password123!',
      name: 'Test User 1',
    },
    {
      email: 'user2@test.com',
      password: 'Password123!',
      name: 'Test User 2',
    },
    {
      email: 'user3@test.com',
      password: 'Password123!',
      name: 'Test User 3',
    },
  ];

  for (const userData of k6Users) {
    const hashedPwd = await bcrypt.hash(userData.password, 10);

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        password: hashedPwd,
        name: userData.name,
        provider: 'LOCAL',
        emailVerified: true,
        isActive: true,
      },
    });

    // Assign USER role
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: userRole.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: userRole.id,
      },
    });

    console.log(`  ✅ ${user.email}`);
  }

  console.log('✅ k6 load test users created');

  // Create sample posts for load testing
  console.log('Creating sample posts for k6...');

  const loadTestUser = await prisma.user.findUnique({
    where: { email: 'loadtest@example.com' },
  });

  if (loadTestUser) {
    const samplePosts = Array.from({ length: 100 }, (_, i) => ({
      title: `Sample Post ${i + 1}`,
      content: `This is sample post content for post number ${i + 1}. Created for k6 load testing purposes. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      authorId: loadTestUser.id,
    }));

    await prisma.post.createMany({
      data: samplePosts,
      skipDuplicates: true,
    });

    console.log('✅ Created 100 sample posts for k6');
  }

  console.log('🎉 Seed completed successfully!');
  console.log('\nTest Accounts:');
  console.log('  Admin: admin@example.com / Admin123!');
  console.log('  User:  user@example.com / User123!');
  console.log('\nk6 Load Test Accounts:');
  console.log('  loadtest@example.com / TestPassword123!');
  console.log('  user1@test.com / Password123!');
  console.log('  user2@test.com / Password123!');
  console.log('  user3@test.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
