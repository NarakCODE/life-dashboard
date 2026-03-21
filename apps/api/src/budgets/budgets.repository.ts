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

  async create(
    userId: string | Types.ObjectId,
    dto: CreateBudgetDto,
  ): Promise<BudgetDocument> {
    const createdBudget = new this.budgetModel({
      ...dto,
      userId: new Types.ObjectId(userId.toString()),
    });
    return createdBudget.save();
  }

  async findByIdAndUser(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<BudgetDocument | null> {
    return this.budgetModel
      .findOne({
        _id: new Types.ObjectId(id.toString()),
        userId: new Types.ObjectId(userId.toString()),
      })
      .exec();
  }

  async findWithPaginationAndFilters(
    userId: string | Types.ObjectId,
    query: any,
  ): Promise<{ items: BudgetDocument[]; total: number }> {
    const filter: any = { userId: new Types.ObjectId(userId.toString()) };

    if (query.category) filter.category = query.category;
    if (query.period) filter.period = query.period;
    if (query.isActive !== undefined) filter.isActive = query.isActive;

    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }

    const sortObj: any = {};
    if (query.sortBy) {
      sortObj[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObj.createdAt = -1; // Default sort
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.budgetModel
        .find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.budgetModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async updateByIdAndUser(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    updateData: any,
  ): Promise<BudgetDocument | null> {
    return this.budgetModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id.toString()),
          userId: new Types.ObjectId(userId.toString()),
        },
        { $set: updateData },
        { new: true },
      )
      .exec();
  }

  async deleteByIdAndUser(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<boolean> {
    const result = await this.budgetModel
      .deleteOne({
        _id: new Types.ObjectId(id.toString()),
        userId: new Types.ObjectId(userId.toString()),
      })
      .exec();

    return result.deletedCount > 0;
  }

  async getBudgetSummary(
    userId: string | Types.ObjectId,
    query: any,
  ): Promise<any[]> {
    const userObjectId = new Types.ObjectId(userId.toString());
    const matchStage: any = { userId: userObjectId };

    if (query.category) {
      matchStage.category = query.category;
    }
    if (query.period) {
      matchStage.period = query.period;
    }

    const result = await this.budgetModel
      .aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'transactions', // Implicit dependency on transactions collection
            let: {
              bUserId: '$userId',
              bCategory: '$category',
              bStartDate: '$startDate',
              bEndDate: '$endDate',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$userId', '$$bUserId'] },
                      { $eq: ['$type', 'expense'] },
                      {
                        $cond: {
                          if: { $ne: ['$$bCategory', null] },
                          then: { $eq: ['$category', '$$bCategory'] },
                          else: true,
                        },
                      },
                      {
                        $cond: {
                          if: { $ne: ['$$bStartDate', null] },
                          then: { $gte: ['$date', '$$bStartDate'] },
                          else: true,
                        },
                      },
                      {
                        $cond: {
                          if: { $ne: ['$$bEndDate', null] },
                          then: { $lte: ['$date', '$$bEndDate'] },
                          else: true,
                        },
                      },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  spent: { $sum: '$amount' },
                },
              },
            ],
            as: 'transactionDetails',
          },
        },
        {
          $addFields: {
            actualSpending: {
              $cond: {
                if: { $gt: [{ $size: '$transactionDetails' }, 0] },
                then: { $arrayElemAt: ['$transactionDetails.spent', 0] },
                else: 0,
              },
            },
          },
        },
        {
          $project: {
            transactionDetails: 0,
          },
        },
      ])
      .exec();

    // Map result to include derived metrics natively
    return result.map((budget: any) => {
      const budgetAmount = budget.amount;
      const actualSpending = budget.actualSpending;
      const remainingAmount = budgetAmount - actualSpending;
      const percentUsed =
        budgetAmount > 0 ? (actualSpending / budgetAmount) * 100 : 0;

      return {
        ...budget,
        remainingAmount,
        percentUsed: Math.round(percentUsed * 100) / 100, // Round to 2 decimal places
        isOverBudget: actualSpending > budgetAmount,
      };
    });
  }
}
