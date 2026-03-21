import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GoalStatus } from '../schemas/goal.schema';

@Exclude()
export class ProgressLogResponseDto {
  @Expose()
  @ApiProperty()
  value: number;

  @Expose()
  @ApiProperty()
  note?: string;

  @Expose()
  @ApiProperty()
  loggedAt: Date;
}

@Exclude()
export class GoalResponseDto {
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
  @ApiProperty()
  targetValue: number;

  @Expose()
  @ApiProperty()
  currentValue: number;

  @Expose()
  @ApiProperty()
  unit?: string;

  @Expose()
  @ApiProperty()
  dueDate?: Date;

  @Expose()
  @ApiProperty({ enum: GoalStatus })
  status: GoalStatus;

  @Expose()
  @ApiProperty({ type: [ProgressLogResponseDto] })
  progressLogs: ProgressLogResponseDto[];

  @Expose()
  @ApiProperty()
  progressPercent: number;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<GoalResponseDto>) {
    Object.assign(this, partial);
  }
}
