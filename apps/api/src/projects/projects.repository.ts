import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project, ProjectDocument } from './schemas/project.schema';

@Injectable()
export class ProjectsRepository {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async create(
    ownerUserId: string | Types.ObjectId,
    dto: CreateProjectDto,
  ): Promise<ProjectDocument> {
    const project = new this.projectModel({
      ownerUserId: this.toObjectId(ownerUserId),
      name: dto.name,
      status: dto.status,
      priority: dto.priority,
      typeLabel: dto.typeLabel,
      durationLabel: dto.durationLabel,
      memberUserIds: (dto.memberUserIds ?? []).map((id) => this.toObjectId(id)),
      workstreams: (dto.workstreams ?? []).map((workstream, index) => ({
        name: workstream.name,
        order: workstream.order ?? index,
      })),
    });

    return project.save();
  }

  async findAllAccessible(
    userId: string | Types.ObjectId,
  ): Promise<ProjectDocument[]> {
    const userObjectId = this.toObjectId(userId);

    return this.projectModel
      .find({
        $or: [{ ownerUserId: userObjectId }, { memberUserIds: userObjectId }],
      })
      .sort({ updatedAt: -1, createdAt: -1 })
      .exec();
  }

  async findAccessibleById(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<ProjectDocument | null> {
    const projectId = this.toObjectIdOrNull(id);
    if (!projectId) {
      return null;
    }

    const userObjectId = this.toObjectId(userId);

    return this.projectModel
      .findOne({
        _id: projectId,
        $or: [{ ownerUserId: userObjectId }, { memberUserIds: userObjectId }],
      })
      .exec();
  }

  async updateByIdAndOwner(
    id: string | Types.ObjectId,
    ownerUserId: string | Types.ObjectId,
    update: Partial<Project>,
  ): Promise<ProjectDocument | null> {
    const projectId = this.toObjectIdOrNull(id);
    if (!projectId) {
      return null;
    }

    return this.projectModel
      .findOneAndUpdate(
        { _id: projectId, ownerUserId: this.toObjectId(ownerUserId) },
        { $set: update },
        { new: true },
      )
      .exec();
  }

  async deleteByIdAndOwner(
    id: string | Types.ObjectId,
    ownerUserId: string | Types.ObjectId,
  ): Promise<boolean> {
    const projectId = this.toObjectIdOrNull(id);
    if (!projectId) {
      return false;
    }

    const result = await this.projectModel
      .deleteOne({
        _id: projectId,
        ownerUserId: this.toObjectId(ownerUserId),
      })
      .exec();

    return result.deletedCount > 0;
  }

  private toObjectId(value: string | Types.ObjectId): Types.ObjectId {
    return value instanceof Types.ObjectId ? value : new Types.ObjectId(value);
  }

  private toObjectIdOrNull(
    value: string | Types.ObjectId,
  ): Types.ObjectId | null {
    if (value instanceof Types.ObjectId) {
      return value;
    }

    if (!Types.ObjectId.isValid(value)) {
      return null;
    }

    return new Types.ObjectId(value);
  }
}
