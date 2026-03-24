import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { HabitFrequency } from '../schemas/habit.schema';

@Exclude()
export class HabitResponseDto {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  workspaceId?: string | null;

  @Expose()
  @ApiProperty()
  userId!: string;

  @Expose()
  @ApiProperty()
  name!: string;

  @Expose()
  @ApiProperty()
  description?: string;

  @Expose()
  @ApiProperty({ enum: HabitFrequency })
  frequency!: HabitFrequency;

  @Expose()
  @ApiProperty()
  customDays!: number[];

  @Expose()
  @ApiProperty()
  targetCount!: number;

  @Expose()
  @ApiProperty()
  color!: string;

  @Expose()
  @ApiProperty()
  status!: string;

  @Expose()
  @ApiProperty()
  startDate!: Date;

  @Expose()
  @ApiProperty()
  endDate?: Date | null;

  @Expose()
  @ApiProperty()
  archivedAt?: Date | null;

  @Expose()
  @ApiProperty()
  currentStreak!: number;

  @Expose()
  @ApiProperty()
  longestStreak!: number;

  @Expose()
  @ApiProperty()
  isActive!: boolean;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<HabitResponseDto>) {
    Object.assign(this, partial);
  }
}
