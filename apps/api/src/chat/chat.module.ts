import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { UsersModule } from '../users/users.module';

import { Channel, ChannelSchema } from './schemas/channel.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import {
  ChannelMember,
  ChannelMemberSchema,
} from './schemas/channel-member.schema';
import { ChatConfig, ChatConfigSchema } from './schemas/chat-config.schema';

import { ChannelsService } from './services/channels.service';
import { MessagesService } from './services/messages.service';
import { UnreadService } from './services/unread.service';
import { ChatConfigService } from './services/chat-config.service';

import { ChatGateway } from './gateways/chat.gateway';
import { ChatController } from './chat.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Channel.name, schema: ChannelSchema },
      { name: Message.name, schema: MessageSchema },
      { name: ChannelMember.name, schema: ChannelMemberSchema },
      { name: ChatConfig.name, schema: ChatConfigSchema },
    ]),
    WorkspacesModule,
    // UsersModule exports UsersRepository & UsersService; importing it here
    // makes them available to all providers in ChatModule without re-declaring them.
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret', 'fallback-secret'),
        signOptions: {
          expiresIn: config.get<string>('jwt.expiresIn', '1h') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChannelsService,
    MessagesService,
    UnreadService,
    ChatConfigService,
    // NOTE: Do NOT add UsersRepository here — it is already exported by UsersModule above.
    // Adding it as a local provider would create a second instance missing UserModel.
  ],
  exports: [ChannelsService, MessagesService, UnreadService, ChatConfigService],
})
export class ChatModule {}
