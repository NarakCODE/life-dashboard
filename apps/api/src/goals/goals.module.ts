import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Goal, GoalSchema } from './schemas/goal.schema';
import { GoalsRepository } from './goals.repository';
import { GoalsService } from './goals.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Goal.name, schema: GoalSchema }]),
  ],
  providers: [GoalsRepository, GoalsService],
  exports: [GoalsService, GoalsRepository],
})
export class GoalsModule {}
