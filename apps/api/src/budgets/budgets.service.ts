import { Injectable } from '@nestjs/common';
import { BudgetsRepository } from './budgets.repository';
import { BudgetDocument } from './schemas/budget.schema';
import { CreateBudgetDto } from './dto/create-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private readonly budgetsRepo: BudgetsRepository) {}

  // TODO: Implement service methods
  // async findById(id: string): Promise<BudgetDocument>
  // async findByUserId(userId: string): Promise<BudgetDocument[]>
  // async create(dto: CreateBudgetDto, userId: string): Promise<BudgetDocument>
  // async update(id: string, dto: Partial<CreateBudgetDto>): Promise<BudgetDocument>
  // async delete(id: string): Promise<void>
}
