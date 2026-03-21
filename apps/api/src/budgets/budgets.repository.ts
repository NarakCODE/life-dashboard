import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Budget, BudgetDocument } from './schemas/budget.schema';
import { CreateBudgetDto } from './dto/create-budget.dto';

/**
 * Encapsulates all Mongoose queries for Budgets (arch-use-repository-pattern).
 */
@Injectable()
export class BudgetsRepository {
  constructor(
    @InjectModel(Budget.name)
    private readonly budgetModel: Model<BudgetDocument>,
  ) {}

  // TODO: Implement repository methods
  // async findById(id: string | Types.ObjectId): Promise<BudgetDocument | null>
  // async findByUserId(userId: string | Types.ObjectId): Promise<BudgetDocument[]>
  // async create(dto: CreateBudgetDto, userId: string): Promise<BudgetDocument>
  // async update(id: string, dto: Partial<CreateBudgetDto>): Promise<BudgetDocument | null>
  // async delete(id: string): Promise<void>
}
