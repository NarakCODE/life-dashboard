import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HabitLog, HabitLogSchema } from './schemas/habit-log.schema';
import { HabitLogsRepository } from './habit-logs.repository';
import { HabitLogsService } from './habit-logs.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HabitLog.name, schema: HabitLogSchema },
    ]),
  ],
  providers: [HabitLogsRepository, HabitLogsService],
  exports: [HabitLogsService, HabitLogsRepository],
})
export class HabitLogsModule {}
