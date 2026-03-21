import { Injectable } from '@nestjs/common';
import { TransactionsRepository } from './transactions.repository';
import { TransactionDocument } from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly transactionsRepo: TransactionsRepository) {}

  // TODO: Implement service methods
  // async findById(id: string): Promise<TransactionDocument>
  // async findByUserId(userId: string): Promise<TransactionDocument[]>
  // async create(dto: CreateTransactionDto, userId: string): Promise<TransactionDocument>
  // async update(id: string, dto: Partial<CreateTransactionDto>): Promise<TransactionDocument>
  // async delete(id: string): Promise<void>
}
