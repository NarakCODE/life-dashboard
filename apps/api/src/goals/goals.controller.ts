import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiParam,
} from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { QueryGoalDto } from './dto/query-goal.dto';
import { LogProgressDto } from './dto/log-progress.dto';
import { LinkTasksDto } from './dto/link-tasks.dto';
import { LinkHabitsDto } from './dto/link-habits.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('goals')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new goal' })
  @ApiCreatedResponse({ description: 'The created goal object' })
  create(
    @CurrentUser('sub') userId: string,
    @Body() createGoalDto: CreateGoalDto,
  ) {
    return this.goalsService.create(userId, createGoalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all goals for the authenticated user' })
  @ApiOkResponse({
    description:
      'The list of goals with computed progress and pagination details',
  })
  findAll(
    @CurrentUser('sub') userId: string,
    @Query() queryGoalDto: QueryGoalDto,
  ) {
    return this.goalsService.findMany(userId, queryGoalDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific goal by ID with live computed progress',
  })
  @ApiOkResponse({ description: 'The requested goal' })
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.goalsService.findByIdAndUser(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a goal' })
  @ApiOkResponse({ description: 'The updated goal' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() updateGoalDto: UpdateGoalDto,
  ) {
    return this.goalsService.update(id, userId, updateGoalDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a goal permanently' })
  @ApiOkResponse({ description: 'Goal successfully deleted' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.goalsService.delete(id, userId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Progress Logging
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/log-progress')
  @ApiOperation({
    summary: 'Log progress for a manual goal',
    description:
      'Adds a progress log entry and increments currentValue. Only available for manual and mixed goals.',
  })
  @ApiParam({ name: 'id', description: 'Goal ID' })
  @ApiCreatedResponse({ description: 'Progress logged successfully' })
  logProgress(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: LogProgressDto,
  ) {
    return this.goalsService.logProgress(id, userId, dto);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Task Linking
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/link-tasks')
  @ApiOperation({
    summary: 'Link tasks to a goal',
    description:
      'Links existing tasks to the goal. Tasks must belong to the authenticated user.',
  })
  @ApiParam({ name: 'id', description: 'Goal ID' })
  @ApiCreatedResponse({ description: 'Tasks linked successfully' })
  linkTasks(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: LinkTasksDto,
  ) {
    return this.goalsService.linkTasks(id, userId, dto);
  }

  @Delete(':id/unlink-task/:taskId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unlink a task from a goal',
    description: 'Removes the link between a task and the goal.',
  })
  @ApiParam({ name: 'id', description: 'Goal ID' })
  @ApiParam({ name: 'taskId', description: 'Task ID to unlink' })
  @ApiOkResponse({ description: 'Task unlinked successfully' })
  unlinkTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.goalsService.unlinkTask(id, userId, taskId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Habit Linking
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/link-habits')
  @ApiOperation({
    summary: 'Link habits to a goal',
    description:
      'Links existing habits to the goal. Habits must belong to the authenticated user.',
  })
  @ApiParam({ name: 'id', description: 'Goal ID' })
  @ApiCreatedResponse({ description: 'Habits linked successfully' })
  linkHabits(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: LinkHabitsDto,
  ) {
    return this.goalsService.linkHabits(id, userId, dto);
  }

  @Delete(':id/unlink-habit/:habitId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unlink a habit from a goal',
    description: 'Removes the link between a habit and the goal.',
  })
  @ApiParam({ name: 'id', description: 'Goal ID' })
  @ApiParam({ name: 'habitId', description: 'Habit ID to unlink' })
  @ApiOkResponse({ description: 'Habit unlinked successfully' })
  unlinkHabit(
    @Param('id') id: string,
    @Param('habitId') habitId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.goalsService.unlinkHabit(id, userId, habitId);
  }
}
