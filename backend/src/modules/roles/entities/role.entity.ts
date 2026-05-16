import {
  Column, CreateDateColumn, Entity, Index, OneToMany,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { RolePermissionEntity } from './role-permission.entity';

@Entity({ name: 'roles' })
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index({ unique: true })
  @Column({ type: 'text' }) name: string;

  @Column({ type: 'text', nullable: true }) description: string | null;

  /** Built-in roles (admin/user) cannot be deleted. */
  @Column({ name: 'is_system', type: 'boolean', default: false }) isSystem: boolean;

  @OneToMany(() => RolePermissionEntity, (p) => p.role, { cascade: true })
  permissions: RolePermissionEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
