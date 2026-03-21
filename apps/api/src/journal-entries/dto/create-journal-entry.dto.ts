import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MoodLevel } from '../schemas/journal-entry.schema';

export class CreateJournalEntryDto {
  @ApiPropertyOptional({ example: 'My Day' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Today was a productive day...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ enum: MoodLevel, example: MoodLevel.GOOD })
  @IsEnum(MoodLevel)
  @IsOptional()
  mood?: MoodLevel;

  @ApiPropertyOptional({ example: ['productivity', 'gratitude'] })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  @IsOptional()
  tags?: string[];
}
