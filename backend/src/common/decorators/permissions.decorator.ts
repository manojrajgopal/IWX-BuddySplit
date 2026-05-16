import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'required_permissions';

/**
 * Decorator: list one or more `resource:action` permission strings required to access the handler.
 * The user's role must grant every listed permission. Users with role `admin` always pass.
 */
export const RequirePermissions = (...permissions: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions);
