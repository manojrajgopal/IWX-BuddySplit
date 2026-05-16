import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'site_settings' })
export class SiteSettingEntity {
  @PrimaryColumn({ type: 'text' }) key: string;
  @Column({ type: 'jsonb' }) value: unknown;
  @Column({ name: 'group_name', type: 'text', nullable: true }) groupName: string | null;
  @Column({ name: 'is_public', type: 'boolean', default: true }) isPublic: boolean;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
  @Column({ name: 'updated_by', type: 'uuid', nullable: true }) updatedBy: string | null;
}
