import { Injectable, NotFoundException } from '@nestjs/common';
import { BudgetsRepository } from './budgets.repository';
import { BudgetDocument } from './schemas/budget.schema';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { QueryBudgetDto } from './dto/query-budget.dto';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';

@Injectable()
export class BudgetsService {
  constructor(private readonly budgetsRepo: BudgetsRepository) {}

  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateBudgetDto,
  ): Promise<BudgetDocument> {
    return this.budgetsRepo.create(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      dto,
    );
  }

  async findByIdAndUser(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<BudgetDocument> {
    const budget = await this.budgetsRepo.findByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    return budget;
  }

  async findMany(workspace: WorkspaceRequestContext, query: QueryBudgetDto) {
    return this.budgetsRepo.findWithPaginationAndFilters(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      query,
    );
  }

  async update(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateBudgetDto,
  ): Promise<BudgetDocument> {
    const budget = await this.budgetsRepo.updateByIdAndUser(
      id,
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      dto,
    );
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    return budget;
  }

  async delete(id: string, workspace: WorkspaceRequestContext): Promise<void> {
    const deleted = await this.budgetsRepo.deleteByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!deleted) {
      throw new NotFoundException('Budget not found');
    }
  }

  async getBudgetSummary(
    workspace: WorkspaceRequestContext,
    query: QueryBudgetDto,
  ) {
    return this.budgetsRepo.getBudgetSummary(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      query,
    );
  }
}
