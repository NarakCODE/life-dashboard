import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HabitLog, HabitLogDocument } from './schemas/habit-log.schema';
import { CreateHabitLogDto } from './dto/create-habit-log.dto';
import { QueryHabitLogDto } from './dto/query-habit-log.dto';
import { UpdateHabitLogDto } from './dto/update-habit-log.dto';

/**
 * Encapsulates all Mongoose queries for HabitLogs (arch-use-repository-pattern).
 */
@Injectable()
export class HabitLogsRepository {
  constructor(
    @InjectModel(HabitLog.name)
    private readonly habitLogModel: Model<HabitLogDocument>,
  ) {}

  async create(
    userId: string | Types.ObjectId,
    dto: CreateHabitLogDto,
  ): Promise<HabitLogDocument> {
    const createdHabitLog = new this.habitLogModel({
      ...dto,
      habitId: new Types.ObjectId(dto.habitId),
      userId: new Types.ObjectId(userId.toString()),
    });

    return createdHabitLog.save();
  }

  async findByIdAndUser(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<HabitLogDocument | null> {
    return this.habitLogModel
      .findOne({
        _id: new Types.ObjectId(id.toString()),
        userId: new Types.ObjectId(userId.toString()),
      })
      .exec();
  }

  async findByHabitId(
    habitId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    query: QueryHabitLogDto,
  ): Promise<{ items: HabitLogDocument[]; total: number }> {
    const filter = this.buildFilter(userId, query, habitId);
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.habitLogModel
        .find(filter)
        .sort(this.buildSort(query))
        .skip(skip)
        .limit(limit)
        .exec(),
      this.habitLogModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async findByUserId(
    userId: string | Types.ObjectId,
    query: QueryHabitLogDto,
  ): Promise<{ items: HabitLogDocument[]; total: number }> {
    const filter = this.buildFilter(userId, query);
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.habitLogModel
        .find(filter)
        .sort(this.buildSort(query))
        .skip(skip)
        .limit(limit)
        .exec(),
      this.habitLogModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async findByDateRange(
    userId: string | Types.ObjectId,
    startDate: Date,
    endDate: Date,
  ): Promise<HabitLogDocument[]> {
    return this.habitLogModel
      .find({
        userId: new Types.ObjectId(userId.toString()),
        loggedDate: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ loggedDate: 1 })
      .exec();
  }

  async updateByIdAndUser(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    updateData: UpdateHabitLogDto,
  ): Promise<HabitLogDocument | null> {
    return this.habitLogModel
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
    const result = await this.habitLogModel
      .deleteOne({
        _id: new Types.ObjectId(id.toString()),
        userId: new Types.ObjectId(userId.toString()),
      })
      .exec();

    return result.deletedCount > 0;
  }

  async countByHabitAndDateRange(
    habitId: string | Types.ObjectId,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return this.habitLogModel
      .countDocuments({
        habitId: new Types.ObjectId(habitId.toString()),
        loggedDate: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .exec();
  }

  private buildFilter(
    userId: string | Types.ObjectId,
    query: QueryHabitLogDto,
    habitId?: string | Types.ObjectId,
  ) {
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId.toString()),
    };

    if (habitId) {
      filter.habitId = new Types.ObjectId(habitId.toString());
    } else if (query.habitId) {
      filter.habitId = new Types.ObjectId(query.habitId);
    }

    if (query.startDate || query.endDate) {
      filter.loggedDate = {};

      if (query.startDate) {
        (filter.loggedDate as Record<string, unknown>).$gte = query.startDate;
      }

      if (query.endDate) {
        (filter.loggedDate as Record<string, unknown>).$lte = query.endDate;
      }
    }

    if (query.search) {
      filter.notes = { $regex: query.search, $options: 'i' };
    }

    return filter;
  }

  private buildSort(query: QueryHabitLogDto): Record<string, 1 | -1> {
    if (query.sortBy) {
      const sort: Record<string, 1 | -1> = {};
      sort[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;
      return sort;
    }

    return { loggedDate: -1 };
  }
}
