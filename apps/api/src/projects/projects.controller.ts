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
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project with optional workstreams' })
  @ApiCreatedResponse({
    description: 'The created project object',
    type: ProjectResponseDto,
  })
  create(
    @CurrentUser('sub') userId: string,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(userId, createProjectDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all accessible projects for the authenticated user',
  })
  @ApiOkResponse({
    description: 'Project list for task creation and grouping',
    type: [ProjectResponseDto],
  })
  findAll(@CurrentUser('sub') userId: string) {
    return this.projectsService.findAllAccessible(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific accessible project by id' })
  @ApiOkResponse({
    description: 'The requested project',
    type: ProjectResponseDto,
  })
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.projectsService.findByIdAccessible(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project owned by the authenticated user' })
  @ApiOkResponse({
    description: 'The updated project',
    type: ProjectResponseDto,
  })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, userId, updateProjectDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a project owned by the authenticated user' })
  @ApiOkResponse({ description: 'Project successfully deleted' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.projectsService.delete(id, userId);
  }
}
