import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { BudgetsRepository } from './budgets.repository';
import { BudgetDocument } from './schemas/budget.schema';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { BudgetResponseDto } from './dto/budget-response.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { QueryBudgetDto } from './dto/query-budget.dto';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';

@Injectable()
export class BudgetsService {
  constructor(private readonly budgetsRepo: BudgetsRepository) {}

  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateBudgetDto,
  ): Promise<BudgetResponseDto> {
    const budget = await this.budgetsRepo.create(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      dto,
    );
    return this.toBudgetResponse(budget);
  }

  async findByIdAndUser(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<BudgetResponseDto> {
    const budget = await this.budgetsRepo.findByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    return this.toBudgetResponse(budget);
  }

  async findMany(workspace: WorkspaceRequestContext, query: QueryBudgetDto) {
    const { items, total } =
      await this.budgetsRepo.findWithPaginationAndFilters(
        { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
        query,
      );

    return {
      items: items.map((budget) => this.toBudgetResponse(budget)),
      total,
    };
  }

  async update(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateBudgetDto,
  ): Promise<BudgetResponseDto> {
    const budget = await this.budgetsRepo.updateByIdAndUser(
      id,
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      dto,
    );
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    return this.toBudgetResponse(budget);
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
    const budgets = await this.budgetsRepo.getBudgetSummary(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      query,
    );

    return budgets.map((budget) => this.toBudgetResponse(budget));
  }

  private toBudgetResponse(
    budget: BudgetDocument | Record<string, any>,
  ): BudgetResponseDto {
    const raw: Record<string, any> =
      typeof (budget as BudgetDocument).toObject === 'function'
        ? ((budget as BudgetDocument).toObject() as Record<string, any>)
        : (budget as Record<string, any>);

    return new BudgetResponseDto({
      id: this.toIdString(raw._id ?? raw.id) ?? '',
      workspaceId: this.toIdString(raw.workspaceId),
      userId: this.toIdString(raw.userId) ?? '',
      name: raw.name,
      amount: Number(raw.amount ?? 0),
      category: raw.category,
      period: raw.period,
      startDate: raw.startDate ?? null,
      endDate: raw.endDate ?? null,
      currency: raw.currency,
      isActive: Boolean(raw.isActive),
      actualSpending:
        raw.actualSpending === undefined
          ? undefined
          : Number(raw.actualSpending),
      remainingAmount:
        raw.remainingAmount === undefined
          ? undefined
          : Number(raw.remainingAmount),
      percentUsed:
        raw.percentUsed === undefined ? undefined : Number(raw.percentUsed),
      isOverBudget:
        raw.isOverBudget === undefined ? undefined : Boolean(raw.isOverBudget),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  private toIdString(
    value: Types.ObjectId | string | null | undefined,
  ): string | null {
    if (!value) return null;
    return typeof value === 'string' ? value : value.toString();
  }
}
