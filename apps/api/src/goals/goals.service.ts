import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { GoalsRepository } from './goals.repository';
import { GoalDocument, GoalType } from './schemas/goal.schema';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { QueryGoalDto } from './dto/query-goal.dto';
import { LogProgressDto } from './dto/log-progress.dto';
import { LinkTasksDto } from './dto/link-tasks.dto';
import { LinkHabitsDto } from './dto/link-habits.dto';
import { TasksService } from '../tasks/tasks.service';
import { HabitsService } from '../habits/habits.service';

@Injectable()
export class GoalsService {
  constructor(
    private readonly goalsRepo: GoalsRepository,
    private readonly tasksService: TasksService,
    private readonly habitsService: HabitsService,
  ) {}

  async create(userId: string, dto: CreateGoalDto): Promise<GoalDocument> {
    // Validate that linked tasks belong to the user
    if (dto.linkedTasks && dto.linkedTasks.length > 0) {
      await this.validateTasksOwnership(userId, dto.linkedTasks);
    }

    // Validate that linked habits belong to the user
    if (dto.linkedHabits && dto.linkedHabits.length > 0) {
      await this.validateHabitsOwnership(userId, dto.linkedHabits);
    }

    // Validate goal type consistency with linked items
    this.validateGoalTypeConsistency(
      dto.type,
      dto.linkedTasks,
      dto.linkedHabits,
    );

    return this.goalsRepo.create(userId, dto);
  }

  async findByIdAndUser(id: string, userId: string): Promise<any> {
    const goal = await this.goalsRepo.findByIdAndUser(id, userId);
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    return goal;
  }

  async findMany(userId: string, query: QueryGoalDto) {
    return this.goalsRepo.findWithPaginationAndFilters(userId, query);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateGoalDto,
  ): Promise<GoalDocument> {
    // First, verify the goal exists and belongs to the user
    const existingGoal = await this.goalsRepo.findById(id);
    if (!existingGoal) {
      throw new NotFoundException('Goal not found');
    }
    if (existingGoal.userId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own goals');
    }

    // Validate that linked tasks belong to the user
    if (dto.linkedTasks && dto.linkedTasks.length > 0) {
      await this.validateTasksOwnership(userId, dto.linkedTasks);
    }

    // Validate that linked habits belong to the user
    if (dto.linkedHabits && dto.linkedHabits.length > 0) {
      await this.validateHabitsOwnership(userId, dto.linkedHabits);
    }

    // Validate goal type consistency
    const type = dto.type ?? existingGoal.type;
    const linkedTasks =
      dto.linkedTasks ?? existingGoal.linkedTasks.map((t) => t.toString());
    const linkedHabits =
      dto.linkedHabits ?? existingGoal.linkedHabits.map((h) => h.toString());
    this.validateGoalTypeConsistency(type, linkedTasks, linkedHabits);

    const goal = await this.goalsRepo.updateByIdAndUser(id, userId, dto);
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    // Check if goal should be auto-completed
    await this.goalsRepo.checkAndCompleteGoal(id, userId);

    return goal;
  }

  async delete(id: string, userId: string): Promise<void> {
    const deleted = await this.goalsRepo.deleteByIdAndUser(id, userId);
    if (!deleted) {
      throw new NotFoundException('Goal not found');
    }
  }

  /**
   * Log progress for a manual goal
   */
  async logProgress(
    id: string,
    userId: string,
    dto: LogProgressDto,
  ): Promise<GoalDocument> {
    // Verify goal exists and belongs to user
    const goal = await this.goalsRepo.findById(id);
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    if (goal.userId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own goals');
    }

    // Only manual goals should allow progress logging
    // Task-based and habit-based goals calculate progress automatically
    if (goal.type !== GoalType.MANUAL && goal.type !== GoalType.MIXED) {
      throw new BadRequestException(
        `Cannot manually log progress for ${goal.type} goals. Progress is calculated automatically from linked items.`,
      );
    }

    const updatedGoal = await this.goalsRepo.logProgress(
      id,
      userId,
      dto.value,
      dto.note,
    );

    if (!updatedGoal) {
      throw new NotFoundException('Goal not found');
    }

    // Check if goal should be auto-completed
    await this.goalsRepo.checkAndCompleteGoal(id, userId);

    return updatedGoal;
  }

  /**
   * Link tasks to a goal
   */
  async linkTasks(
    id: string,
    userId: string,
    dto: LinkTasksDto,
  ): Promise<GoalDocument> {
    // Verify goal exists and belongs to user
    const goal = await this.goalsRepo.findById(id);
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    if (goal.userId.toString() !== userId) {
      throw new ForbiddenException('You can only modify your own goals');
    }

    // Validate task ownership
    await this.validateTasksOwnership(userId, dto.taskIds);

    // Check if goal type supports task linking
    if (goal.type === GoalType.HABIT_BASED) {
      throw new BadRequestException(
        'Cannot link tasks to a habit-based goal. Change goal type first.',
      );
    }

    const taskObjectIds = dto.taskIds.map((tid) => new Types.ObjectId(tid));
    const updatedGoal = await this.goalsRepo.linkTasks(
      id,
      userId,
      taskObjectIds,
    );

    if (!updatedGoal) {
      throw new NotFoundException('Goal not found');
    }

    return updatedGoal;
  }

  /**
   * Link habits to a goal
   */
  async linkHabits(
    id: string,
    userId: string,
    dto: LinkHabitsDto,
  ): Promise<GoalDocument> {
    // Verify goal exists and belongs to user
    const goal = await this.goalsRepo.findById(id);
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    if (goal.userId.toString() !== userId) {
      throw new ForbiddenException('You can only modify your own goals');
    }

    // Validate habit ownership
    await this.validateHabitsOwnership(userId, dto.habitIds);

    // Check if goal type supports habit linking
    if (goal.type === GoalType.TASK_BASED) {
      throw new BadRequestException(
        'Cannot link habits to a task-based goal. Change goal type first.',
      );
    }

    const habitObjectIds = dto.habitIds.map((hid) => new Types.ObjectId(hid));
    const updatedGoal = await this.goalsRepo.linkHabits(
      id,
      userId,
      habitObjectIds,
    );

    if (!updatedGoal) {
      throw new NotFoundException('Goal not found');
    }

    return updatedGoal;
  }

  /**
   * Unlink a task from a goal
   */
  async unlinkTask(
    id: string,
    userId: string,
    taskId: string,
  ): Promise<GoalDocument> {
    // Verify goal exists and belongs to user
    const goal = await this.goalsRepo.findById(id);
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    if (goal.userId.toString() !== userId) {
      throw new ForbiddenException('You can only modify your own goals');
    }

    // Verify the task is actually linked
    const isLinked = await this.goalsRepo.hasTaskLinked(id, taskId);
    if (!isLinked) {
      throw new BadRequestException('Task is not linked to this goal');
    }

    const updatedGoal = await this.goalsRepo.unlinkTask(id, userId, taskId);

    if (!updatedGoal) {
      throw new NotFoundException('Goal not found');
    }

    return updatedGoal;
  }

  /**
   * Unlink a habit from a goal
   */
  async unlinkHabit(
    id: string,
    userId: string,
    habitId: string,
  ): Promise<GoalDocument> {
    // Verify goal exists and belongs to user
    const goal = await this.goalsRepo.findById(id);
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    if (goal.userId.toString() !== userId) {
      throw new ForbiddenException('You can only modify your own goals');
    }

    // Verify the habit is actually linked
    const isLinked = await this.goalsRepo.hasHabitLinked(id, habitId);
    if (!isLinked) {
      throw new BadRequestException('Habit is not linked to this goal');
    }

    const updatedGoal = await this.goalsRepo.unlinkHabit(id, userId, habitId);

    if (!updatedGoal) {
      throw new NotFoundException('Goal not found');
    }

    return updatedGoal;
  }

  /**
   * Validate that all tasks belong to the user
   */
  private async validateTasksOwnership(
    userId: string,
    taskIds: string[],
  ): Promise<void> {
    const uniqueTaskIds = [...new Set(taskIds)];

    for (const taskId of uniqueTaskIds) {
      try {
        await this.tasksService.findByIdAndUser(taskId, userId);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new ForbiddenException(
            `Task ${taskId} not found or does not belong to you`,
          );
        }
        throw error;
      }
    }
  }

  /**
   * Validate that all habits belong to the user
   */
  private async validateHabitsOwnership(
    userId: string,
    habitIds: string[],
  ): Promise<void> {
    const uniqueHabitIds = [...new Set(habitIds)];

    for (const habitId of uniqueHabitIds) {
      try {
        await this.habitsService.findByIdAndUser(habitId, userId);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new ForbiddenException(
            `Habit ${habitId} not found or does not belong to you`,
          );
        }
        throw error;
      }
    }
  }

  /**
   * Validate goal type consistency with linked items
   */
  private validateGoalTypeConsistency(
    type: GoalType | undefined,
    linkedTasks: string[] | undefined,
    linkedHabits: string[] | undefined,
  ): void {
    const hasTasks = linkedTasks && linkedTasks.length > 0;
    const hasHabits = linkedHabits && linkedHabits.length > 0;

    if (type === GoalType.TASK_BASED && hasHabits && !hasTasks) {
      throw new BadRequestException(
        'Task-based goals cannot have linked habits. Use mixed type instead.',
      );
    }

    if (type === GoalType.HABIT_BASED && hasTasks && !hasHabits) {
      throw new BadRequestException(
        'Habit-based goals cannot have linked tasks. Use mixed type instead.',
      );
    }
  }

  /**
   * Handle task deletion - remove task from all goals
   * Called by event listener when a task is deleted
   */
  async handleTaskDeleted(taskId: string): Promise<void> {
    await this.goalsRepo.removeTaskFromAllGoals(taskId);
  }

  /**
   * Handle habit deletion - remove habit from all goals
   * Called by event listener when a habit is deleted
   */
  async handleHabitDeleted(habitId: string): Promise<void> {
    await this.goalsRepo.removeHabitFromAllGoals(habitId);
  }
}
