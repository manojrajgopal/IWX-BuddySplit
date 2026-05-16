import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'branding_assets' })
export class BrandingAssetEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'text', unique: true }) key: string; // logo | favicon | og_image
  @Column({ type: 'text' }) url: string;
  @Column({ type: 'text', nullable: true }) mime: string | null;
  @Column({ type: 'int', nullable: true }) width: number | null;
  @Column({ type: 'int', nullable: true }) height: number | null;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
