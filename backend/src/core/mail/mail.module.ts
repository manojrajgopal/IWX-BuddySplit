import { Global, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTemplateEntity } from '@/modules/email/entities/email-template.entity';
import { EmailModule } from '@/modules/email/email.module';
import { MailService } from './mail.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([EmailTemplateEntity]),
    forwardRef(() => EmailModule),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
