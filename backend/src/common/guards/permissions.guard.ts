import {
  CanActivate, ExecutionContext, ForbiddenException, Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '@/common/decorators/permissions.decorator';
import { RolesService } from '@/modules/roles/roles.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly roles: RolesService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(
      PERMISSIONS_KEY, [ctx.getHandler(), ctx.getClass()],
    );
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<{ user?: { role?: string } }>();
    const roleName = req.user?.role ?? '';
    if (roleName === 'admin') return true;

    for (const token of required) {
      const [resource, action] = token.split(':');
      if (!resource || !action) {
        throw new ForbiddenException(`Invalid permission token: ${token}`);
      }
      const ok = await this.roles.hasPermission(roleName, resource, action);
      if (!ok) throw new ForbiddenException(`Missing permission: ${token}`);
    }
    return true;
  }
}
