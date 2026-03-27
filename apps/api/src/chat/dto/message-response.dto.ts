import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Exclude()
export class MessageResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  channelId!: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  workspaceId?: string | null;

  @Expose()
  @ApiProperty()
  authorId!: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Author avatar URL' })
  authorAvatar?: string | null;

  @Expose()
  @ApiProperty()
  content!: string;

  @Expose()
  @ApiProperty({ type: [String], default: [] })
  mentionIds!: string[];

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  editedAt?: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  deletedAt?: string | null;

  @Expose()
  @ApiProperty()
  createdAt!: string;

  @Expose()
  @ApiProperty()
  updatedAt!: string;

  constructor(partial: Partial<MessageResponseDto>) {
    Object.assign(this, partial);
  }
}
