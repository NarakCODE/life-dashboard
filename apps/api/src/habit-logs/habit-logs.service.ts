import { Injectable } from '@nestjs/common';
import { HabitLogsRepository } from './habit-logs.repository';
import { HabitLogDocument } from './schemas/habit-log.schema';
import { CreateHabitLogDto } from './dto/create-habit-log.dto';

@Injectable()
export class HabitLogsService {
  constructor(private readonly habitLogsRepo: HabitLogsRepository) {}

  // TODO: Implement service methods
  // async findById(id: string): Promise<HabitLogDocument>
  // async findByHabitId(habitId: string): Promise<HabitLogDocument[]>
  // async findByUserId(userId: string): Promise<HabitLogDocument[]>
  // async create(dto: CreateHabitLogDto, userId: string): Promise<HabitLogDocument>
  // async update(id: string, dto: Partial<CreateHabitLogDto>): Promise<HabitLogDocument>
  // async delete(id: string): Promise<void>
}
