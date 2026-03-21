import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Habit, HabitSchema } from './schemas/habit.schema';
import { HabitsRepository } from './habits.repository';
import { HabitsService } from './habits.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Habit.name, schema: HabitSchema }]),
  ],
  providers: [HabitsRepository, HabitsService],
  exports: [HabitsService, HabitsRepository],
})
export class HabitsModule {}
