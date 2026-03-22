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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { WorkspacePermissionGuard } from '../workspaces/guards/workspace-permission.guard';
import { WorkspaceContext } from '../workspaces/decorators/workspace-context.decorator';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import { RequireWorkspacePermission } from '../workspaces/decorators/require-workspace-permission.decorator';
import { WorkspacePermission } from '../workspaces/workspace-permissions';

@ApiTags('projects')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'x-workspace-id',
  required: false,
  description: 'Workspace context for workspace-scoped business routes',
})
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard, WorkspacePermissionGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @RequireWorkspacePermission(WorkspacePermission.PROJECT_WRITE)
  @ApiOperation({ summary: 'Create a new project with optional workstreams' })
  @ApiCreatedResponse({
    description: 'The created project object',
    type: ProjectResponseDto,
  })
  create(
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(workspace, createProjectDto);
  }

  @Get()
  @RequireWorkspacePermission(WorkspacePermission.PROJECT_READ)
  @ApiOperation({
    summary: 'Get all accessible projects for the authenticated user',
  })
  @ApiOkResponse({
    description: 'Project list for task creation and grouping',
    type: [ProjectResponseDto],
  })
  findAll(@WorkspaceContext() workspace: WorkspaceRequestContext) {
    return this.projectsService.findAllAccessible(workspace);
  }

  @Get(':id')
  @RequireWorkspacePermission(WorkspacePermission.PROJECT_READ)
  @ApiOperation({ summary: 'Get a specific accessible project by id' })
  @ApiOkResponse({
    description: 'The requested project',
    type: ProjectResponseDto,
  })
  findOne(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.projectsService.findByIdAccessible(id, workspace);
  }

  @Patch(':id')
  @RequireWorkspacePermission(WorkspacePermission.PROJECT_WRITE)
  @ApiOperation({ summary: 'Update a project in the active workspace' })
  @ApiOkResponse({
    description: 'The updated project',
    type: ProjectResponseDto,
  })
  update(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, workspace, updateProjectDto);
  }

  @Delete(':id')
  @RequireWorkspacePermission(WorkspacePermission.PROJECT_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a project in the active workspace' })
  @ApiOkResponse({ description: 'Project successfully deleted' })
  remove(
    @Param('id') id: string,
    @WorkspaceContext() workspace: WorkspaceRequestContext,
  ) {
    return this.projectsService.delete(id, workspace);
  }
}
