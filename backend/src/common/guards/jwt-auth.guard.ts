import {
  CanActivate, ExecutionContext, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export const PUBLIC_KEY = 'is_public_route';
export const Public = (): MethodDecorator & ClassDecorator =>
  Reflect.metadata(PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic =
      this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException();
    const token = header.slice(7);
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; email: string; role: 'user'|'admin' }>(
        token, { secret: process.env.JWT_ACCESS_SECRET },
      );
      (req as Request & { user: unknown }).user = {
        id: payload.sub, email: payload.email, role: payload.role,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
