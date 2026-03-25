import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutoDeletePreset } from '../schemas/chat-config.schema';

@Exclude()
export class ChatConfigResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  workspaceId!: string;

  @Expose()
  @ApiProperty({ enum: AutoDeletePreset })
  autoDeletePreset!: AutoDeletePreset;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  autoDeleteCustomSeconds!: number | null;

  @Expose()
  @ApiProperty()
  autoDeleteForAllUsers!: boolean;

  @Expose()
  @ApiProperty()
  notifyBeforeDeletion!: boolean;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  autoDeleteSeconds!: number | null;

  @Expose()
  @ApiProperty()
  createdAt!: string;

  @Expose()
  @ApiProperty()
  updatedAt!: string;

  constructor(partial: Partial<ChatConfigResponseDto>) {
    Object.assign(this, partial);
  }
}
