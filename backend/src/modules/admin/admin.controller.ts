import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '@/common/guards/roles.guard';
import { UserEntity } from '@/modules/users/entities/user.entity';
import { WorkspaceEntity } from '@/modules/workspaces/entities/workspace.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(WorkspaceEntity) private readonly workspaces: Repository<WorkspaceEntity>,
  ) {}

  @Get('stats')
  async stats() {
    const [users, workspaces] = await Promise.all([this.users.count(), this.workspaces.count()]);
    return { users, workspaces };
  }

  @Get('users')
  listUsers() {
    return this.users.find({ order: { createdAt: 'DESC' }, take: 200 });
  }

  @Get('workspaces')
  listWorkspaces() {
    return this.workspaces.find({ order: { createdAt: 'DESC' }, take: 200 });
  }
}
