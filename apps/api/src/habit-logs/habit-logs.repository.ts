import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HabitLog, HabitLogDocument } from './schemas/habit-log.schema';
import { CreateHabitLogDto } from './dto/create-habit-log.dto';

/**
 * Encapsulates all Mongoose queries for HabitLogs (arch-use-repository-pattern).
 */
@Injectable()
export class HabitLogsRepository {
  constructor(
    @InjectModel(HabitLog.name) private readonly habitLogModel: Model<HabitLogDocument>,
  ) {}

  // TODO: Implement repository methods
  // async findById(id: string | Types.ObjectId): Promise<HabitLogDocument | null>
  // async findByHabitId(habitId: string | Types.ObjectId): Promise<HabitLogDocument[]>
  // async findByUserId(userId: string | Types.ObjectId): Promise<HabitLogDocument[]>
  // async create(dto: CreateHabitLogDto, userId: string): Promise<HabitLogDocument>
  // async update(id: string, dto: Partial<CreateHabitLogDto>): Promise<HabitLogDocument | null>
  // async delete(id: string): Promise<void>
}
