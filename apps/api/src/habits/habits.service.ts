import { Injectable } from '@nestjs/common';
import { HabitsRepository } from './habits.repository';
import { HabitDocument } from './schemas/habit.schema';
import { CreateHabitDto } from './dto/create-habit.dto';

@Injectable()
export class HabitsService {
  constructor(private readonly habitsRepo: HabitsRepository) {}

  // TODO: Implement service methods
  // async findById(id: string): Promise<HabitDocument>
  // async findByUserId(userId: string): Promise<HabitDocument[]>
  // async create(dto: CreateHabitDto, userId: string): Promise<HabitDocument>
  // async update(id: string, dto: Partial<CreateHabitDto>): Promise<HabitDocument>
  // async delete(id: string): Promise<void>
}
