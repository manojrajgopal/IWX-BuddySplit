import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe,
  Patch, Post, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '@/common/guards/roles.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { RolesService } from './roles.service';
import {
  roleCreateSchema, roleUpdateSchema, RoleCreateDto, RoleUpdateDto,
} from './dto/role.dto';

/** Catalog of resources/actions the UI exposes when editing role permissions. */
const CATALOG = {
  resources: [
    'email_accounts', 'roles', 'users', 'workspaces',
    'settings', 'branding', 'navigation', 'notifications',
  ],
  actions: ['create', 'read', 'update', 'delete'],
};

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin')
@Controller({ path: 'admin/roles', version: '1' })
export class RolesController {
  constructor(private readonly svc: RolesService) {}

  @Get('catalog')
  catalog() { return CATALOG; }

  @Get()
  @RequirePermissions('roles:read')
  list() { return this.svc.list(); }

  @Get(':id')
  @RequirePermissions('roles:read')
  get(@Param('id', ParseUUIDPipe) id: string) { return this.svc.get(id); }

  @Post()
  @RequirePermissions('roles:create')
  create(@Body(new ZodValidationPipe(roleCreateSchema)) dto: RoleCreateDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('roles:update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(roleUpdateSchema)) dto: RoleUpdateDto,
  ) { return this.svc.update(id, dto); }

  @Delete(':id')
  @RequirePermissions('roles:delete')
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
}
