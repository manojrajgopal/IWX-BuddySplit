import {
  BadRequestException, Body, Controller, Get,
  HttpCode, Patch, Post, UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '@/common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { UsersService } from './users.service';
import { CryptoService } from '@/core/crypto/crypto.service';

const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  phone: z.string().max(30).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmNewPassword: z.string().min(8),
});

type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

@UseGuards(JwtAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly crypto: CryptoService,
  ) {}

  @Get('me')
  async getProfile(@CurrentUser() user: AuthUser) {
    const u = await this.users.require(user.id);
    return {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      role: u.role,
      emailVerifiedAt: u.emailVerifiedAt,
      createdAt: u.createdAt,
    };
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) dto: UpdateProfileDto,
  ) {
    const u = await this.users.require(user.id);
    if (dto.displayName !== undefined) u.displayName = dto.displayName;
    if (dto.phone !== undefined) u.phone = dto.phone ?? null;
    if (dto.avatarUrl !== undefined) u.avatarUrl = dto.avatarUrl ?? null;
    await this.users.save(u);
    return { id: u.id, email: u.email, displayName: u.displayName, phone: u.phone, avatarUrl: u.avatarUrl };
  }

  @Post('me/change-password')
  @HttpCode(204)
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(ChangePasswordSchema)) dto: ChangePasswordDto,
  ): Promise<void> {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    const u = await this.users.require(user.id);
    const valid = u.passwordHash
      ? await this.crypto.verifyPassword(u.passwordHash, dto.currentPassword)
      : false;
    if (!valid) throw new BadRequestException('Current password is incorrect');
    const hash = await this.crypto.hashPassword(dto.newPassword);
    await this.users.updatePasswordHash(user.id, hash);
  }
}
