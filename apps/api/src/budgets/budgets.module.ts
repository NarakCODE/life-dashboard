import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Budget, BudgetSchema } from './schemas/budget.schema';
import { BudgetsRepository } from './budgets.repository';
import { BudgetsService } from './budgets.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Budget.name, schema: BudgetSchema }]),
  ],
  providers: [BudgetsRepository, BudgetsService],
  exports: [BudgetsService, BudgetsRepository],
})
export class BudgetsModule {}
