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

  // TODO: Implement repository methods
  // async findById(id: string | Types.ObjectId): Promise<HabitDocument | null>
  // async findByUserId(userId: string | Types.ObjectId): Promise<HabitDocument[]>
  // async create(dto: CreateHabitDto, userId: string): Promise<HabitDocument>
  // async update(id: string, dto: Partial<CreateHabitDto>): Promise<HabitDocument | null>
  // async delete(id: string): Promise<void>
}
