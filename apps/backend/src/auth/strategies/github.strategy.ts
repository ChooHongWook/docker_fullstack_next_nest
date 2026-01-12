import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get('GITHUB_CLIENT_ID'),
      clientSecret: configService.get('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<any> {
    const { id, emails, displayName, photos } = profile;

    const email = emails?.[0]?.value || `${id}@github.placeholder.com`;
    const user = await this.authService.findOrCreateOAuthUser(
      email,
      'GITHUB',
      id,
      {
        name: displayName || profile.username || 'GitHub User',
        avatar: photos?.[0]?.value || null,
      },
    );

    return user;
  }
}
