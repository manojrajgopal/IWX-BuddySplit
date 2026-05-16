import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneToUsers1700000000002 implements MigrationInterface {
  name = 'AddPhoneToUsers1700000000002';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE users ADD COLUMN phone TEXT`);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE users DROP COLUMN phone`);
  }
}
