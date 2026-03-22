import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  buildWorkspaceScopedFilter,
  toObjectId,
  toObjectIdOrNull,
  WorkspaceScope,
} from '../common/utils/workspace-scope.util';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project, ProjectDocument } from './schemas/project.schema';

@Injectable()
export class ProjectsRepository {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async create(
    scope: WorkspaceScope,
    dto: CreateProjectDto,
  ): Promise<ProjectDocument> {
    const project = new this.projectModel({
      workspaceId: toObjectId(scope.workspaceId),
      ownerUserId: toObjectId(scope.userId),
      createdBy: toObjectId(scope.userId),
      updatedBy: toObjectId(scope.userId),
      name: dto.name,
      status: dto.status,
      priority: dto.priority,
      typeLabel: dto.typeLabel,
      durationLabel: dto.durationLabel,
      memberUserIds: (dto.memberUserIds ?? []).map((id) => toObjectId(id)),
      workstreams: (dto.workstreams ?? []).map((workstream, index) => ({
        name: workstream.name,
        order: workstream.order ?? index,
      })),
    });

    return project.save();
  }

  async findAllAccessible(scope: WorkspaceScope): Promise<ProjectDocument[]> {
    return this.projectModel
      .find(
        buildWorkspaceScopedFilter(scope, {
          $or: [
            { ownerUserId: toObjectId(scope.userId) },
            { memberUserIds: toObjectId(scope.userId) },
          ],
        }),
      )
      .sort({ updatedAt: -1, createdAt: -1 })
      .exec();
  }

  async findAccessibleById(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<ProjectDocument | null> {
    const projectId = toObjectIdOrNull(id);
    if (!projectId) {
      return null;
    }

    return this.projectModel
      .findOne({
        _id: projectId,
        ...buildWorkspaceScopedFilter(scope, {
          $or: [
            { ownerUserId: toObjectId(scope.userId) },
            { memberUserIds: toObjectId(scope.userId) },
          ],
        }),
      })
      .exec();
  }

  async updateByIdAndWorkspace(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
    update: Partial<Project>,
  ): Promise<ProjectDocument | null> {
    const projectId = toObjectIdOrNull(id);
    if (!projectId) {
      return null;
    }

    return this.projectModel
      .findOneAndUpdate(
        {
          _id: projectId,
          ...buildWorkspaceScopedFilter(scope, {
            ownerUserId: toObjectId(scope.userId),
          }),
        },
        {
          $set: {
            ...update,
            updatedBy: toObjectId(scope.userId),
          },
        },
        { new: true },
      )
      .exec();
  }

  async deleteByIdAndWorkspace(
    id: string | Types.ObjectId,
    scope: WorkspaceScope,
  ): Promise<boolean> {
    const projectId = toObjectIdOrNull(id);
    if (!projectId) {
      return false;
    }

    const result = await this.projectModel
      .deleteOne({
        _id: projectId,
        ...buildWorkspaceScopedFilter(scope, {
          ownerUserId: toObjectId(scope.userId),
        }),
      })
      .exec();

    return result.deletedCount > 0;
  }
}
