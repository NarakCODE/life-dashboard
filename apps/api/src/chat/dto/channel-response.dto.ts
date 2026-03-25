import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelType } from '../schemas/channel.schema';

@Exclude()
export class ChannelResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  workspaceId?: string | null;

  @Expose()
  @ApiProperty({ enum: ChannelType })
  type!: ChannelType;

  @Expose()
  @ApiPropertyOptional()
  name?: string;

  @Expose()
  @ApiPropertyOptional()
  description?: string;

  @Expose()
  @ApiProperty({ type: [String] })
  memberIds!: string[];

  @Expose()
  @ApiPropertyOptional()
  unreadCount?: number;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  lastMessageId?: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  lastMessageAt?: string | null;

  @Expose()
  @ApiProperty()
  createdBy!: string;

  @Expose()
  @ApiProperty()
  createdAt!: string;

  @Expose()
  @ApiProperty()
  updatedAt!: string;

  constructor(partial: Partial<ChannelResponseDto>) {
    Object.assign(this, partial);
  }
}
