import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '../schemas/task.schema';

@Exclude()
export class TaskTagResponseDto {
  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  color: string;
}

@Exclude()
export class TaskResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  userId: string;

  @Expose()
  @ApiProperty()
  title: string;

  @Expose()
  @ApiProperty()
  description?: string;

  @Expose()
  @ApiProperty({ enum: TaskStatus })
  status: TaskStatus;

  @Expose()
  @ApiProperty({ enum: TaskPriority })
  priority: TaskPriority;

  @Expose()
  @ApiProperty()
  dueDate?: Date;

  @Expose()
  @ApiProperty()
  completedAt?: Date;

  @Expose()
  @ApiProperty({ type: [TaskTagResponseDto] })
  tags: TaskTagResponseDto[];

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
