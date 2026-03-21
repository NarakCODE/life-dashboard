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
} from '@nestjs/swagger';
import { HabitsService } from './habits.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { QueryHabitDto } from './dto/query-habit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('habits')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new habit' })
  @ApiCreatedResponse({ description: 'The created habit object' })
  create(
    @CurrentUser('sub') userId: string,
    @Body() createHabitDto: CreateHabitDto,
  ) {
    return this.habitsService.create(userId, createHabitDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all habits for the authenticated user' })
  @ApiOkResponse({ description: 'The list of habits and pagination details' })
  findAll(
    @CurrentUser('sub') userId: string,
    @Query() queryHabitDto: QueryHabitDto,
  ) {
    return this.habitsService.findMany(userId, queryHabitDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific habit by ID' })
  @ApiOkResponse({ description: 'The requested habit' })
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.habitsService.findByIdAndUser(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a habit' })
  @ApiOkResponse({ description: 'The updated habit' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() updateHabitDto: UpdateHabitDto,
  ) {
    return this.habitsService.update(id, userId, updateHabitDto);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a habit' })
  @ApiOkResponse({ description: 'The archived habit' })
  archive(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.habitsService.archive(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a habit permanently' })
  @ApiOkResponse({ description: 'Habit successfully deleted' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.habitsService.delete(id, userId);
  }
}
