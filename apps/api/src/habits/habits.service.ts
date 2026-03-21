import { Injectable, NotFoundException } from '@nestjs/common';
import { HabitsRepository } from './habits.repository';
import { HabitDocument } from './schemas/habit.schema';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { QueryHabitDto } from './dto/query-habit.dto';

@Injectable()
export class HabitsService {
  constructor(private readonly habitsRepo: HabitsRepository) {}

  async create(userId: string, dto: CreateHabitDto): Promise<HabitDocument> {
    if (!dto.startDate) {
      dto.startDate = new Date();
    }
    return this.habitsRepo.create(userId, dto);
  }

  async findByIdAndUser(id: string, userId: string): Promise<HabitDocument> {
    const habit = await this.habitsRepo.findByIdAndUser(id, userId);
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }
    return habit;
  }

  async findMany(userId: string, query: QueryHabitDto) {
    return this.habitsRepo.findWithPaginationAndFilters(userId, query);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateHabitDto,
  ): Promise<HabitDocument> {
    const habit = await this.habitsRepo.updateByIdAndUser(id, userId, dto);
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }
    return habit;
  }

  async archive(id: string, userId: string): Promise<HabitDocument> {
    const habit = await this.habitsRepo.archiveByIdAndUser(id, userId);
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }
    return habit;
  }

  async delete(id: string, userId: string): Promise<void> {
    const deleted = await this.habitsRepo.deleteByIdAndUser(id, userId);
    if (!deleted) {
      throw new NotFoundException('Habit not found');
    }
  }
}
