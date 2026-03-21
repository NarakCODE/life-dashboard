import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TasksModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
