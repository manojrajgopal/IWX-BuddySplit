import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
  ) {}

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.users.findOne({ where: { email } });
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.users.findOne({ where: { id } });
  }

  async createVerified(input: {
    email: string; displayName: string; passwordHash: string; phone?: string | null;
  }): Promise<UserEntity> {
    const existing = await this.findByEmail(input.email);
    if (existing) throw new ConflictException('Email already registered');
    const u = this.users.create({
      email: input.email,
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      phone: input.phone ?? null,
      emailVerifiedAt: new Date(),
      role: 'user',
      status: 'active',
    });
    return this.users.save(u);
  }

  /**
   * Find an existing user by email or create a new one for an OAuth (passwordless)
   * sign-in. Used by Google sign-in / sign-up. Email is considered verified because
   * the OAuth provider has already verified it.
   */
  async findOrCreateOAuth(input: {
    email: string; displayName: string; avatarUrl?: string | null;
  }): Promise<UserEntity> {
    const existing = await this.findByEmail(input.email);
    if (existing) {
      // Backfill profile data on first OAuth sign-in for an existing account.
      let changed = false;
      if (!existing.emailVerifiedAt) { existing.emailVerifiedAt = new Date(); changed = true; }
      if (!existing.avatarUrl && input.avatarUrl) { existing.avatarUrl = input.avatarUrl; changed = true; }
      if (!existing.displayName && input.displayName) { existing.displayName = input.displayName; changed = true; }
      if (changed) await this.users.save(existing);
      return existing;
    }
    const u = this.users.create({
      email: input.email,
      displayName: input.displayName || input.email.split('@')[0],
      passwordHash: null,
      phone: null,
      avatarUrl: input.avatarUrl ?? null,
      emailVerifiedAt: new Date(),
      role: 'user',
      status: 'active',
    });
    return this.users.save(u);
  }

  async setLastLogin(id: string): Promise<void> {
    await this.users.update({ id }, { lastLoginAt: new Date() });
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.users.update({ id }, { passwordHash });
  }

  async require(id: string): Promise<UserEntity> {
    const u = await this.findById(id);
    if (!u) throw new NotFoundException('User not found');
    return u;
  }

  save(entity: UserEntity): Promise<UserEntity> {
    return this.users.save(entity);
  }
}
