import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  ProjectResponseDto,
  ProjectWorkstreamResponseDto,
  ResolvedTaskProjectContext,
} from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsRepository } from './projects.repository';
import { WorkspaceRequestContext } from '../workspaces/interfaces/workspace-context.interface';
import {
  ProjectDocument,
  ProjectPriority,
  ProjectStatus,
} from './schemas/project.schema';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectsRepo: ProjectsRepository) {}

  async create(
    workspace: WorkspaceRequestContext,
    dto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsRepo.create(
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      dto,
    );
    return this.toProjectResponse(project);
  }

  async findAllAccessible(
    workspace: WorkspaceRequestContext,
  ): Promise<ProjectResponseDto[]> {
    const projects = await this.projectsRepo.findAllAccessible({
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    return projects.map((project) => this.toProjectResponse(project));
  }

  async findByIdAccessible(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsRepo.findAccessibleById(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.toProjectResponse(project);
  }

  async update(
    id: string,
    workspace: WorkspaceRequestContext,
    dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    const update: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      update.name = dto.name;
    }

    if (dto.status !== undefined) {
      update.status = dto.status;
    }

    if (dto.priority !== undefined) {
      update.priority = dto.priority;
    }

    if (dto.typeLabel !== undefined) {
      update.typeLabel = dto.typeLabel;
    }

    if (dto.durationLabel !== undefined) {
      update.durationLabel = dto.durationLabel;
    }

    if (dto.memberUserIds !== undefined) {
      update.memberUserIds = dto.memberUserIds.map(
        (id) => new Types.ObjectId(id),
      );
    }

    if (dto.workstreams !== undefined) {
      update.workstreams = dto.workstreams.map((workstream, index) => ({
        name: workstream.name,
        order: workstream.order ?? index,
      }));
    }

    const project = await this.projectsRepo.updateByIdAndWorkspace(
      id,
      {
        workspaceId: workspace.workspaceId,
        userId: workspace.actorUserId,
      },
      update as Partial<ProjectDocument>,
    );

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.toProjectResponse(project);
  }

  async delete(
    id: string,
    workspace: WorkspaceRequestContext,
  ): Promise<{ message: string }> {
    const deleted = await this.projectsRepo.deleteByIdAndWorkspace(id, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!deleted) {
      throw new NotFoundException('Project not found');
    }

    return { message: 'Project deleted successfully' };
  }

  async resolveTaskProjectContext(
    workspace: WorkspaceRequestContext,
    projectId: string,
    workstreamId?: string,
  ): Promise<ResolvedTaskProjectContext> {
    const project = await this.projectsRepo.findAccessibleById(projectId, {
      workspaceId: workspace.workspaceId,
      userId: workspace.actorUserId,
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!workstreamId) {
      return {
        projectId: project.id,
        projectName: project.name,
      };
    }

    const workstream = project.workstreams.find(
      (item) => item._id.toString() === workstreamId && !item.archivedAt,
    );

    if (!workstream) {
      throw new BadRequestException(
        'Workstream does not belong to the project',
      );
    }

    return {
      projectId: project.id,
      projectName: project.name,
      workstreamId: workstream._id.toString(),
      workstreamName: workstream.name,
    };
  }

  private toProjectResponse(project: ProjectDocument): ProjectResponseDto {
    const raw = project.toObject() as ProjectDocument & { _id: Types.ObjectId };

    return new ProjectResponseDto({
      id: raw._id.toString(),
      workspaceId: raw.workspaceId.toString(),
      name: raw.name,
      status: (raw.status as ProjectStatus) ?? ProjectStatus.ACTIVE,
      priority: (raw.priority as ProjectPriority) ?? ProjectPriority.MEDIUM,
      typeLabel: raw.typeLabel,
      durationLabel: raw.durationLabel,
      workstreams: (raw.workstreams ?? [])
        .filter((workstream) => !workstream.archivedAt)
        .sort((left, right) => left.order - right.order)
        .map(
          (workstream) =>
            new ProjectWorkstreamResponseDto({
              id: workstream._id.toString(),
              name: workstream.name,
              order: workstream.order,
            }),
        ),
    });
  }
}
