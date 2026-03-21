import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Goal, GoalDocument } from './schemas/goal.schema';
import { CreateGoalDto } from './dto/create-goal.dto';

/**
 * Encapsulates all Mongoose queries for Goals (arch-use-repository-pattern).
 */
@Injectable()
export class GoalsRepository {
  constructor(
    @InjectModel(Goal.name) private readonly goalModel: Model<GoalDocument>,
  ) {}

  // TODO: Implement repository methods
  // async findById(id: string | Types.ObjectId): Promise<GoalDocument | null>
  // async findByUserId(userId: string | Types.ObjectId): Promise<GoalDocument[]>
  // async create(dto: CreateGoalDto, userId: string): Promise<GoalDocument>
  // async update(id: string, dto: Partial<CreateGoalDto>): Promise<GoalDocument | null>
  // async delete(id: string): Promise<void>
}
