import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@/modules/users/entities/user.entity';
import { WorkspaceEntity } from '@/modules/workspaces/entities/workspace.entity';
import { AdminController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, WorkspaceEntity])],
  controllers: [AdminController],
})
export class AdminModule {}
