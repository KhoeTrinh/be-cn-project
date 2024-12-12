import { Controller, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly googleAuthService: AuthService) {}

  @Get('callback')
  async handleGoogleCallback(@Query('code') authCode: string) {
    if (!authCode) {
      throw new Error('Authorization code is missing');
    }
    return authCode;
    //   const tokens = await this.googleAuthService.exchangeCodeForTokens(authCode);
    //   return {
    //     message: 'Tokens retrieved successfully',
    //     tokens,
    //   };
  }
}
