import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { WorkspacesModule } from '../workspaces/workspaces.module';

import { Channel, ChannelSchema } from './schemas/channel.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import {
  ChannelMember,
  ChannelMemberSchema,
} from './schemas/channel-member.schema';

import { ChannelsService } from './services/channels.service';
import { MessagesService } from './services/messages.service';
import { UnreadService } from './services/unread.service';

import { ChatGateway } from './gateways/chat.gateway';
import { ChatController } from './chat.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Channel.name, schema: ChannelSchema },
      { name: Message.name, schema: MessageSchema },
      { name: ChannelMember.name, schema: ChannelMemberSchema },
    ]),
    WorkspacesModule,
    JwtModule.register({}),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChannelsService, MessagesService, UnreadService],
  exports: [ChannelsService, MessagesService, UnreadService],
})
export class ChatModule {}
