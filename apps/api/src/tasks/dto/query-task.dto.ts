import { IsOptional, IsEnum, IsString, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { TaskStatus, TaskPriority } from '../schemas/task.schema';

export class QueryTaskDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TaskStatus, description: 'Filter by status' })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    enum: TaskPriority,
    description: 'Filter by priority',
  })
  @IsEnum(TaskPriority)
  @Type(() => Number)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Filter tasks starting from this due date',
  })
  @Type(() => Date)
  @IsOptional()
  dueDateFrom?: Date;

  @ApiPropertyOptional({ description: 'Filter tasks ending at this due date' })
  @Type(() => Date)
  @IsOptional()
  dueDateTo?: Date;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma separated)',
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((tag) => tag.trim());
    }
    return value;
  })
  tags?: string[];
}
