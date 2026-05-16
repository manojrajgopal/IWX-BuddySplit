import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfig, loadConfig } from './env.schema';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [
        () => {
          const c = loadConfig();
          return c as Record<string, unknown>;
        },
      ],
    }),
  ],
  providers: [
    {
      provide: 'APP_CONFIG',
      useFactory: (cs: ConfigService) => {
        // Re-validate, but ConfigService already has values loaded.
        return loadConfig() as AppConfig;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['APP_CONFIG'],
})
export class AppConfigModule {}
