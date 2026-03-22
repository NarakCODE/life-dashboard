import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { TaskPriority, TaskStatus } from '../schemas/task.schema';

@Exclude()
export class TaskAssigneeResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiPropertyOptional()
  avatarUrl?: string;

  @Expose()
  @ApiPropertyOptional()
  role?: string;

  constructor(partial: Partial<TaskAssigneeResponseDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class TaskResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  workspaceId: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty({ enum: TaskStatus })
  status: TaskStatus;

  @Expose()
  @ApiProperty()
  projectId: string;

  @Expose()
  @ApiProperty()
  projectName: string;

  @Expose()
  @ApiPropertyOptional()
  workstreamId?: string;

  @Expose()
  @ApiPropertyOptional()
  workstreamName?: string;

  @Expose()
  @Type(() => TaskAssigneeResponseDto)
  @ApiPropertyOptional({ type: TaskAssigneeResponseDto })
  assignee?: TaskAssigneeResponseDto;

  @Expose()
  @ApiPropertyOptional()
  startDate?: Date;

  @Expose()
  @ApiPropertyOptional({ enum: TaskPriority })
  priority?: TaskPriority;

  @Expose()
  @ApiPropertyOptional()
  tag?: string;

  @Expose()
  @ApiPropertyOptional()
  description?: string;

  @Expose()
  @ApiPropertyOptional()
  dueDate?: Date;

  @Expose()
  @ApiPropertyOptional()
  completedAt?: Date | null;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<TaskResponseDto>) {
    Object.assign(this, partial);
  }
}

export class TaskPaginationDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class TaskFilterCountsDto {
  @ApiPropertyOptional({
    additionalProperties: { type: 'number' },
    type: 'object',
  })
  status?: Record<string, number>;

  @ApiPropertyOptional({
    additionalProperties: { type: 'number' },
    type: 'object',
  })
  priority?: Record<string, number>;

  @ApiPropertyOptional({
    additionalProperties: { type: 'number' },
    type: 'object',
  })
  tags?: Record<string, number>;

  @ApiPropertyOptional({
    additionalProperties: { type: 'number' },
    type: 'object',
  })
  members?: Record<string, number>;
}

export class MyTasksDataDto {
  @ApiProperty({ type: [TaskResponseDto] })
  tasks: TaskResponseDto[];

  @ApiProperty({ type: TaskPaginationDto })
  pagination: TaskPaginationDto;
}

export class MyTasksMetaDto {
  @ApiProperty({ type: TaskFilterCountsDto })
  filterCounts: TaskFilterCountsDto;
}

export class MyTasksResultDto {
  @ApiProperty({ type: MyTasksDataDto })
  data: MyTasksDataDto;

  @ApiProperty({ type: MyTasksMetaDto })
  meta: MyTasksMetaDto;
}
