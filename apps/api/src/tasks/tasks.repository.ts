import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument, TaskStatus } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';

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
    dto: CreateTaskDto,
  ): Promise<TaskDocument> {
    const createdTask = new this.taskModel({
      ...dto,
      userId: new Types.ObjectId(userId.toString()),
    });
    return createdTask.save();
  }

  async findByIdAndUser(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<TaskDocument | null> {
    return this.taskModel
      .findOne({
        _id: new Types.ObjectId(id.toString()),
        userId: new Types.ObjectId(userId.toString()),
      })
      .exec();
  }

  async findWithPaginationAndFilters(
    userId: string | Types.ObjectId,
    query: any,
  ): Promise<{ items: TaskDocument[]; total: number }> {
    const filter: any = { userId: new Types.ObjectId(userId.toString()) };

    if (query.status) filter.status = query.status;
    if (query.priority !== undefined) filter.priority = query.priority;
    if (query.tags && query.tags.length > 0) {
      filter['tags.name'] = { $in: query.tags };
    }

    if (query.dueDateFrom || query.dueDateTo) {
      filter.dueDate = {};
      if (query.dueDateFrom) filter.dueDate.$gte = query.dueDateFrom;
      if (query.dueDateTo) filter.dueDate.$lte = query.dueDateTo;
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    const sortObj: any = {};
    if (query.sortBy) {
      sortObj[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObj.createdAt = -1; // Default sort
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.taskModel.find(filter).sort(sortObj).skip(skip).limit(limit).exec(),
      this.taskModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async updateByIdAndUser(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    updateData: any,
  ): Promise<TaskDocument | null> {
    return this.taskModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id.toString()),
          userId: new Types.ObjectId(userId.toString()),
        },
        { $set: updateData },
        { new: true },
      )
      .exec();
  }

  async deleteByIdAndUser(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<boolean> {
    const result = await this.taskModel
      .deleteOne({
        _id: new Types.ObjectId(id.toString()),
        userId: new Types.ObjectId(userId.toString()),
      })
      .exec();

    return result.deletedCount > 0;
  }

  async getTaskOverview(userId: string | Types.ObjectId): Promise<any> {
    const userObjectId = new Types.ObjectId(userId.toString());
    const now = new Date();

    // Create an aggregation to get counts in a single query
    const result = await this.taskModel
      .aggregate([
        { $match: { userId: userObjectId } },
        {
          $facet: {
            statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            overdue: [
              {
                $match: {
                  status: { $nin: [TaskStatus.DONE, TaskStatus.ARCHIVED] },
                  dueDate: { $lt: now },
                },
              },
              { $count: 'count' },
            ],
            upcoming: [
              {
                $match: {
                  status: { $nin: [TaskStatus.DONE, TaskStatus.ARCHIVED] },
                  dueDate: { $gte: now },
                },
              },
              { $count: 'count' },
            ],
            completedSummary: [
              {
                $match: {
                  status: TaskStatus.DONE,
                },
              },
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

    const data = result[0];

    // Format the result nicely
    const formatCount = (arr: any[]) => (arr.length > 0 ? arr[0].count : 0);

    const overview = {
      totalTasks: formatCount(data.total),
      countsByStatus: {
        [TaskStatus.TODO]: 0,
        [TaskStatus.IN_PROGRESS]: 0,
        [TaskStatus.DONE]: 0,
        [TaskStatus.ARCHIVED]: 0,
      },
      overdueCount: formatCount(data.overdue),
      upcomingCount: formatCount(data.upcoming),
      completedSummary:
        data.completedSummary.length > 0
          ? {
              total: data.completedSummary[0].totalCompleted,
              latest: data.completedSummary[0].latestCompletion,
            }
          : { total: 0, latest: null },
    };

    // Populate exact status counts
    if (data.statusCounts) {
      data.statusCounts.forEach((s: any) => {
        if (s._id in overview.countsByStatus) {
          overview.countsByStatus[s._id as TaskStatus] = s.count;
        }
      });
    }

    return overview;
  }
}
