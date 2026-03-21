import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BudgetDocument = HydratedDocument<Budget>;

export enum BudgetPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

@Schema({ timestamps: true, collection: 'budgets' })
export class Budget {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ trim: true })
  category?: string;

  @Prop({
    required: true,
    enum: Object.values(BudgetPeriod),
    default: BudgetPeriod.MONTHLY,
  })
  period: BudgetPeriod;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({ default: 'USD', uppercase: true, length: 3 })
  currency: string;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);

BudgetSchema.index({ userId: 1, isActive: 1 });
BudgetSchema.index({ userId: 1, period: 1 });
