import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateHabitLogDto } from './dto/create-habit-log.dto';
import { QueryHabitLogDto } from './dto/query-habit-log.dto';
import { UpdateHabitLogDto } from './dto/update-habit-log.dto';
import { HabitLogsService } from './habit-logs.service';

@ApiTags('habit-logs')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('habit-logs')
export class HabitLogsController {
  constructor(private readonly habitLogsService: HabitLogsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a habit log for the authenticated user' })
  @ApiCreatedResponse({ description: 'The created habit log object' })
  create(
    @CurrentUser('sub') userId: string,
    @Body() createHabitLogDto: CreateHabitLogDto,
  ) {
    return this.habitLogsService.create(userId, createHabitLogDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get habit logs for the authenticated user' })
  @ApiOkResponse({ description: 'The list of habit logs and pagination data' })
  findAll(
    @CurrentUser('sub') userId: string,
    @Query() queryHabitLogDto: QueryHabitLogDto,
  ) {
    return this.habitLogsService.findByUserId(userId, queryHabitLogDto);
  }

  @Get('habit/:habitId')
  @ApiOperation({ summary: 'Get logs for a specific habit' })
  @ApiOkResponse({
    description: 'The list of logs for the specified habit and pagination data',
  })
  findByHabit(
    @Param('habitId') habitId: string,
    @CurrentUser('sub') userId: string,
    @Query() queryHabitLogDto: QueryHabitLogDto,
  ) {
    return this.habitLogsService.findByHabitId(
      habitId,
      userId,
      queryHabitLogDto,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific habit log by ID' })
  @ApiOkResponse({ description: 'The requested habit log' })
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.habitLogsService.findByIdAndUser(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a habit log' })
  @ApiOkResponse({ description: 'The updated habit log' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() updateHabitLogDto: UpdateHabitLogDto,
  ) {
    return this.habitLogsService.update(id, userId, updateHabitLogDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a habit log' })
  @ApiOkResponse({ description: 'Habit log successfully deleted' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.habitLogsService.delete(id, userId);
  }
}
