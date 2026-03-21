import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HabitLog, HabitLogSchema } from './schemas/habit-log.schema';
import { HabitLogsRepository } from './habit-logs.repository';
import { HabitLogsService } from './habit-logs.service';
import { HabitLogsController } from './habit-logs.controller';
import { HabitsModule } from '../habits/habits.module';

@Module({
  imports: [
    HabitsModule,
    MongooseModule.forFeature([
      { name: HabitLog.name, schema: HabitLogSchema },
    ]),
  ],
  controllers: [HabitLogsController],
  providers: [HabitLogsRepository, HabitLogsService],
  exports: [HabitLogsService, HabitLogsRepository],
})
export class HabitLogsModule {}
