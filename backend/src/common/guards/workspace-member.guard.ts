import {
  CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceMemberEntity } from '@/modules/members/entities/workspace-member.entity';

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(
    @InjectRepository(WorkspaceMemberEntity)
    private readonly members: Repository<WorkspaceMemberEntity>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<{
      params: Record<string, string>;
      user?: { id: string };
      workspaceMember?: WorkspaceMemberEntity;
    }>();
    const wsId = req.params.workspaceId ?? req.params.id;
    if (!wsId) throw new NotFoundException('Workspace id required');
    if (!req.user) throw new ForbiddenException();

    const m = await this.members.findOne({
      where: { workspaceId: wsId, userId: req.user.id, leftAt: undefined as unknown as Date },
    });
    if (!m) throw new ForbiddenException('Not a workspace member');
    req.workspaceMember = m;
    return true;
  }
}
