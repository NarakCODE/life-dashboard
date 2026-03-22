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
  ApiExtraModels,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MyTasksResultDto, TaskResponseDto } from './dto/task-response.dto';

@ApiTags('tasks')
@ApiExtraModels(MyTasksResultDto, TaskResponseDto)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiCreatedResponse({
    description: 'The created task object',
    type: TaskResponseDto,
  })
  create(
    @CurrentUser('sub') userId: string,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(userId, createTaskDto);
  }

  @Get('my-tasks')
  @ApiOperation({
    summary:
      'Get the authenticated user tasks with pagination and task filter counts',
  })
  @ApiOkResponse({
    description: 'The filtered task list plus meta.filterCounts',
    type: MyTasksResultDto,
  })
  getMyTasks(
    @CurrentUser('sub') userId: string,
    @Query() queryTaskDto: QueryTaskDto,
  ) {
    return this.tasksService.getMyTasks(userId, queryTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with pagination and filtering' })
  @ApiOkResponse({
    description: 'List of matching tasks and total count',
    type: MyTasksResultDto,
  })
  findAll(
    @CurrentUser('sub') userId: string,
    @Query() queryTaskDto: QueryTaskDto,
  ) {
    return this.tasksService.findMany(userId, queryTaskDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific task by ID' })
  @ApiOkResponse({ description: 'The task object', type: TaskResponseDto })
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.tasksService.findByIdAndUser(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific task' })
  @ApiOkResponse({
    description: 'The updated task object',
    type: TaskResponseDto,
  })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, userId, updateTaskDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiOkResponse({ description: 'Task successfully deleted' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.tasksService.delete(id, userId);
  }
}
