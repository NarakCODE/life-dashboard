import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TaskNotificationsListener } from './listeners/task-notifications.listener';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    WorkspacesModule,
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    // JWT for WebSocket authentication
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret', 'fallback-secret'),
        signOptions: {
          expiresIn: config.get<string>('jwt.expiresIn', '15m') as never,
        },
      }),
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsRepository,
    NotificationsService,
    NotificationsGateway,
    TaskNotificationsListener,
    WsJwtGuard,
  ],
  exports: [NotificationsService, NotificationsRepository, NotificationsGateway],
})
export class NotificationsModule {}
