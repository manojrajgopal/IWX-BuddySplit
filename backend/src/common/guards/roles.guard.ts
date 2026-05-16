import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'required_roles';
export const Roles = (...roles: Array<'admin' | 'user'>): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Array<'admin'|'user'>>(
      ROLES_KEY, [ctx.getHandler(), ctx.getClass()],
    );
    if (!required || required.length === 0) return true;
    const req = ctx.switchToHttp().getRequest<{ user?: { role?: 'admin'|'user' } }>();
    const role = req.user?.role ?? 'user';
    if (!required.includes(role)) throw new ForbiddenException('Insufficient role');
    return true;
  }
}
