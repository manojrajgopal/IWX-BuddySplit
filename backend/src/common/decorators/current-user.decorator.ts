import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser { id: string; role: 'user' | 'admin'; email: string }

export const CurrentUser = createParamDecorator(
  (_d: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const req = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    return req.user;
  },
);
