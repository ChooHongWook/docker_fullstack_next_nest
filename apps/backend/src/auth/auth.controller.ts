import {
  Controller,
  Post,
  Body,
  UseGuards,
  Res,
  Req,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { KakaoAuthGuard } from './guards/kakao-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.name,
    );
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const roles = (user as any).roles.map((ur: any) => ur.role.name);
    const payload = { sub: user.id, email: user.email, roles };

    const { accessToken, refreshToken } =
      this.tokenService.generateTokenPair(payload);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await this.authService.createRefreshToken(
      user.id,
      refreshToken,
      req.headers['x-device-id'] as string,
      req.ip,
      req.headers['user-agent'],
    );

    const { password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      message: 'Login successful',
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const oldRefreshToken = req.cookies?.refresh_token;
    if (!oldRefreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const user = await this.authService.validateRefreshToken(oldRefreshToken);

    await this.authService.revokeRefreshToken(oldRefreshToken);

    const roles = (user as any).roles.map((ur: any) => ur.role.name);
    const payload = { sub: user.id, email: user.email, roles };

    const { accessToken, refreshToken } =
      this.tokenService.generateTokenPair(payload);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await this.authService.createRefreshToken(
      user.id,
      refreshToken,
      req.headers['x-device-id'] as string,
      req.ip,
      req.headers['user-agent'],
    );

    return { message: 'Token refreshed' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return { message: 'Logout successful' };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@CurrentUser() user: User) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // OAuth Routes
  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.handleOAuthCallback(user, req, res);
  }

  @Public()
  @Get('github')
  @UseGuards(GithubAuthGuard)
  async githubAuth() {
    // Initiates GitHub OAuth flow
  }

  @Public()
  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubAuthCallback(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.handleOAuthCallback(user, req, res);
  }

  @Public()
  @Get('kakao')
  @UseGuards(KakaoAuthGuard)
  async kakaoAuth() {
    // Initiates Kakao OAuth flow
  }

  @Public()
  @Get('kakao/callback')
  @UseGuards(KakaoAuthGuard)
  async kakaoAuthCallback(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.handleOAuthCallback(user, req, res);
  }

  // Common OAuth callback handler
  private async handleOAuthCallback(
    user: User,
    req: Request,
    res: Response,
  ) {
    const roles = (user as any).roles.map((ur: any) => ur.role.name);
    const payload = { sub: user.id, email: user.email, roles };

    const { accessToken, refreshToken } =
      this.tokenService.generateTokenPair(payload);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    await this.authService.createRefreshToken(
      user.id,
      refreshToken,
      req.headers['x-device-id'] as string,
      req.ip,
      req.headers['user-agent'],
    );

    // Redirect to frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/?oauth=success`);
  }
}
