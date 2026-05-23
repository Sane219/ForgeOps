import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/request';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private setCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    const domain = this.config.get<string>('jwt.cookieDomain', 'localhost');
    const secure = this.config.get<boolean>('jwt.cookieSecure', false);
    const accessTtl = this.config.get<string>('jwt.accessTtl', '15m');
    const refreshTtl = this.config.get<string>('jwt.refreshTtl', '30d');

    res.cookie('forgeops_access_token', tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      domain,
      maxAge: parseDuration(accessTtl),
      path: '/',
    });
    res.cookie('forgeops_refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      domain,
      maxAge: parseDuration(refreshTtl),
      path: '/api/auth/refresh',
    });
  }

  private clearCookies(res: Response) {
    const domain = this.config.get<string>('jwt.cookieDomain', 'localhost');
    res.clearCookie('forgeops_access_token', { domain, path: '/' });
    res.clearCookie('forgeops_refresh_token', { domain, path: '/api/auth/refresh' });
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user with a workspace' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.authService.register(dto);
    this.setCookies(res, tokens);
    return user;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.authService.login(dto);
    this.setCookies(res, tokens);
    return user;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh cookie' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['forgeops_refresh_token'] as string | undefined;
    if (!refreshToken) throw new UnauthorizedException('No refresh token');
    const { user, tokens } = await this.authService.refresh(refreshToken);
    this.setCookies(res, tokens);
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout — clears auth cookies' })
  @ApiCookieAuth()
  async logout(@CurrentUser() user: AuthenticatedUser, @Res({ passthrough: true }) res: Response) {
    this.clearCookies(res);
    return { message: 'Logged out' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile with workspace memberships' })
  @ApiCookieAuth()
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.id);
  }
}

function parseDuration(ttl: string): number {
  const match = ttl.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 900000; // 15m default
  const n = parseInt(match[1]!, 10);
  const unit = match[2]!;
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * (multipliers[unit] ?? 60000);
}
