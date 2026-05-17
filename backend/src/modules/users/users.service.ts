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
