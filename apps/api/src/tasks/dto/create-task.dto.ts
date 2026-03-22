import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '../schemas/task.schema';

export class CreateTaskDto {
  @ApiProperty({ example: 'Design system setup' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'project-fintech-redesign' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  projectId: string;

  @ApiPropertyOptional({ example: 'ws-discovery' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  workstreamId?: string;

  @ApiPropertyOptional({
    description: 'Assignee user id. When provided the API resolves the user.',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({
    example: 'Establish the token and spacing system.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    enum: TaskPriority,
    default: TaskPriority.NONE,
  })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: 'Design' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  tag?: string;

  @ApiPropertyOptional({ example: '2026-03-25T00:00:00Z' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({
    example: '2026-03-27T00:00:00Z',
    description:
      'Optional scheduling field kept for dashboard overview compatibility.',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;
}
