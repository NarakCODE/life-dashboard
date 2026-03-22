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
  ApiHeader,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { QueryBudgetDto } from './dto/query-budget.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { WorkspacePermissionGuard } from '../workspaces/guards/workspace-permission.guard';
import { WorkspaceContext } from '../workspaces/decorators/workspace-context.decorator';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { RequireWorkspacePermission } from '../workspaces/decorators/require-workspace-permission.decorator';
import { WorkspacePermission } from '../workspaces/workspace-permissions';

@ApiTags('budgets')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'x-workspace-id',
  required: false,
  description: 'Workspace context for workspace-scoped budget routes',
})
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard, WorkspacePermissionGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @RequireWorkspacePermission(WorkspacePermission.BUDGET_WRITE)
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiCreatedResponse({ description: 'The created budget object' })
  create(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() createBudgetDto: CreateBudgetDto,
  ) {
    return this.budgetsService.create(workspace, createBudgetDto);
  }

  @Get()
  @RequireWorkspacePermission(WorkspacePermission.BUDGET_READ)
  @ApiOperation({ summary: 'Get all budgets for the authenticated user' })
  @ApiOkResponse({ description: 'The list of budgets and pagination details' })
  findAll(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() queryBudgetDto: QueryBudgetDto,
  ) {
    return this.budgetsService.findMany(workspace, queryBudgetDto);
  }

  @Get('summary')
  @RequireWorkspacePermission(WorkspacePermission.BUDGET_READ)
  @ApiOperation({ summary: 'Get budget vs spending summary' })
  @ApiOkResponse({
    description: 'List of budgets including spent amount and metrics',
  })
  getSummary(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Query() queryBudgetDto: QueryBudgetDto,
  ) {
    return this.budgetsService.getBudgetSummary(workspace, queryBudgetDto);
  }

  @Get(':id')
  @RequireWorkspacePermission(WorkspacePermission.BUDGET_READ)
  @ApiOperation({ summary: 'Get a specific budget by ID' })
  @ApiOkResponse({ description: 'The requested budget' })
  findOne(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.budgetsService.findByIdAndUser(id, workspace);
  }

  @Patch(':id')
  @RequireWorkspacePermission(WorkspacePermission.BUDGET_WRITE)
  @ApiOperation({ summary: 'Update a budget' })
  @ApiOkResponse({ description: 'The updated budget' })
  update(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(id, workspace, updateBudgetDto);
  }

  @Delete(':id')
  @RequireWorkspacePermission(WorkspacePermission.BUDGET_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a budget permanently' })
  @ApiOkResponse({ description: 'Budget successfully deleted' })
  remove(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.budgetsService.delete(id, workspace);
  }
}
