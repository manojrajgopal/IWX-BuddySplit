import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTemplateEntity } from './entities/email-template.entity';
import { EmailAccountEntity } from './entities/email-account.entity';
import { EmailAccountsService } from './email-accounts.service';
import { EmailAccountsController } from './email-accounts.controller';
import { MailModule } from '@/core/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailTemplateEntity, EmailAccountEntity]),
    forwardRef(() => MailModule),
  ],
  providers: [EmailAccountsService],
  controllers: [EmailAccountsController],
  exports: [TypeOrmModule, EmailAccountsService],
})
export class EmailModule {}
