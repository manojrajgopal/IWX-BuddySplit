import {
  BadRequestException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RoleEntity } from './entities/role.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { PermissionDto, RoleCreateDto, RoleUpdateDto } from './dto/role.dto';

export interface PermissionTuple { resource: string; action: string }

export interface RolePublic {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: PermissionTuple[];
  createdAt: Date;
  updatedAt: Date;
}

/** Wildcard tokens supported in stored permissions. */
const ANY = '*';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity) private readonly roles: Repository<RoleEntity>,
    @InjectRepository(RolePermissionEntity) private readonly perms: Repository<RolePermissionEntity>,
    private readonly ds: DataSource,
  ) {}

  async list(): Promise<RolePublic[]> {
    const rows = await this.roles.find({ relations: { permissions: true }, order: { name: 'ASC' } });
    return rows.map(toPublic);
  }

  async get(id: string): Promise<RolePublic> {
    const row = await this.roles.findOne({ where: { id }, relations: { permissions: true } });
    if (!row) throw new NotFoundException('Role not found');
    return toPublic(row);
  }

  async create(dto: RoleCreateDto): Promise<RolePublic> {
    const exists = await this.roles.findOne({ where: { name: dto.name } });
    if (exists) throw new BadRequestException('Role name already exists');
    const role = this.roles.create({
      name: dto.name,
      description: dto.description ?? null,
      isSystem: false,
      permissions: (dto.permissions ?? []).map((p) => this.perms.create({ resource: p.resource, action: p.action })),
    });
    const saved = await this.roles.save(role);
    return this.get(saved.id);
  }

  async update(id: string, dto: RoleUpdateDto): Promise<RolePublic> {
    const row = await this.roles.findOne({ where: { id }, relations: { permissions: true } });
    if (!row) throw new NotFoundException('Role not found');
    if (dto.description !== undefined) row.description = dto.description ?? null;
    await this.roles.save(row);

    if (dto.permissions !== undefined) {
      await this.ds.transaction(async (m) => {
        await m.delete(RolePermissionEntity, { role: { id } });
        if (dto.permissions!.length > 0) {
          await m.save(
            dto.permissions!.map((p) =>
              this.perms.create({ role: { id } as RoleEntity, resource: p.resource, action: p.action }),
            ),
          );
        }
      });
    }
    return this.get(id);
  }

  async remove(id: string): Promise<{ id: string }> {
    const row = await this.roles.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Role not found');
    if (row.isSystem) throw new BadRequestException('System roles cannot be deleted');
    await this.roles.remove(row);
    return { id };
  }

  /** Used by guard. Returns true if the named role grants the requested permission. */
  async hasPermission(roleName: string, resource: string, action: string): Promise<boolean> {
    if (!roleName) return false;
    if (roleName === 'admin') return true;
    const row = await this.roles.findOne({
      where: { name: roleName },
      relations: { permissions: true },
    });
    if (!row) return false;
    return row.permissions.some(
      (p) =>
        (p.resource === resource || p.resource === ANY) &&
        (p.action === action || p.action === ANY),
    );
  }

  validatePermission(p: PermissionDto): void {
    if (!p.resource || !p.action) throw new BadRequestException('Permission requires resource and action');
  }
}

function toPublic(r: RoleEntity): RolePublic {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    permissions: (r.permissions ?? []).map((p) => ({ resource: p.resource, action: p.action })),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}
