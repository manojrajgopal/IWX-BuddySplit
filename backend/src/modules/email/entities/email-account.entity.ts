import {
  Column, CreateDateColumn, Entity, Index,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export type EmailProvider = 'smtp' | 'gmail_oauth' | 'resend';

@Entity({ name: 'email_accounts' })
export class EmailAccountEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  /** Human friendly label, e.g. "Support SMTP", "Marketing Gmail" */
  @Column({ type: 'text' }) name: string;

  @Column({ type: 'text' }) provider: EmailProvider;

  /** From address: "Name <email@host>" or just "email@host" */
  @Column({ name: 'from_address', type: 'text' }) fromAddress: string;

  /** Encrypted JSON blob (AES-256-GCM) containing provider-specific secrets. */
  @Column({ name: 'config_encrypted', type: 'text' }) configEncrypted: string;

  @Index()
  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive: boolean;

  /** When true this account is used by MailService when none is selected. */
  @Index()
  @Column({ name: 'is_default', type: 'boolean', default: false }) isDefault: boolean;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
