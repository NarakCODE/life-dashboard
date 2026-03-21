import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { appConfig } from './config/app.config';

@Module({
  imports: [
    // ── Config: loads .env and validates env vars ──────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // ── Rate Limiting (security-rate-limiting) ─────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60000),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // ── Event Emitter (arch-use-events) ────────────────────────────────────
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),

    // ── Structured Logging (devops-use-logging) ────────────────────────────
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              config.get('NODE_ENV') === 'production'
                ? winston.format.json()
                : winston.format.combine(
                    winston.format.colorize(),
                    winston.format.printf(
                      ({ level, message, timestamp, context }) => {
                        return `[${String(timestamp)}] [${String(context ?? 'App')}] ${String(level)}: ${String(message)}`;
                      },
                    ),
                  ),
            ),
          }),
        ],
      }),
    }),

    // ── Feature Modules ────────────────────────────────────────────────────
    // Add your feature modules here as you implement them:
    // UsersModule, AuthModule, etc.
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
