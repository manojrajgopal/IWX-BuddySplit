import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpVerificationEntity } from './entities/otp-verification.entity';
import { OtpService } from './otp.service';

@Module({
  imports: [TypeOrmModule.forFeature([OtpVerificationEntity])],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
