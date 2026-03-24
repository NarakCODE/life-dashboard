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
import { ProjectsService } from '../projects/projects.service';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly tasksRepo: TasksRepository,
    private readonly usersService: UsersService,
    private readonly projectsService: ProjectsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    const assignee = await this.resolveAssigneeSnapshot(dto.assigneeId);
    const status = dto.status ?? TaskStatus.TODO;
    const projectContext = await this.projectsService.resolveTaskProjectContext(
      workspace,
      dto.projectId,
      dto.workstreamId,
    );

    const task = await this.tasksRepo.create(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      {
        name: dto.name,
        projectId: projectContext.projectId,
        projectName: projectContext.projectName,
        workstreamId: projectContext.workstreamId,
        workstreamName: projectContext.workstreamName,
        assignee,
        description: dto.description,
        status,
        priority: dto.priority ?? TaskPriority.NONE,
        tag: dto.tag,
        startDate: dto.startDate,
        dueDate: dto.dueDate,
        completedAt: status === TaskStatus.DONE ? new Date() : null,
      },
    );

    // Emit task assigned notification if assignee is different from creator
    if (assignee && assignee.id.toString() !== workspace.actorUserId) {
      const assigner = await this.usersService.findById(workspace.actorUserId);
      this.eventEmitter.emit('task.assigned', {
        taskId: task._id.toString(),
        taskName: dto.name,
        assignerId: workspace.actorUserId,
        assignerName: assigner.displayName,
        assigneeId: assignee.id.toString(),
        workspaceId: workspace.workspaceId,
      });
    }

    return this.toTaskResponse(task);
  }

  async findByIdAndUser(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<TaskResponseDto> {
    const task = await this.tasksRepo.findByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.toTaskResponse(task);
  }

  async findMany(
    workspace: WorkspaceRequestContext,
    query: QueryTaskDto,
  ): Promise<MyTasksResultDto> {
    const { items, total, filterCounts } =
      await this.tasksRepo.findWithPaginationAndFilters(
        {
          workspaceId: workspace.workspaceId,
          userId: workspace.actorUserId,
        },
        query,
      );

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
    workspace: WorkspaceRequestContext,
    query: QueryTaskDto,
  ): Promise<MyTasksResultDto> {
    return this.findMany(workspace, query);
  }

  async update(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const existingTask = await this.tasksRepo.findByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
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

    if (dto.projectId !== undefined || dto.workstreamId !== undefined) {
      const projectContext =
        await this.projectsService.resolveTaskProjectContext(
          workspace,
          dto.projectId ?? existingTask.projectId,
          dto.workstreamId ?? existingTask.workstreamId,
        );

      updatePayload.projectId = projectContext.projectId;
      updatePayload.projectName = projectContext.projectName;
      updatePayload.workstreamId = projectContext.workstreamId;
      updatePayload.workstreamName = projectContext.workstreamName;
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

    const updatedTask = await this.tasksRepo.updateByIdAndUser(
      id,
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      {
        $set: updatePayload,
      },
    );

    if (!updatedTask) {
      throw new NotFoundException('Task not found');
    }

    if (dto.status && dto.status !== existingTask.status) {
      this.eventEmitter.emit('task.status_changed', {
        taskId: id,
        userId: workspace.actorUserId,
        oldStatus: this.normalizeStatus(existingTask.status),
        newStatus: dto.status,
      });
    }

    // Emit task assigned notification if assignee changed
    if ('assigneeId' in dto && dto.assigneeId) {
      const newAssigneeId = dto.assigneeId;
      const oldAssigneeId = existingTask.assignee?.id?.toString();

      // Only notify if assignee actually changed and is different from updater
      if (newAssigneeId !== oldAssigneeId && newAssigneeId !== workspace.actorUserId) {
        const assigner = await this.usersService.findById(workspace.actorUserId);
        const taskName = dto.name ?? existingTask.name ?? 'Untitled Task';
        
        this.eventEmitter.emit('task.assigned', {
          taskId: id,
          taskName,
          assignerId: workspace.actorUserId,
          assignerName: assigner.displayName,
          assigneeId: newAssigneeId,
          workspaceId: workspace.workspaceId,
        });
      }
    }

    return this.toTaskResponse(updatedTask);
  }

  async delete(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<{ message: string }> {
    const scope = {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    };
    const task = await this.tasksRepo.findByIdAndUser(id, scope);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const deleted = await this.tasksRepo.deleteByIdAndUser(id, scope);
    if (!deleted) {
      throw new NotFoundException('Task not found');
    }

    this.eventEmitter.emit('task.deleted', {
      taskId: id,
      userId: workspace.actorUserId,
    });

    this.logger.log(
      `Task ${id} deleted by user ${workspace.actorUserId} in workspace ${workspace.workspaceId}`,
    );

    return { message: 'Task deleted successfully' };
  }

  async getTaskOverview(workspace: WorkspaceRequestContext) {
    return this.tasksRepo.getTaskOverview({
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
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
      workspaceId: raw.workspaceId
        ? this.stringifyObjectId(raw.workspaceId)
        : '',
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
