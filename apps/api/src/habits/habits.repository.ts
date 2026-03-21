import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Habit, HabitDocument } from './schemas/habit.schema';
import { CreateHabitDto } from './dto/create-habit.dto';

/**
 * Encapsulates all Mongoose queries for Habits (arch-use-repository-pattern).
 */
@Injectable()
export class HabitsRepository {
  constructor(
    @InjectModel(Habit.name) private readonly habitModel: Model<HabitDocument>,
  ) {}

  async create(
    userId: string | Types.ObjectId,
    dto: CreateHabitDto,
  ): Promise<HabitDocument> {
    const createdHabit = new this.habitModel({
      ...dto,
      userId: new Types.ObjectId(userId.toString()),
    });
    return createdHabit.save();
  }

  async findByIdAndUser(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<HabitDocument | null> {
    return this.habitModel
      .findOne({
        _id: new Types.ObjectId(id.toString()),
        userId: new Types.ObjectId(userId.toString()),
      })
      .exec();
  }

  async findWithPaginationAndFilters(
    userId: string | Types.ObjectId,
    query: any,
  ): Promise<{ items: HabitDocument[]; total: number }> {
    const filter: any = { userId: new Types.ObjectId(userId.toString()) };

    if (query.status) filter.status = query.status;
    if (query.frequency) filter.frequency = query.frequency;

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
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
      this.habitModel.find(filter).sort(sortObj).skip(skip).limit(limit).exec(),
      this.habitModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async updateByIdAndUser(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    updateData: any,
  ): Promise<HabitDocument | null> {
    return this.habitModel
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

  async archiveByIdAndUser(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<HabitDocument | null> {
    return this.habitModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id.toString()),
          userId: new Types.ObjectId(userId.toString()),
        },
        { $set: { status: 'archived', archivedAt: new Date() } },
        { new: true },
      )
      .exec();
  }

  async deleteByIdAndUser(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<boolean> {
    const result = await this.habitModel
      .deleteOne({
        _id: new Types.ObjectId(id.toString()),
        userId: new Types.ObjectId(userId.toString()),
      })
      .exec();

    return result.deletedCount > 0;
  }
}
