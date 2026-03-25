import { IsEnum, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutoDeletePreset } from '../schemas/chat-config.schema';

export class UpdateChatConfigDto {
  @ApiPropertyOptional({ 
    enum: AutoDeletePreset, 
    example: AutoDeletePreset.ONE_WEEK,
    description: 'Auto-delete preset duration',
  })
  @IsEnum(AutoDeletePreset)
  @IsOptional()
  autoDeletePreset?: AutoDeletePreset;

  @ApiPropertyOptional({ 
    example: 86400, 
    description: 'Custom auto-delete duration in seconds (used when preset is CUSTOM)',
    minimum: 60,
  })
  @IsNumber()
  @Min(60)
  @IsOptional()
  autoDeleteCustomSeconds?: number | null;

  @ApiPropertyOptional({ 
    example: true, 
    description: 'Auto-delete messages for all users (not just current user)',
  })
  @IsBoolean()
  @IsOptional()
  autoDeleteForAllUsers?: boolean;

  @ApiPropertyOptional({ 
    example: true, 
    description: 'Show notification before message deletion',
  })
  @IsBoolean()
  @IsOptional()
  notifyBeforeDeletion?: boolean;
}
