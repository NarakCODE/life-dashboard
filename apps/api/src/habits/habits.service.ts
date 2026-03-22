import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HabitsRepository } from './habits.repository';
import { HabitDocument } from './schemas/habit.schema';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { QueryHabitDto } from './dto/query-habit.dto';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';

@Injectable()
export class HabitsService {
  private readonly logger = new Logger(HabitsService.name);

  constructor(
    private readonly habitsRepo: HabitsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateHabitDto,
  ): Promise<HabitDocument> {
    if (!dto.startDate) {
      dto.startDate = new Date();
    }
    return this.habitsRepo.create(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      dto,
    );
  }

  async findByIdAndUser(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<HabitDocument> {
    const habit = await this.habitsRepo.findByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }
    return habit;
  }

  async findMany(workspace: WorkspaceRequestContext, query: QueryHabitDto) {
    return this.habitsRepo.findWithPaginationAndFilters(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      query,
    );
  }

  async update(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateHabitDto,
  ): Promise<HabitDocument> {
    const scope = {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    };
    const habit = await this.habitsRepo.findByIdAndUser(id, scope);
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    const oldStreak = habit.currentStreak;
    const updatedHabit = await this.habitsRepo.updateByIdAndUser(
      id,
      scope,
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
        userId: workspace.actorUserId,
        oldStreak,
        newStreak: updatedHabit.currentStreak,
      });
    }

    return updatedHabit;
  }

  async archive(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<HabitDocument> {
    const habit = await this.habitsRepo.archiveByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }
    return habit;
  }

  async delete(id: string, workspace: WorkspaceRequestContext): Promise<void> {
    const scope = {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    };
    const habit = await this.habitsRepo.findByIdAndUser(id, scope);
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    const deleted = await this.habitsRepo.deleteByIdAndUser(id, scope);
    if (!deleted) {
      throw new NotFoundException('Habit not found');
    }

    // Emit deletion event for goals module to handle cleanup
    this.eventEmitter.emit('habit.deleted', {
      habitId: id,
      userId: workspace.actorUserId,
      workspaceId: workspace.workspaceId,
    });

    this.logger.log(
      `Habit ${id} deleted by user ${workspace.actorUserId} in workspace ${workspace.workspaceId}`,
    );
  }
}
