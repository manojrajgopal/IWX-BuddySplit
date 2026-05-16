import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './core/database/database.module';
import { CacheModule } from './core/cache/cache.module';
import { CryptoModule } from './core/crypto/crypto.module';
import { MailModule } from './core/mail/mail.module';
import { RealtimeModule } from './core/realtime/realtime.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OtpModule } from './modules/otp/otp.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { MembersModule } from './modules/members/members.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { SettlementsModule } from './modules/settlements/settlements.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EmailModule } from './modules/email/email.module';
import { SettingsModule } from './modules/settings/settings.module';
import { BrandingModule } from './modules/branding/branding.module';
import { NavigationModule } from './modules/navigation/navigation.module';
import { AdminModule } from './modules/admin/admin.module';
import { RolesModule } from './modules/roles/roles.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    AppConfigModule, DatabaseModule, CacheModule, CryptoModule, MailModule, RealtimeModule,
    UsersModule, OtpModule, AuthModule, InvitationsModule, WorkspacesModule, MembersModule,
    ExpensesModule, SettlementsModule, NotificationsModule, EmailModule,
    SettingsModule, BrandingModule, NavigationModule, AdminModule, RolesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
