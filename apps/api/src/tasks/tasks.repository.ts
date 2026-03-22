import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types, UpdateQuery } from 'mongoose';
import { QueryTaskDto } from './dto/query-task.dto';
import {
  Task,
  TaskAssigneeSnapshot,
  TaskDocument,
  TaskPriority,
  TaskStatus,
} from './schemas/task.schema';

export type TaskPersistenceInput = {
  name: string;
  projectId: string;
  projectName: string;
  workstreamId?: string;
  workstreamName?: string;
  assignee?: TaskAssigneeSnapshot | null;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  tag?: string;
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date | null;
};

export type TaskFilterCounts = {
  status: Record<string, number>;
  priority: Record<string, number>;
  tags: Record<string, number>;
  members: Record<string, number>;
};

export type TaskListResult = {
  items: TaskDocument[];
  total: number;
  filterCounts: TaskFilterCounts;
};

type TaskQueryFilter = Record<string, any>;

/**
 * Encapsulates all Mongoose queries for Tasks (arch-use-repository-pattern).
 */
@Injectable()
export class TasksRepository {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
  ) {}

  async create(
    userId: string | Types.ObjectId,
    input: TaskPersistenceInput,
  ): Promise<TaskDocument> {
    const createdTask = new this.taskModel({
      ...input,
      userId: this.toObjectId(userId),
    });

    return createdTask.save();
  }

  async findByIdAndUser(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<TaskDocument | null> {
    const taskId = this.toObjectIdOrNull(id);
    if (!taskId) {
      return null;
    }

    return this.taskModel
      .findOne({
        _id: taskId,
        userId: this.toObjectId(userId),
      })
      .exec();
  }

  async findWithPaginationAndFilters(
    userId: string | Types.ObjectId,
    query: QueryTaskDto,
  ): Promise<TaskListResult> {
    const scopedFilter = this.buildScopedFilter(userId, query);
    const taskFilter = this.applyTaskFilters(scopedFilter, query);
    const sort = this.buildSort(query);
    const limit = query.limit ?? 20;
    const skip = query.skip;

    const [items, total, filterCounts] = await Promise.all([
      this.taskModel.find(taskFilter).sort(sort).skip(skip).limit(limit).exec(),
      this.taskModel.countDocuments(taskFilter).exec(),
      this.getFilterCounts(scopedFilter),
    ]);

    return {
      items,
      total,
      filterCounts,
    };
  }

  async updateByIdAndUser(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    updateData: UpdateQuery<TaskDocument>,
  ): Promise<TaskDocument | null> {
    const taskId = this.toObjectIdOrNull(id);
    if (!taskId) {
      return null;
    }

    return this.taskModel
      .findOneAndUpdate(
        {
          _id: taskId,
          userId: this.toObjectId(userId),
        },
        updateData,
        { new: true },
      )
      .exec();
  }

  async deleteByIdAndUser(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<boolean> {
    const taskId = this.toObjectIdOrNull(id);
    if (!taskId) {
      return false;
    }

    const result = await this.taskModel
      .deleteOne({
        _id: taskId,
        userId: this.toObjectId(userId),
      })
      .exec();

    return result.deletedCount > 0;
  }

  async getTaskOverview(userId: string | Types.ObjectId): Promise<{
    totalTasks: number;
    countsByStatus: {
      todo: number;
      in_progress: number;
      done: number;
      archived: number;
    };
    overdueCount: number;
    upcomingCount: number;
    completedSummary: {
      total: number;
      latest: Date | null;
    };
  }> {
    const userObjectId = this.toObjectId(userId);
    const now = new Date();

    const result = await this.taskModel
      .aggregate([
        { $match: { userId: userObjectId } },
        {
          $addFields: {
            schedulingDate: {
              $ifNull: ['$dueDate', '$startDate'],
            },
          },
        },
        {
          $facet: {
            statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            overdue: [
              {
                $match: {
                  status: { $nin: [TaskStatus.DONE, TaskStatus.ARCHIVED] },
                  schedulingDate: { $lt: now },
                },
              },
              { $count: 'count' },
            ],
            upcoming: [
              {
                $match: {
                  status: { $nin: [TaskStatus.DONE, TaskStatus.ARCHIVED] },
                  schedulingDate: { $gte: now },
                },
              },
              { $count: 'count' },
            ],
            completedSummary: [
              { $match: { status: TaskStatus.DONE } },
              {
                $group: {
                  _id: null,
                  totalCompleted: { $sum: 1 },
                  latestCompletion: { $max: '$completedAt' },
                },
              },
            ],
            total: [{ $count: 'count' }],
          },
        },
      ])
      .exec();

    const data = result[0] ?? {};
    const formatCount = (arr: Array<{ count: number }>) =>
      arr.length > 0 ? arr[0].count : 0;

    const overview = {
      totalTasks: formatCount(data.total ?? []),
      countsByStatus: {
        todo: 0,
        in_progress: 0,
        done: 0,
        archived: 0,
      },
      overdueCount: formatCount(data.overdue ?? []),
      upcomingCount: formatCount(data.upcoming ?? []),
      completedSummary:
        data.completedSummary?.length > 0
          ? {
              total: data.completedSummary[0].totalCompleted,
              latest: data.completedSummary[0].latestCompletion ?? null,
            }
          : { total: 0, latest: null },
    };

    for (const statusCount of data.statusCounts ?? []) {
      switch (statusCount._id) {
        case TaskStatus.TODO:
          overview.countsByStatus.todo = statusCount.count;
          break;
        case TaskStatus.IN_PROGRESS:
        case 'in_progress':
          overview.countsByStatus.in_progress = statusCount.count;
          break;
        case TaskStatus.DONE:
          overview.countsByStatus.done = statusCount.count;
          break;
        case TaskStatus.ARCHIVED:
          overview.countsByStatus.archived = statusCount.count;
          break;
        default:
          break;
      }
    }

    return overview;
  }

  private buildScopedFilter(
    userId: string | Types.ObjectId,
    query: QueryTaskDto,
  ): TaskQueryFilter {
    const filter: TaskQueryFilter = {
      userId: this.toObjectId(userId),
    };

    if (query.projectId) {
      filter.projectId = query.projectId;
    }

    if (query.startDateFrom || query.startDateTo) {
      filter.startDate = {};

      if (query.startDateFrom) {
        filter.startDate.$gte = query.startDateFrom;
      }

      if (query.startDateTo) {
        filter.startDate.$lte = query.startDateTo;
      }
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { projectName: { $regex: query.search, $options: 'i' } },
        { workstreamName: { $regex: query.search, $options: 'i' } },
      ];
    }

    return filter;
  }

  private applyTaskFilters(
    scopedFilter: TaskQueryFilter,
    query: QueryTaskDto,
  ): TaskQueryFilter {
    const filter: TaskQueryFilter = { ...scopedFilter };

    if (query.status?.length) {
      filter.status = { $in: query.status };
    }

    if (query.priority) {
      filter.priority = query.priority;
    }

    if (query.tags?.length) {
      filter.tag = { $in: query.tags };
    }

    if (query.assigneeIds?.length) {
      filter['assignee.id'] = {
        $in: query.assigneeIds.map((assigneeId) => this.toObjectId(assigneeId)),
      };
    }

    return filter;
  }

  private async getFilterCounts(
    scopedFilter: TaskQueryFilter,
  ): Promise<TaskFilterCounts> {
    const [result] = await this.taskModel
      .aggregate([
        { $match: scopedFilter },
        {
          $facet: {
            status: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            priority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
            tags: [
              {
                $match: {
                  tag: { $nin: [null, ''] },
                },
              },
              { $group: { _id: '$tag', count: { $sum: 1 } } },
            ],
            members: [
              {
                $group: {
                  _id: {
                    $ifNull: ['$assignee.name', 'unassigned'],
                  },
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ])
      .exec();

    return {
      status: this.toCountsRecord(result?.status ?? [], (key) =>
        this.normalizeStatusValue(key),
      ),
      priority: this.toCountsRecord(result?.priority ?? [], (key) =>
        this.normalizePriorityValue(key),
      ),
      tags: this.toCountsRecord(result?.tags ?? []),
      members: this.toCountsRecord(result?.members ?? []),
    };
  }

  private toCountsRecord(
    items: Array<{ _id: string | null; count: number }>,
    normalizeKey?: (value: string) => string,
  ): Record<string, number> {
    return items.reduce<Record<string, number>>((acc, item) => {
      if (!item._id) {
        return acc;
      }

      const key = normalizeKey ? normalizeKey(item._id) : item._id;
      acc[key] = item.count;
      return acc;
    }, {});
  }

  private buildSort(query: QueryTaskDto): Record<string, SortOrder> {
    const sortFieldMap: Record<string, string> = {
      name: 'name',
      status: 'status',
      priority: 'priority',
      startDate: 'startDate',
      dueDate: 'dueDate',
      projectName: 'projectName',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    };

    const sortField = query.sortBy
      ? (sortFieldMap[query.sortBy] ?? 'createdAt')
      : 'createdAt';
    const sortOrder: SortOrder = query.sortOrder === 'asc' ? 1 : -1;

    return sortField === 'createdAt'
      ? { createdAt: sortOrder }
      : { [sortField]: sortOrder, createdAt: -1 };
  }

  private normalizeStatusValue(value: string): string {
    if (value === 'in_progress') {
      return TaskStatus.IN_PROGRESS;
    }

    return value;
  }

  private normalizePriorityValue(value: string): string {
    if (!Number.isNaN(Number(value))) {
      switch (Number(value)) {
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

    return value;
  }

  private toObjectId(value: string | Types.ObjectId): Types.ObjectId {
    return value instanceof Types.ObjectId ? value : new Types.ObjectId(value);
  }

  private toObjectIdOrNull(
    value: string | Types.ObjectId,
  ): Types.ObjectId | null {
    if (value instanceof Types.ObjectId) {
      return value;
    }

    if (!Types.ObjectId.isValid(value)) {
      return null;
    }

    return new Types.ObjectId(value);
  }
}
