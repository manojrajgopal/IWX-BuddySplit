import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'navigation_items' })
export class NavigationItemEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ type: 'text' }) location: 'primary' | 'footer' | 'admin' | 'user' | string;
  @Column({ name: 'parent_id', type: 'uuid', nullable: true }) parentId: string | null;
  @Column({ type: 'text' }) label: string;
  @Column({ type: 'text' }) href: string;
  @Column({ type: 'text', nullable: true }) icon: string | null;
  @Column({ name: 'sort_order', type: 'int', default: 0 }) sortOrder: number;
  @Column({ type: 'boolean', default: true }) visible: boolean;
  @Column({ name: 'requires_role', type: 'text', nullable: true }) requiresRole: string | null;
}
