import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'email_templates' })
export class EmailTemplateEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'text', unique: true }) key: string;
  @Column({ type: 'text' }) subject: string;
  @Column({ type: 'text' }) html: string;
  @Column({ type: 'text', nullable: true }) text: string | null;
  @Column({ type: 'jsonb', nullable: true }) variables: Record<string, unknown> | null;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
