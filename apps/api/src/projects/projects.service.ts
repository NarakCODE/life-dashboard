import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  ProjectResponseDto,
  ProjectWorkstreamResponseDto,
  ResolvedTaskProjectContext,
} from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsRepository } from './projects.repository';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import {
  ProjectDocument,
  ProjectPriority,
  ProjectStatus,
} from './schemas/project.schema';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { TasksRepository } from '../tasks/tasks.repository';
import {
  TaskAssigneeSnapshot,
  TaskDocument,
  TaskPriority,
  TaskStatus,
} from '../tasks/schemas/task.schema';
import { UpdateTaskDto } from '../tasks/dto/update-task.dto';
import {
  TaskAssigneeResponseDto,
  TaskResponseDto,
} from '../tasks/dto/task-response.dto';
import { MoveProjectTaskDto } from './dto/move-project-task.dto';
import { ReorderProjectTasksDto } from './dto/reorder-project-tasks.dto';
import {
  ProjectDetailsBacklogSummaryDto,
  ProjectDetailsKeyFeaturesDto,
  ProjectDetailsMetaDto,
  ProjectDetailsProjectTaskDto,
  ProjectDetailsResponseDto,
  ProjectDetailsScopeDto,
  ProjectDetailsTimeSummaryDto,
  ProjectDetailsTimelineTaskDto,
  ProjectDetailsUserDto,
  ProjectDetailsWorkstreamDto,
  ProjectDetailsWorkstreamTaskDto,
} from './dto/project-details-response.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectsRepo: ProjectsRepository,
    private readonly tasksRepo: TasksRepository,
    private readonly usersService: UsersService,
  ) {}

  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsRepo.create(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      dto,
    );
    return this.toProjectResponse(project);
  }

  async findAllAccessible(
    workspace: WorkspaceRequestContext,
  ): Promise<ProjectResponseDto[]> {
    const projects = await this.projectsRepo.findAllAccessible({
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    return projects.map((project) => this.toProjectResponse(project));
  }

  async findByIdAccessible(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsRepo.findAccessibleById(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.toProjectResponse(project);
  }

  async getDetails(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<ProjectDetailsResponseDto> {
    const project = await this.requireAccessibleProject(id, workspace);
    const tasks = await this.tasksRepo.findByProject(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      project.id,
    );

    const raw = project.toObject() as ProjectDocument & { _id: Types.ObjectId };
    const memberIds = [
      raw.ownerUserId,
      ...(raw.memberUserIds ?? []),
      ...tasks
        .map((task) => task.assignee?.id)
        .filter((value): value is Types.ObjectId => Boolean(value)),
    ];
    const users = await this.usersService.findByIds(
      Array.from(new Set(memberIds.map((value) => value.toString()))),
    );

    return this.toProjectDetailsResponse(project, tasks, users);
  }

  async update(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    const existingProject = await this.projectsRepo.findAccessibleById(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!existingProject) {
      throw new NotFoundException('Project not found');
    }

    const update: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      update.name = dto.name;
    }

    if (dto.status !== undefined) {
      update.status = dto.status;
    }

    if (dto.priority !== undefined) {
      update.priority = dto.priority;
    }

    if (dto.typeLabel !== undefined) {
      update.typeLabel = dto.typeLabel;
    }

    if (dto.durationLabel !== undefined) {
      update.durationLabel = dto.durationLabel;
    }

    if (dto.memberUserIds !== undefined) {
      update.memberUserIds = dto.memberUserIds.map(
        (memberId) => new Types.ObjectId(memberId),
      );
    }

    if (dto.workstreams !== undefined) {
      update.workstreams = dto.workstreams.map((workstream, index) => {
        const existing = existingProject.workstreams[index];

        return {
          _id: existing?._id ?? new Types.ObjectId(),
          name: workstream.name,
          order: workstream.order ?? index,
          archivedAt: existing?.archivedAt ?? null,
        };
      });
    }

    const project = await this.projectsRepo.updateByIdAndWorkspace(
      id,
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      update as Partial<ProjectDocument>,
    );

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.toProjectResponse(project);
  }

  async updateProjectTask(
    projectId: string,
    taskId: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    await this.requireAccessibleProject(projectId, workspace);

    const existingTask = await this.tasksRepo.findByIdInProject(
      taskId,
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      projectId,
    );
    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    const updatePayload: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      updatePayload.name = dto.name;
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

    if (dto.workstreamId !== undefined) {
      const projectContext = await this.resolveTaskProjectContext(
        workspace,
        projectId,
        dto.workstreamId,
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

    const updatedTask = await this.tasksRepo.updateByIdInProject(
      taskId,
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      projectId,
      {
        $set: updatePayload,
      },
    );

    if (!updatedTask) {
      throw new NotFoundException('Task not found');
    }

    return this.toTaskResponse(updatedTask);
  }

  async moveProjectTask(
    projectId: string,
    taskId: string,
    workspace: WorkspaceRequestContext,
    dto: MoveProjectTaskDto,
  ): Promise<TaskResponseDto> {
    const project = await this.requireAccessibleProject(projectId, workspace);
    const task = await this.tasksRepo.findByIdInProject(
      taskId,
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      projectId,
    );
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const targetContext = dto.targetWorkstreamId
      ? await this.resolveTaskProjectContext(
          workspace,
          projectId,
          dto.targetWorkstreamId,
        )
      : {
          projectId: project.id,
          projectName: project.name,
          workstreamId: undefined,
          workstreamName: undefined,
        };

    const tasks = await this.tasksRepo.findByProject(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      projectId,
    );

    const sourceWorkstreamId = task.workstreamId ?? null;
    const targetWorkstreamId = targetContext.workstreamId ?? null;
    const sourceTaskIds = this.sortByWorkstreamOrder(
      tasks.filter(
        (item) =>
          item.id !== task.id &&
          (item.workstreamId ?? null) === sourceWorkstreamId,
      ),
    ).map((item) => item.id);
    const targetTaskIds = this.sortByWorkstreamOrder(
      tasks.filter(
        (item) =>
          item.id !== task.id &&
          (item.workstreamId ?? null) === targetWorkstreamId,
      ),
    ).map((item) => item.id);

    const insertionIndex = Math.min(
      Math.max(dto.targetOrder ?? targetTaskIds.length, 0),
      targetTaskIds.length,
    );
    targetTaskIds.splice(insertionIndex, 0, task.id);

    const movedTask = await this.tasksRepo.updateByIdInProject(
      taskId,
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      projectId,
      {
        $set: {
          projectId: targetContext.projectId,
          projectName: targetContext.projectName,
          workstreamId: targetContext.workstreamId,
          workstreamName: targetContext.workstreamName,
          workstreamOrder: insertionIndex,
        },
      },
    );

    if (!movedTask) {
      throw new NotFoundException('Task not found');
    }

    if (sourceWorkstreamId && sourceTaskIds.length > 0) {
      await this.tasksRepo.reorderWorkstreamTasks(
        {
          workspaceId: workspace.workspaceId,
          userId: workspace.actorUserId,
        },
        projectId,
        sourceWorkstreamId,
        sourceTaskIds,
      );
    }

    if (targetContext.workstreamId) {
      await this.tasksRepo.reorderWorkstreamTasks(
        {
          workspaceId: workspace.workspaceId,
          userId: workspace.actorUserId,
        },
        projectId,
        targetContext.workstreamId,
        targetTaskIds,
      );
    }

    return this.toTaskResponse(movedTask);
  }

  async reorderProjectWorkstreamTasks(
    projectId: string,
    workstreamId: string,
    workspace: WorkspaceRequestContext,
    dto: ReorderProjectTasksDto,
  ): Promise<{ message: string }> {
    const project = await this.requireAccessibleProject(projectId, workspace);
    this.requireProjectWorkstream(project, workstreamId);

    const tasks = await this.tasksRepo.findByProject(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      projectId,
    );
    const existingTaskIds = this.sortByWorkstreamOrder(
      tasks.filter((task) => task.workstreamId === workstreamId),
    ).map((task) => task.id);

    this.assertExactTaskIdSet(existingTaskIds, dto.taskIds, 'workstream');

    await this.tasksRepo.reorderWorkstreamTasks(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      projectId,
      workstreamId,
      dto.taskIds,
    );

    return { message: 'Tasks reordered successfully' };
  }

  async reorderProjectTasks(
    projectId: string,
    workspace: WorkspaceRequestContext,
    dto: ReorderProjectTasksDto,
  ): Promise<{ message: string }> {
    await this.requireAccessibleProject(projectId, workspace);

    const tasks = await this.tasksRepo.findByProject(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      projectId,
    );
    const existingTaskIds = this.sortByProjectOrder(tasks).map(
      (task) => task.id,
    );

    this.assertExactTaskIdSet(existingTaskIds, dto.taskIds, 'project');

    await this.tasksRepo.reorderProjectTasks(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      projectId,
      dto.taskIds,
    );

    return { message: 'Project task order updated successfully' };
  }

  async delete(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<{ message: string }> {
    const deleted = await this.projectsRepo.deleteByIdAndWorkspace(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!deleted) {
      throw new NotFoundException('Project not found');
    }

    return { message: 'Project deleted successfully' };
  }

  async resolveTaskProjectContext(
    workspace: WorkspaceRequestContext,
    projectId: string,
    workstreamId?: string,
  ): Promise<ResolvedTaskProjectContext> {
    const project = await this.projectsRepo.findAccessibleById(projectId, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!workstreamId) {
      return {
        projectId: project.id,
        projectName: project.name,
      };
    }

    const workstream = project.workstreams.find(
      (item) => item._id.toString() === workstreamId && !item.archivedAt,
    );

    if (!workstream) {
      throw new BadRequestException(
        'Workstream does not belong to the project',
      );
    }

    return {
      projectId: project.id,
      projectName: project.name,
      workstreamId: workstream._id.toString(),
      workstreamName: workstream.name,
    };
  }

  private async requireAccessibleProject(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<ProjectDocument> {
    const project = await this.projectsRepo.findAccessibleById(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private requireProjectWorkstream(
    project: ProjectDocument,
    workstreamId: string,
  ) {
    const workstream = project.workstreams.find(
      (item) => item._id.toString() === workstreamId && !item.archivedAt,
    );

    if (!workstream) {
      throw new BadRequestException(
        'Workstream does not belong to the project',
      );
    }

    return workstream;
  }

  private toProjectResponse(project: ProjectDocument): ProjectResponseDto {
    const raw = project.toObject() as ProjectDocument & { _id: Types.ObjectId };

    return new ProjectResponseDto({
      id: raw._id.toString(),
      workspaceId: raw.workspaceId.toString(),
      name: raw.name,
      status: (raw.status as ProjectStatus) ?? ProjectStatus.ACTIVE,
      priority: (raw.priority as ProjectPriority) ?? ProjectPriority.MEDIUM,
      typeLabel: raw.typeLabel,
      durationLabel: raw.durationLabel,
      workstreams: (raw.workstreams ?? [])
        .filter((workstream) => !workstream.archivedAt)
        .sort((left, right) => left.order - right.order)
        .map(
          (workstream) =>
            new ProjectWorkstreamResponseDto({
              id: workstream._id.toString(),
              name: workstream.name,
              order: workstream.order,
            }),
        ),
    });
  }

  private toProjectDetailsResponse(
    project: ProjectDocument,
    tasks: TaskDocument[],
    users: UserDocument[],
  ): ProjectDetailsResponseDto {
    const raw = project.toObject() as ProjectDocument & { _id: Types.ObjectId };
    const activeWorkstreams = (raw.workstreams ?? [])
      .filter((workstream) => !workstream.archivedAt)
      .sort((left, right) => left.order - right.order);
    const visibleTasks = tasks.filter(
      (task) => this.normalizeStatus(task.status) !== TaskStatus.ARCHIVED,
    );
    const workstreamNameById = new Map(
      activeWorkstreams.map((workstream) => [
        workstream._id.toString(),
        workstream.name,
      ]),
    );
    const userMap = new Map(
      users.map((user) => [this.stringifyObjectId(user._id), user]),
    );
    const owner = userMap.get(this.stringifyObjectId(raw.ownerUserId));
    const supportUsers = (raw.memberUserIds ?? [])
      .map((memberId) => userMap.get(this.stringifyObjectId(memberId)))
      .filter((user): user is UserDocument => Boolean(user));
    const sortedProjectTasks = this.sortByProjectOrder(visibleTasks);
    const workstreams = activeWorkstreams.map(
      (workstream) =>
        new ProjectDetailsWorkstreamDto({
          id: workstream._id.toString(),
          name: workstream.name,
          order: workstream.order,
          tasks: this.sortByWorkstreamOrder(
            visibleTasks.filter(
              (task) => task.workstreamId === workstream._id.toString(),
            ),
          ).map((task) => this.toProjectDetailsWorkstreamTask(task)),
        }),
    );
    const projectTasks = sortedProjectTasks.map((task) =>
      this.toProjectDetailsProjectTask(
        task,
        raw.name,
        workstreamNameById.get(task.workstreamId ?? '') ?? task.workstreamName,
      ),
    );
    const scheduledTasks = sortedProjectTasks.filter(
      (task) => task.startDate || task.dueDate,
    );
    const dueDate = this.resolveProjectDueDate(raw, visibleTasks);
    const progressPercent = this.calculateProgressPercent(visibleTasks);

    return new ProjectDetailsResponseDto({
      id: raw._id.toString(),
      workspaceId: raw.workspaceId.toString(),
      name: raw.name,
      status: (raw.status as ProjectStatus) ?? ProjectStatus.ACTIVE,
      priority: (raw.priority as ProjectPriority) ?? ProjectPriority.MEDIUM,
      typeLabel: raw.typeLabel,
      durationLabel: raw.durationLabel,
      description: `Project delivery hub for ${raw.name}. Add richer scope, notes, and assets as those modules come online.`,
      meta: new ProjectDetailsMetaDto({
        priorityLabel: this.capitalize(raw.priority ?? ProjectPriority.MEDIUM),
        locationLabel: 'Workspace',
        sprintLabel:
          raw.typeLabel && raw.durationLabel
            ? `${raw.typeLabel} ${raw.durationLabel}`
            : (raw.durationLabel ?? raw.typeLabel ?? 'Rolling delivery'),
        lastSyncLabel: this.formatDateLabel(raw.updatedAt ?? raw.createdAt),
      }),
      scope: new ProjectDetailsScopeDto({
        inScope:
          activeWorkstreams.length > 0
            ? activeWorkstreams.map((workstream) => workstream.name)
            : ['Track project execution'],
        outOfScope: [
          'Notes and file storage are pending dedicated backend modules',
        ],
      }),
      outcomes:
        visibleTasks.length > 0
          ? [
              `Track ${visibleTasks.length} tasks in one project view`,
              'Keep workstream execution visible',
              'Reduce context switching across project tabs',
            ]
          : ['Track project execution in one place'],
      keyFeatures: new ProjectDetailsKeyFeaturesDto({
        p0:
          activeWorkstreams.length > 0
            ? activeWorkstreams.slice(0, 2).map((workstream) => workstream.name)
            : ['Project task tracking'],
        p1: ['Timeline scheduling'],
        p2: ['Notes and file attachments'],
      }),
      timelineTasks: scheduledTasks.map(
        (task) =>
          new ProjectDetailsTimelineTaskDto({
            id: task.id,
            name: task.name,
            startDate: task.startDate ?? task.dueDate ?? dueDate,
            endDate: task.dueDate ?? task.startDate ?? dueDate,
            status: this.toTimelineStatus(task.status),
          }),
      ),
      workstreams,
      projectTasks,
      time: new ProjectDetailsTimeSummaryDto({
        estimateLabel:
          raw.durationLabel ??
          `${visibleTasks.length} task${visibleTasks.length === 1 ? '' : 's'}`,
        dueDate,
        daysRemainingLabel: this.formatDaysRemainingLabel(dueDate),
        progressPercent,
      }),
      backlog: new ProjectDetailsBacklogSummaryDto({
        statusLabel: this.toBacklogStatusLabel(raw.status),
        groupLabel: activeWorkstreams[0]?.name ?? 'General',
        priorityLabel: this.capitalize(raw.priority ?? ProjectPriority.MEDIUM),
        labelBadge: raw.typeLabel ?? 'Project',
        picUsers: owner
          ? [this.toProjectDetailsUser(owner)]
          : [
              new ProjectDetailsUserDto({
                id: this.stringifyObjectId(raw.ownerUserId),
                name: 'Project owner',
              }),
            ],
        supportUsers: supportUsers
          .slice(0, 5)
          .map((user) => this.toProjectDetailsUser(user)),
      }),
      quickLinks: [],
      files: [],
      notes: [],
    });
  }

  private toProjectDetailsWorkstreamTask(
    task: TaskDocument,
  ): ProjectDetailsWorkstreamTaskDto {
    const duePresentation = this.getDuePresentation(task.dueDate);

    return new ProjectDetailsWorkstreamTaskDto({
      id: task.id,
      name: task.name,
      status: this.normalizeStatus(task.status),
      dueLabel: duePresentation?.label,
      dueTone: duePresentation?.tone,
      assignee: this.toProjectDetailsAssignee(task.assignee),
      startDate: task.startDate,
      dueDate: task.dueDate,
      priority: this.normalizePriority(task.priority),
      tag: task.tag,
      description: task.description,
      order: task.workstreamOrder,
    });
  }

  private toProjectDetailsProjectTask(
    task: TaskDocument,
    projectName: string,
    workstreamName?: string,
  ): ProjectDetailsProjectTaskDto {
    const duePresentation = this.getDuePresentation(task.dueDate);

    return new ProjectDetailsProjectTaskDto({
      id: task.id,
      name: task.name,
      status: this.normalizeStatus(task.status),
      dueLabel: duePresentation?.label,
      dueTone: duePresentation?.tone,
      assignee: this.toProjectDetailsAssignee(task.assignee),
      startDate: task.startDate,
      dueDate: task.dueDate,
      priority: this.normalizePriority(task.priority),
      tag: task.tag,
      description: task.description,
      projectId: task.projectId,
      projectName,
      workstreamId: task.workstreamId ?? '',
      workstreamName: workstreamName ?? task.workstreamName ?? 'General',
      order: task.projectOrder,
    });
  }

  private toTaskResponse(task: TaskDocument): TaskResponseDto {
    return new TaskResponseDto({
      id: task.id,
      workspaceId: task.workspaceId
        ? this.stringifyObjectId(task.workspaceId)
        : '',
      name: task.name,
      status: this.normalizeStatus(task.status),
      projectId: task.projectId,
      projectName: task.projectName,
      workstreamId: task.workstreamId,
      workstreamName: task.workstreamName,
      assignee: task.assignee
        ? new TaskAssigneeResponseDto({
            id: this.stringifyObjectId(task.assignee.id),
            name: task.assignee.name,
            avatarUrl: task.assignee.avatarUrl,
            role: task.assignee.role,
          })
        : undefined,
      startDate: task.startDate,
      priority: this.normalizePriority(task.priority),
      tag: task.tag,
      description: task.description,
      dueDate: task.dueDate,
      completedAt: task.completedAt ?? null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  }

  private toProjectDetailsUser(user: UserDocument): ProjectDetailsUserDto {
    return new ProjectDetailsUserDto({
      id: this.stringifyObjectId(user._id),
      name: user.displayName,
    });
  }

  private toProjectDetailsAssignee(
    assignee?: TaskAssigneeSnapshot | null,
  ): ProjectDetailsUserDto | undefined {
    if (!assignee) {
      return undefined;
    }

    return new ProjectDetailsUserDto({
      id: this.stringifyObjectId(assignee.id),
      name: assignee.name,
      avatarUrl: assignee.avatarUrl,
      role: assignee.role,
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

  private sortByProjectOrder(tasks: TaskDocument[]): TaskDocument[] {
    return [...tasks].sort((left, right) => {
      const leftOrder = left.projectOrder ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.projectOrder ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.createdAt.getTime() - right.createdAt.getTime();
    });
  }

  private sortByWorkstreamOrder(tasks: TaskDocument[]): TaskDocument[] {
    return [...tasks].sort((left, right) => {
      const leftOrder = left.workstreamOrder ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.workstreamOrder ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.createdAt.getTime() - right.createdAt.getTime();
    });
  }

  private resolveProjectDueDate(
    project: ProjectDocument & { _id?: Types.ObjectId },
    tasks: TaskDocument[],
  ): Date {
    const scheduledDates = tasks
      .flatMap((task) => [task.dueDate, task.startDate])
      .filter((value): value is Date => value instanceof Date);

    if (scheduledDates.length === 0) {
      return project.updatedAt ?? project.createdAt ?? new Date();
    }

    return scheduledDates.reduce((latest, current) =>
      current.getTime() > latest.getTime() ? current : latest,
    );
  }

  private calculateProgressPercent(tasks: TaskDocument[]): number {
    const activeTasks = tasks.filter(
      (task) => task.status !== TaskStatus.ARCHIVED,
    );

    if (activeTasks.length === 0) {
      return 0;
    }

    const completedTasks = activeTasks.filter(
      (task) => this.normalizeStatus(task.status) === TaskStatus.DONE,
    ).length;

    return Math.round((completedTasks / activeTasks.length) * 100);
  }

  private getDuePresentation(dueDate?: Date): {
    label: string;
    tone: 'danger' | 'warning' | 'muted';
  } | null {
    if (!dueDate) {
      return null;
    }

    const now = new Date();
    const diffDays = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) {
      return {
        label: `Overdue ${Math.abs(diffDays)}d`,
        tone: 'danger',
      };
    }

    if (diffDays === 0) {
      return {
        label: 'Today',
        tone: 'warning',
      };
    }

    if (diffDays === 1) {
      return {
        label: 'Tomorrow',
        tone: 'warning',
      };
    }

    return {
      label: this.formatDateLabel(dueDate),
      tone: 'muted',
    };
  }

  private formatDateLabel(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  private formatDaysRemainingLabel(date: Date): string {
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) {
      return `${Math.abs(diffDays)}d overdue`;
    }

    if (diffDays === 0) {
      return 'Today';
    }

    return `${diffDays}d left`;
  }

  private toBacklogStatusLabel(
    status: ProjectStatus | string | undefined,
  ): 'Active' | 'Backlog' | 'Planned' | 'Completed' | 'Cancelled' {
    switch (status) {
      case ProjectStatus.BACKLOG:
        return 'Backlog';
      case ProjectStatus.PLANNED:
        return 'Planned';
      case ProjectStatus.COMPLETED:
        return 'Completed';
      case ProjectStatus.CANCELLED:
        return 'Cancelled';
      default:
        return 'Active';
    }
  }

  private toTimelineStatus(
    status?: TaskStatus | string,
  ): 'planned' | 'in-progress' | 'done' {
    const normalized = this.normalizeStatus(status);

    if (normalized === TaskStatus.DONE) {
      return 'done';
    }

    if (normalized === TaskStatus.IN_PROGRESS) {
      return 'in-progress';
    }

    return 'planned';
  }

  private assertExactTaskIdSet(
    existingTaskIds: string[],
    candidateTaskIds: string[],
    scopeLabel: string,
  ) {
    if (existingTaskIds.length !== candidateTaskIds.length) {
      throw new BadRequestException(
        `Task reorder payload must include every ${scopeLabel} task exactly once`,
      );
    }

    const existing = new Set(existingTaskIds);
    const candidate = new Set(candidateTaskIds);

    if (existing.size !== candidate.size) {
      throw new BadRequestException('Task reorder payload contains duplicates');
    }

    for (const taskId of existing) {
      if (!candidate.has(taskId)) {
        throw new BadRequestException(
          `Task reorder payload must include every ${scopeLabel} task exactly once`,
        );
      }
    }
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

  private capitalize(value: string): string {
    if (!value) {
      return value;
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private stringifyObjectId(value?: Types.ObjectId | string | null): string {
    if (!value) {
      return '';
    }

    return value instanceof Types.ObjectId ? value.toString() : value;
  }
}
