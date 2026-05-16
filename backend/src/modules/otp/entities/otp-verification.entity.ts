import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type OtpPurpose = 'register' | 'login' | 'reset_password' | 'email_change';

@Entity({ name: 'otp_verifications' })
export class OtpVerificationEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ type: 'citext' }) email: string;
  @Index() @Column({ type: 'enum', enum: ['register','login','reset_password','email_change'], enumName: 'otp_purpose' })
  purpose: OtpPurpose;
  @Column({ name: 'code_hash', type: 'text' }) codeHash: string;
  @Column({ type: 'int', default: 0 }) attempts: number;
  @Column({ name: 'max_attempts', type: 'int', default: 5 }) maxAttempts: number;
  @Column({ name: 'expires_at', type: 'timestamptz' }) expiresAt: Date;
  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true }) consumedAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
