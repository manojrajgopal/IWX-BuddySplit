import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: false });

  // Render (and most PaaS) puts the app behind a reverse proxy. Without this
  // Express returns the wrong client IP and incorrectly marks the request as
  // insecure, which breaks Secure cookies and our login-notification IPs.
  app.set('trust proxy', 1);

  app.use(helmet());

  // Parse comma-separated CORS_ORIGINS. Supports an explicit wildcard "*" for
  // public APIs, otherwise checks the request origin against the allow-list.
  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const allowAll = corsOrigins.includes('*');

  app.enableCors({
    origin: allowAll
      ? true
      : (origin, cb) => {
          // Allow same-origin / curl / server-to-server (no Origin header).
          if (!origin) return cb(null, true);
          if (corsOrigins.includes(origin)) return cb(null, true);
          return cb(new Error(`Origin ${origin} not allowed by CORS`), false);
        },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition'],
    maxAge: 600,
  });

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`🟢 IWX BuddySplit API listening on :${port}/api  (CORS: ${allowAll ? '*' : corsOrigins.join(', ') || 'none'})`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
