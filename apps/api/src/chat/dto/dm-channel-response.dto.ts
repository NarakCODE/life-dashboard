import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelType } from '../schemas/channel.schema';

/**
 * Simplified user info for DM other participant
 */
@Exclude()
export class DmOtherUserDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  displayName!: string;

  @Expose()
  @ApiPropertyOptional({ description: 'User avatar URL' })
  avatarUrl?: string | null;

  @Expose()
  @ApiProperty()
  email!: string;

  constructor(partial: Partial<DmOtherUserDto>) {
    Object.assign(this, partial);
  }
}

/**
 * DM Channel response with additional user information
 */
@Exclude()
export class DmChannelResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  workspaceId?: string | null;

  @Expose()
  @ApiProperty({ enum: ChannelType, example: ChannelType.DM })
  type!: ChannelType;

  @Expose()
  @ApiProperty({ description: 'The other user in this DM' })
  otherUser!: DmOtherUserDto;

  @Expose()
  @ApiPropertyOptional({ description: 'Last message ID' })
  lastMessageId?: string | null;

  @Expose()
  @ApiPropertyOptional({ description: 'Last message timestamp' })
  lastMessageAt?: string | null;

  @Expose()
  @ApiProperty()
  createdAt!: string;

  @Expose()
  @ApiProperty()
  updatedAt!: string;

  constructor(partial: Partial<DmChannelResponseDto>) {
    Object.assign(this, partial);
  }
}
