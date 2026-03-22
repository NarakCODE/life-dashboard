import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from '../tasks/tasks.service';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { WorkspacePermissionGuard } from '../workspaces/guards/workspace-permission.guard';
import { WorkspaceContext } from '../workspaces/decorators/workspace-context.decorator';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { RequireWorkspacePermission } from '../workspaces/decorators/require-workspace-permission.decorator';
import { WorkspacePermission } from '../workspaces/workspace-permissions';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'x-workspace-id',
  required: false,
  description: 'Workspace context for dashboard aggregation routes',
})
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard, WorkspacePermissionGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('tasks-overview')
  @RequireWorkspacePermission(WorkspacePermission.TASK_READ)
  @ApiOperation({
    summary: 'Get aggregated task overview metrics for the dashboard',
  })
  @ApiOkResponse({ description: 'Object containing aggregated task data' })
  getTaskOverview(@WorkspaceContext() workspace: WorkspaceRequestContext) {
    return this.tasksService.getTaskOverview(workspace);
  }
}
