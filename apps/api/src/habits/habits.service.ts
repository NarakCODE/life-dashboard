import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HabitsRepository } from './habits.repository';
import { HabitDocument } from './schemas/habit.schema';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { QueryHabitDto } from './dto/query-habit.dto';

@Injectable()
export class HabitsService {
  private readonly logger = new Logger(HabitsService.name);

  constructor(
    private readonly habitsRepo: HabitsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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
    const habit = await this.habitsRepo.findByIdAndUser(id, userId);
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    const oldStreak = habit.currentStreak;
    const updatedHabit = await this.habitsRepo.updateByIdAndUser(
      id,
      userId,
      dto,
    );

    if (!updatedHabit) {
      throw new NotFoundException('Habit not found');
    }

    // Emit streak update event if streak changed
    // Note: currentStreak is typically updated internally by habit-logs module
    if (updatedHabit.currentStreak !== oldStreak) {
      this.eventEmitter.emit('habit.streak_updated', {
        habitId: id,
        userId,
        oldStreak,
        newStreak: updatedHabit.currentStreak,
      });
    }

    return updatedHabit;
  }

  async archive(id: string, userId: string): Promise<HabitDocument> {
    const habit = await this.habitsRepo.archiveByIdAndUser(id, userId);
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }
    return habit;
  }

  async delete(id: string, userId: string): Promise<void> {
    const habit = await this.habitsRepo.findByIdAndUser(id, userId);
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    const deleted = await this.habitsRepo.deleteByIdAndUser(id, userId);
    if (!deleted) {
      throw new NotFoundException('Habit not found');
    }

    // Emit deletion event for goals module to handle cleanup
    this.eventEmitter.emit('habit.deleted', {
      habitId: id,
      userId,
    });

    this.logger.log(`Habit ${id} deleted by user ${userId}`);
  }
}
