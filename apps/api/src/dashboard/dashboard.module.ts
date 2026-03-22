import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { TasksModule } from '../tasks/tasks.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [TasksModule, WorkspacesModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
