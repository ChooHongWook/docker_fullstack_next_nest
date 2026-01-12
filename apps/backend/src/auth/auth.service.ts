import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { TokenService } from './token.service';
import * as bcrypt from 'bcrypt';
import { User, AuthProvider } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private tokenService: TokenService,
  ) {}

  async register(
    email: string,
    password: string,
    name: string,
  ): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        provider: AuthProvider.LOCAL,
        roles: {
          create: {
            role: {
              connect: { name: 'USER' },
            },
          },
        },
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return user;
  }

  async validateLocalUser(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return user;
  }

  async createRefreshToken(
    userId: string,
    refreshToken: string,
    deviceId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const tokenHash = this.tokenService.hashToken(refreshToken);
    const ttl = this.tokenService.getRefreshTokenExpiration();
    const expiresAt = new Date(Date.now() + ttl * 1000);

    await this.redisService.setRefreshToken(tokenHash, userId, ttl);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        deviceId,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });
  }

  async validateRefreshToken(refreshToken: string): Promise<User> {
    const tokenHash = this.tokenService.hashToken(refreshToken);

    const userId = await this.redisService.validateRefreshToken(tokenHash);
    if (!userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tokenRecord || tokenRecord.isRevoked) {
      throw new UnauthorizedException('Token revoked');
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Token expired');
    }

    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { lastUsedAt: new Date() },
    });

    return tokenRecord.user;
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = this.tokenService.hashToken(refreshToken);

    await this.redisService.revokeRefreshToken(tokenHash);

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.redisService.revokeAllUserTokens(userId);

    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  async findOrCreateOAuthUser(
    email: string,
    provider: AuthProvider,
    providerId: string,
    profile: {
      name: string;
      avatar?: string;
    },
  ): Promise<User> {
    let user = await this.prisma.user.findFirst({
      where: {
        email,
        provider,
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: profile.name,
          avatar: profile.avatar,
          provider,
          providerId,
          emailVerified: true,
          roles: {
            create: {
              role: {
                connect: { name: 'USER' },
              },
            },
          },
        },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    return user;
  }
}
