import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TasksService } from '../tasks/tasks.service';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('tasks-overview')
  @ApiOperation({
    summary: 'Get aggregated task overview metrics for the dashboard',
  })
  @ApiOkResponse({ description: 'Object containing aggregated task data' })
  getTaskOverview(@CurrentUser('sub') userId: string) {
    return this.tasksService.getTaskOverview(userId);
  }
}
