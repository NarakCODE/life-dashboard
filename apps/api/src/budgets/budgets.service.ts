import { Injectable, NotFoundException } from '@nestjs/common';
import { BudgetsRepository } from './budgets.repository';
import { BudgetDocument } from './schemas/budget.schema';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { QueryBudgetDto } from './dto/query-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private readonly budgetsRepo: BudgetsRepository) {}

  async create(userId: string, dto: CreateBudgetDto): Promise<BudgetDocument> {
    return this.budgetsRepo.create(userId, dto);
  }

  async findByIdAndUser(id: string, userId: string): Promise<BudgetDocument> {
    const budget = await this.budgetsRepo.findByIdAndUser(id, userId);
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    return budget;
  }

  async findMany(userId: string, query: QueryBudgetDto) {
    return this.budgetsRepo.findWithPaginationAndFilters(userId, query);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateBudgetDto,
  ): Promise<BudgetDocument> {
    const budget = await this.budgetsRepo.updateByIdAndUser(id, userId, dto);
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    return budget;
  }

  async delete(id: string, userId: string): Promise<void> {
    const deleted = await this.budgetsRepo.deleteByIdAndUser(id, userId);
    if (!deleted) {
      throw new NotFoundException('Budget not found');
    }
  }

  async getBudgetSummary(userId: string, query: QueryBudgetDto) {
    return this.budgetsRepo.getBudgetSummary(userId, query);
  }
}
