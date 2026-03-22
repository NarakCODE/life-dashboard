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
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';

@Injectable()
export class HabitLogsService {
  constructor(
    private readonly habitLogsRepo: HabitLogsRepository,
    private readonly habitsService: HabitsService,
  ) {}

  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateHabitLogDto,
  ): Promise<HabitLogDocument> {
    await this.habitsService.findByIdAndUser(dto.habitId, workspace);

    try {
      return await this.habitLogsRepo.create(
        { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
        {
          ...dto,
          loggedDate: this.normalizeLoggedDate(dto.loggedDate),
        },
      );
    } catch (error) {
      this.handleDuplicateLogError(error);
      throw error;
    }
  }

  async findByIdAndUser(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<HabitLogDocument> {
    const habitLog = await this.habitLogsRepo.findByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!habitLog) {
      throw new NotFoundException('Habit log not found');
    }

    return habitLog;
  }

  async findByHabitId(
    habitId: string,
    workspace: WorkspaceRequestContext,
    query: QueryHabitLogDto,
  ) {
    await this.habitsService.findByIdAndUser(habitId, workspace);
    return this.habitLogsRepo.findByHabitId(
      habitId,
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      query,
    );
  }

  async findByUserId(
    workspace: WorkspaceRequestContext,
    query: QueryHabitLogDto,
  ) {
    if (query.habitId) {
      await this.habitsService.findByIdAndUser(query.habitId, workspace);
    }

    return this.habitLogsRepo.findByUserId(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      query,
    );
  }

  async update(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateHabitLogDto,
  ): Promise<HabitLogDocument> {
    await this.findByIdAndUser(id, workspace);

    const updateData: UpdateHabitLogDto = {
      ...dto,
      ...(dto.loggedDate
        ? { loggedDate: this.normalizeLoggedDate(dto.loggedDate) }
        : {}),
    };

    try {
      const updatedHabitLog = await this.habitLogsRepo.updateByIdAndUser(
        id,
        {
          workspaceId: workspace.workspaceId,
          userId: workspace.actorUserId,
        },
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

  async delete(id: string, workspace: WorkspaceRequestContext): Promise<void> {
    const deleted = await this.habitLogsRepo.deleteByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
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
