import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceMemberEntity } from './entities/workspace-member.entity';
import { UserEntity } from '@/modules/users/entities/user.entity';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceMemberEntity, UserEntity])],
  providers: [MembersService],
  controllers: [MembersController],
  exports: [MembersService, TypeOrmModule],
})
export class MembersModule {}
