import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDate,
  IsArray,
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '../schemas/task.schema';

export class CreateTaskTagDto {
  @ApiProperty({ example: 'urgent' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  name: string;

  @ApiPropertyOptional({ example: '#ff0000' })
  @IsString()
  @IsOptional()
  color?: string;
}

export class CreateTaskDto {
  @ApiProperty({ example: 'Complete project documentation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Write API docs and examples' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.NONE })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: '2026-03-25T00:00:00Z' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;

  @ApiPropertyOptional({ type: [CreateTaskTagDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskTagDto)
  @IsOptional()
  tags?: CreateTaskTagDto[];
}
