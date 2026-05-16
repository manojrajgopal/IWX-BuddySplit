import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { SessionEntity } from './entities/session.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '@/modules/users/users.module';
import { OtpModule } from '@/modules/otp/otp.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([SessionEntity]),
    JwtModule.register({}),
    UsersModule,
    OtpModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
