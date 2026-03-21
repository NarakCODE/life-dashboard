import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionsRepository } from './transactions.repository';
import { TransactionDocument } from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly transactionsRepo: TransactionsRepository) {}

  async create(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionDocument> {
    return this.transactionsRepo.create(userId, dto);
  }

  async findByIdAndUser(
    id: string,
    userId: string,
  ): Promise<TransactionDocument> {
    const transaction = await this.transactionsRepo.findByIdAndUser(id, userId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async findMany(userId: string, query: QueryTransactionDto) {
    return this.transactionsRepo.findWithPaginationAndFilters(userId, query);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionDocument> {
    const transaction = await this.transactionsRepo.updateByIdAndUser(
      id,
      userId,
      dto,
    );

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async delete(id: string, userId: string): Promise<void> {
    const deleted = await this.transactionsRepo.deleteByIdAndUser(id, userId);
    if (!deleted) {
      throw new NotFoundException('Transaction not found');
    }
  }

  async getSummary(userId: string, query: QueryTransactionDto) {
    return this.transactionsRepo.getSummaryByDateRange(userId, query);
  }
}
