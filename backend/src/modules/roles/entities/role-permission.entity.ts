import {
  Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique,
} from 'typeorm';
import { RoleEntity } from './role.entity';

@Entity({ name: 'role_permissions' })
@Unique('role_permissions_role_resource_action_uk', ['role', 'resource', 'action'])
export class RolePermissionEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index()
  @ManyToOne(() => RoleEntity, (r) => r.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;

  /** e.g. 'email_accounts', 'roles', 'users', 'workspaces' */
  @Column({ type: 'text' }) resource: string;

  /** e.g. 'create', 'read', 'update', 'delete' */
  @Column({ type: 'text' }) action: string;
}
