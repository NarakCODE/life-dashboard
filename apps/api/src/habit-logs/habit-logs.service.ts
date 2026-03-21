import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HabitLogsRepository } from './habit-logs.repository';
import { HabitLogDocument } from './schemas/habit-log.schema';
import { CreateHabitLogDto } from './dto/create-habit-log.dto';
import { HabitsService } from '../habits/habits.service';
import { QueryHabitLogDto } from './dto/query-habit-log.dto';
import { UpdateHabitLogDto } from './dto/update-habit-log.dto';

@Injectable()
export class HabitLogsService {
  constructor(
    private readonly habitLogsRepo: HabitLogsRepository,
    private readonly habitsService: HabitsService,
  ) {}

  async create(
    userId: string,
    dto: CreateHabitLogDto,
  ): Promise<HabitLogDocument> {
    await this.habitsService.findByIdAndUser(dto.habitId, userId);

    try {
      return await this.habitLogsRepo.create(userId, {
        ...dto,
        loggedDate: this.normalizeLoggedDate(dto.loggedDate),
      });
    } catch (error) {
      this.handleDuplicateLogError(error);
      throw error;
    }
  }

  async findByIdAndUser(id: string, userId: string): Promise<HabitLogDocument> {
    const habitLog = await this.habitLogsRepo.findByIdAndUser(id, userId);
    if (!habitLog) {
      throw new NotFoundException('Habit log not found');
    }

    return habitLog;
  }

  async findByHabitId(
    habitId: string,
    userId: string,
    query: QueryHabitLogDto,
  ) {
    await this.habitsService.findByIdAndUser(habitId, userId);
    return this.habitLogsRepo.findByHabitId(habitId, userId, query);
  }

  async findByUserId(userId: string, query: QueryHabitLogDto) {
    if (query.habitId) {
      await this.habitsService.findByIdAndUser(query.habitId, userId);
    }

    return this.habitLogsRepo.findByUserId(userId, query);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateHabitLogDto,
  ): Promise<HabitLogDocument> {
    await this.findByIdAndUser(id, userId);

    const updateData: UpdateHabitLogDto = {
      ...dto,
      ...(dto.loggedDate
        ? { loggedDate: this.normalizeLoggedDate(dto.loggedDate) }
        : {}),
    };

    try {
      const updatedHabitLog = await this.habitLogsRepo.updateByIdAndUser(
        id,
        userId,
        updateData,
      );

      if (!updatedHabitLog) {
        throw new NotFoundException('Habit log not found');
      }

      return updatedHabitLog;
    } catch (error) {
      this.handleDuplicateLogError(error);
      throw error;
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    const deleted = await this.habitLogsRepo.deleteByIdAndUser(id, userId);
    if (!deleted) {
      throw new NotFoundException('Habit log not found');
    }
  }

  private normalizeLoggedDate(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private handleDuplicateLogError(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      throw new ConflictException(
        'A habit log already exists for this habit on that date',
      );
    }
  }
}
