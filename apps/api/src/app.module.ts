import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WinstonModule } from 'nest-winston';
import { MongooseModule } from '@nestjs/mongoose';
import * as winston from 'winston';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { TransactionsModule } from './transactions/transactions.module';
import { HabitsModule } from './habits/habits.module';
import { HabitLogsModule } from './habit-logs/habit-logs.module';
import { BudgetsModule } from './budgets/budgets.module';
import { GoalsModule } from './goals/goals.module';
import { JournalEntriesModule } from './journal-entries/journal-entries.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OtpCodesModule } from './otp-codes/otp-codes.module';
import { ProjectsModule } from './projects/projects.module';
import { NotesModule } from './notes/notes.module';
import { appConfig, databaseConfig } from './config';
import { emailConfig } from './email/email.config';
import { validate } from './config/env.validation';

import { DashboardModule } from './dashboard/dashboard.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ChatModule } from './chat/chat.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { PerformanceModule } from './performance/performance.module';
import { FiltersModule } from './filters/filters.module';
import { AuditModule } from './common/audit/audit.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    // ── Config: loads .env and validates env vars ──────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, emailConfig],
      validate,
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

    // ── MongoDB (database.config) ──────────────────────────────────────────
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('database.uri'),
      }),
    }),

    // ── Feature Modules ────────────────────────────────────────────────────
    HealthModule,
    UsersModule,
    AuthModule,
    TasksModule,
    TransactionsModule,
    HabitsModule,
    HabitLogsModule,
    BudgetsModule,
    ProjectsModule,
    NotesModule,
    GoalsModule,
    JournalEntriesModule,
    NotificationsModule,
    OtpCodesModule,
    DashboardModule,
    WorkspacesModule,
    ChatModule,
    OnboardingModule,
    PerformanceModule,
    FiltersModule,
    AuditModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
