import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
import {
  MyTasksResultDto,
  TaskAssigneeResponseDto,
  TaskResponseDto,
} from './dto/task-response.dto';
import { TasksRepository } from './tasks.repository';
import {
  TaskAssigneeSnapshot,
  TaskDocument,
  TaskPriority,
  TaskStatus,
} from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly tasksRepo: TasksRepository,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateTaskDto): Promise<TaskResponseDto> {
    const assignee = await this.resolveAssigneeSnapshot(dto.assigneeId);
    const status = dto.status ?? TaskStatus.TODO;

    const task = await this.tasksRepo.create(userId, {
      name: dto.name,
      projectId: dto.projectId,
      projectName: dto.projectName ?? dto.projectId,
      workstreamId: dto.workstreamId,
      workstreamName: dto.workstreamName,
      assignee,
      description: dto.description,
      status,
      priority: dto.priority ?? TaskPriority.NONE,
      tag: dto.tag,
      startDate: dto.startDate,
      dueDate: dto.dueDate,
      completedAt: status === TaskStatus.DONE ? new Date() : null,
    });

    return this.toTaskResponse(task);
  }

  async findByIdAndUser(id: string, userId: string): Promise<TaskResponseDto> {
    const task = await this.tasksRepo.findByIdAndUser(id, userId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.toTaskResponse(task);
  }

  async findMany(
    userId: string,
    query: QueryTaskDto,
  ): Promise<MyTasksResultDto> {
    const { items, total, filterCounts } =
      await this.tasksRepo.findWithPaginationAndFilters(userId, query);

    return {
      data: {
        tasks: items.map((task) => this.toTaskResponse(task)),
        pagination: {
          total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(total / query.limit),
        },
      },
      meta: {
        filterCounts,
      },
    };
  }

  async getMyTasks(
    userId: string,
    query: QueryTaskDto,
  ): Promise<MyTasksResultDto> {
    return this.findMany(userId, query);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const existingTask = await this.tasksRepo.findByIdAndUser(id, userId);
    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    const updatePayload: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      updatePayload.name = dto.name;
    }

    if (dto.projectId !== undefined) {
      updatePayload.projectId = dto.projectId;
    }

    if (dto.projectName !== undefined) {
      updatePayload.projectName = dto.projectName;
    }

    if (dto.workstreamId !== undefined) {
      updatePayload.workstreamId = dto.workstreamId;
    }

    if (dto.workstreamName !== undefined) {
      updatePayload.workstreamName = dto.workstreamName;
    }

    if (dto.description !== undefined) {
      updatePayload.description = dto.description;
    }

    if (dto.priority !== undefined) {
      updatePayload.priority = dto.priority;
    }

    if (dto.tag !== undefined) {
      updatePayload.tag = dto.tag;
    }

    if (dto.startDate !== undefined) {
      updatePayload.startDate = dto.startDate;
    }

    if (dto.dueDate !== undefined) {
      updatePayload.dueDate = dto.dueDate;
    }

    if ('assigneeId' in dto) {
      updatePayload.assignee = await this.resolveAssigneeSnapshot(
        dto.assigneeId,
      );
    }

    if (dto.status !== undefined) {
      updatePayload.status = dto.status;
      updatePayload.completedAt =
        dto.status === TaskStatus.DONE
          ? (dto.completedAt ?? existingTask.completedAt ?? new Date())
          : null;
    } else if (dto.completedAt !== undefined) {
      updatePayload.completedAt = dto.completedAt;
    }

    const updatedTask = await this.tasksRepo.updateByIdAndUser(id, userId, {
      $set: updatePayload,
    });

    if (!updatedTask) {
      throw new NotFoundException('Task not found');
    }

    if (dto.status && dto.status !== existingTask.status) {
      this.eventEmitter.emit('task.status_changed', {
        taskId: id,
        userId,
        oldStatus: this.normalizeStatus(existingTask.status),
        newStatus: dto.status,
      });
    }

    return this.toTaskResponse(updatedTask);
  }

  async delete(id: string, userId: string): Promise<{ message: string }> {
    const task = await this.tasksRepo.findByIdAndUser(id, userId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const deleted = await this.tasksRepo.deleteByIdAndUser(id, userId);
    if (!deleted) {
      throw new NotFoundException('Task not found');
    }

    this.eventEmitter.emit('task.deleted', {
      taskId: id,
      userId,
    });

    this.logger.log(`Task ${id} deleted by user ${userId}`);

    return { message: 'Task deleted successfully' };
  }

  async getTaskOverview(userId: string) {
    return this.tasksRepo.getTaskOverview(userId);
  }

  private async resolveAssigneeSnapshot(
    assigneeId?: string,
  ): Promise<TaskAssigneeSnapshot | null> {
    if (!assigneeId) {
      return null;
    }

    const user = await this.usersService.findById(assigneeId);

    return {
      id: new Types.ObjectId(user.id),
      name: user.displayName,
      avatarUrl: undefined,
      role: undefined,
    };
  }

  private toTaskResponse(task: TaskDocument): TaskResponseDto {
    const raw = task.toObject() as TaskDocument & {
      _id: Types.ObjectId;
      title?: string;
      tags?: Array<{ name?: string }>;
    };

    const assignee = raw.assignee
      ? new TaskAssigneeResponseDto({
          id: this.stringifyObjectId(raw.assignee.id),
          name: raw.assignee.name,
          avatarUrl: raw.assignee.avatarUrl,
          role: raw.assignee.role,
        })
      : undefined;

    return new TaskResponseDto({
      id: this.stringifyObjectId(raw._id),
      name: raw.name ?? raw.title ?? '',
      status: this.normalizeStatus(raw.status),
      projectId: raw.projectId ?? 'personal',
      projectName: raw.projectName ?? 'Personal',
      workstreamId: raw.workstreamId,
      workstreamName: raw.workstreamName,
      assignee,
      startDate: raw.startDate ?? raw.dueDate,
      priority: this.normalizePriority(raw.priority),
      tag: raw.tag ?? raw.tags?.[0]?.name,
      description: raw.description,
      dueDate: raw.dueDate,
      completedAt: raw.completedAt ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  private normalizeStatus(status?: TaskStatus | string): TaskStatus {
    if (status === 'in_progress') {
      return TaskStatus.IN_PROGRESS;
    }

    if (status === TaskStatus.ARCHIVED) {
      return TaskStatus.ARCHIVED;
    }

    return (status as TaskStatus) ?? TaskStatus.TODO;
  }

  private normalizePriority(
    priority?: TaskPriority | number | string,
  ): TaskPriority {
    if (typeof priority === 'number' || !Number.isNaN(Number(priority))) {
      switch (Number(priority)) {
        case 1:
          return TaskPriority.LOW;
        case 2:
          return TaskPriority.MEDIUM;
        case 3:
          return TaskPriority.HIGH;
        case 4:
          return TaskPriority.URGENT;
        default:
          return TaskPriority.NONE;
      }
    }

    return (priority as TaskPriority) ?? TaskPriority.NONE;
  }

  private stringifyObjectId(value?: Types.ObjectId | string): string {
    if (!value) {
      return '';
    }

    return value instanceof Types.ObjectId ? value.toString() : value;
  }
}
