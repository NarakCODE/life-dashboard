import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsMongoId,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelType } from '../schemas/channel.schema';

export class CreateChannelDto {
  @ApiProperty({ enum: ChannelType, example: ChannelType.PUBLIC })
  @IsEnum(ChannelType)
  type!: ChannelType;

  @ApiPropertyOptional({ example: 'General', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'General discussion channel', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Member IDs (required for DM and PRIVATE channels)',
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  memberIds?: string[];
}
