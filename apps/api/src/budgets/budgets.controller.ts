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
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { QueryBudgetDto } from './dto/query-budget.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('budgets')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiCreatedResponse({ description: 'The created budget object' })
  create(
    @CurrentUser('sub') userId: string,
    @Body() createBudgetDto: CreateBudgetDto,
  ) {
    return this.budgetsService.create(userId, createBudgetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all budgets for the authenticated user' })
  @ApiOkResponse({ description: 'The list of budgets and pagination details' })
  findAll(
    @CurrentUser('sub') userId: string,
    @Query() queryBudgetDto: QueryBudgetDto,
  ) {
    return this.budgetsService.findMany(userId, queryBudgetDto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get budget vs spending summary' })
  @ApiOkResponse({
    description: 'List of budgets including spent amount and metrics',
  })
  getSummary(
    @CurrentUser('sub') userId: string,
    @Query() queryBudgetDto: QueryBudgetDto,
  ) {
    return this.budgetsService.getBudgetSummary(userId, queryBudgetDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific budget by ID' })
  @ApiOkResponse({ description: 'The requested budget' })
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.budgetsService.findByIdAndUser(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a budget' })
  @ApiOkResponse({ description: 'The updated budget' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(id, userId, updateBudgetDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a budget permanently' })
  @ApiOkResponse({ description: 'Budget successfully deleted' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.budgetsService.delete(id, userId);
  }
}
