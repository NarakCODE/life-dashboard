import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';

/**
 * Encapsulates all Mongoose queries for Transactions (arch-use-repository-pattern).
 */
@Injectable()
export class TransactionsRepository {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  // TODO: Implement repository methods
  // async findById(id: string | Types.ObjectId): Promise<TransactionDocument | null>
  // async findByUserId(userId: string | Types.ObjectId): Promise<TransactionDocument[]>
  // async create(dto: CreateTransactionDto, userId: string): Promise<TransactionDocument>
  // async update(id: string, dto: Partial<CreateTransactionDto>): Promise<TransactionDocument | null>
  // async delete(id: string): Promise<void>
}
