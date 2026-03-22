import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionsRepository } from './transactions.repository';
import { TransactionDocument } from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';

@Injectable()
export class TransactionsService {
  constructor(private readonly transactionsRepo: TransactionsRepository) {}

  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateTransactionDto,
  ): Promise<TransactionDocument> {
    return this.transactionsRepo.create(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      dto,
    );
  }

  async findByIdAndUser(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<TransactionDocument> {
    const transaction = await this.transactionsRepo.findByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async findMany(
    workspace: WorkspaceRequestContext,
    query: QueryTransactionDto,
  ) {
    return this.transactionsRepo.findWithPaginationAndFilters(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      query,
    );
  }

  async update(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateTransactionDto,
  ): Promise<TransactionDocument> {
    const transaction = await this.transactionsRepo.updateByIdAndUser(
      id,
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      dto,
    );

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async delete(id: string, workspace: WorkspaceRequestContext): Promise<void> {
    const deleted = await this.transactionsRepo.deleteByIdAndUser(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!deleted) {
      throw new NotFoundException('Transaction not found');
    }
  }

  async getSummary(
    workspace: WorkspaceRequestContext,
    query: QueryTransactionDto,
  ) {
    return this.transactionsRepo.getSummaryByDateRange(
      { workspaceId: workspace.workspaceId, userId: workspace.actorUserId },
      query,
    );
  }
}
