import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationEntity } from './entities/invitation.entity';
import { WorkspaceMemberEntity } from '@/modules/members/entities/workspace-member.entity';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { UsersModule } from '@/modules/users/users.module';
import { MembersModule } from '@/modules/members/members.module';
import { WorkspacesModule } from '@/modules/workspaces/workspaces.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InvitationEntity, WorkspaceMemberEntity]),
    UsersModule, MembersModule, WorkspacesModule,
  ],
  providers: [InvitationsService],
  controllers: [InvitationsController],
  exports: [InvitationsService],
})
export class InvitationsModule {}
