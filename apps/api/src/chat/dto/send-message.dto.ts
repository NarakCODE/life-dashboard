import { IsString, IsOptional, IsMongoId, MaxLength, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  channelId!: string;

  @ApiProperty({ example: 'Hello everyone!', maxLength: 4000 })
  @IsString()
  @MaxLength(4000)
  content!: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'User IDs to mention',
  })
  @IsOptional()
  @IsMongoId({ each: true })
  @ArrayMaxSize(50)
  mentionIds?: string[];

  @ApiPropertyOptional({ example: 'temp-123', description: 'Client-generated temp ID for deduplication' })
  @IsString()
  @IsOptional()
  tempId?: string;
}
