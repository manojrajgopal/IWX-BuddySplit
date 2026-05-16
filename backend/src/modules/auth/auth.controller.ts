import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import {
  ForgotPasswordSchema, LoginSchema, RefreshSchema, RegisterRequestSchema,
  RegisterVerifySchema, ResetPasswordSchema,
  type ForgotPasswordDto, type LoginDto, type RefreshDto, type RegisterRequestDto,
  type RegisterVerifyDto, type ResetPasswordDto,
} from './dto/auth.dto';
import { Public, JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '@/common/decorators/current-user.decorator';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register/request')
  registerRequest(
    @Body(new ZodValidationPipe(RegisterRequestSchema)) dto: RegisterRequestDto,
  ) { return this.auth.registerRequest(dto); }

  @Public()
  @Post('register/verify')
  registerVerify(
    @Body(new ZodValidationPipe(RegisterVerifySchema)) dto: RegisterVerifyDto,
  ) { return this.auth.registerVerify(dto); }

  @Public()
  @HttpCode(200)
  @Post('login')
  login(
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto,
    @Req() req: Request,
  ) {
    return this.auth.login(dto, req.headers['user-agent'], req.ip);
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  refresh(
    @Body(new ZodValidationPipe(RefreshSchema)) dto: RefreshDto,
    @Req() req: Request,
  ) {
    return this.auth.refresh(dto, req.headers['user-agent'], req.ip);
  }

  @Public()
  @HttpCode(204)
  @Post('logout')
  async logout(@Body(new ZodValidationPipe(RefreshSchema)) dto: RefreshDto): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  forgot(@Body(new ZodValidationPipe(ForgotPasswordSchema)) dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @HttpCode(204)
  @Post('reset-password')
  async reset(@Body(new ZodValidationPipe(ResetPasswordSchema)) dto: ResetPasswordDto): Promise<void> {
    await this.auth.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me')
  me(@CurrentUser() user: AuthUser): AuthUser { return user; }
}
