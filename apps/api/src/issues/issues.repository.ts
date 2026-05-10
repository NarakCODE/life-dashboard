import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types, UpdateQuery } from 'mongoose';
import {
  toObjectId,
  toObjectIdOrNull,
  WorkspaceScope,
} from '../common/utils/workspace-scope.util';
import { QueryIssueDto, IssueSortBy } from './dto/query-issue.dto';
import {
  Issue,
  IssueDocument,
  IssuePriority,
  IssueStatus,
  IssueType,
} from './schemas/issue.schema';
import {
  IssueSequence,
  IssueSequenceDocument,
} from './schemas/issue-sequence.schema';

export type IssuePersistenceInput = {
  title: string;
  description?: string | null;
  identifier: string;
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
  projectId?: Types.ObjectId | null;
  cycleId?: Types.ObjectId | null;
  assigneeId?: Types.ObjectId | null;
  reporterId: Types.ObjectId;
  labels: string[];
  dueDate?: Date | null;
  completedAt?: Date | null;
  archivedAt?: Date | null;
};

export type IssueListResult = {
  items: IssueDocument[];
  total: number;
};

@Injectable()
export class IssuesRepository {
  constructor(
    @InjectModel(Issue.name)
    private readonly issueModel: Model<IssueDocument>,
    @InjectModel(IssueSequence.name)
    private readonly issueSequenceModel: Model<IssueSequenceDocument>,
  ) {}

  async getNextIdentifier(
    workspaceId: string | Types.ObjectId,
  ): Promise<string> {
    const sequence = await this.issueSequenceModel
      .findOneAndUpdate(
        { workspaceId: toObjectId(workspaceId) },
        {
          $inc: { nextValue: 1 },
          $setOnInsert: { prefix: 'ISS' },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();

    return `${sequence.prefix}-${sequence.nextValue}`;
  }

  async create(
    scope: WorkspaceScope,
    input: IssuePersistenceInput,
  ): Promise<IssueDocument> {
    const issue = new this.issueModel({
      workspaceId: toObjectId(scope.workspaceId),
      ...input,
    });

    return issue.save();
  }

  async findByIdInWorkspace(
    id: string | Types.ObjectId,
    workspaceId: string | Types.ObjectId,
  ): Promise<IssueDocument | null> {
    const issueId = toObjectIdOrNull(id);
    if (!issueId) {
      return null;
    }

    return this.issueModel
      .findOne({
        _id: issueId,
        workspaceId: toObjectId(workspaceId),
      })
      .exec();
  }

  async findWithPagination(
    scope: WorkspaceScope,
    query: QueryIssueDto,
    extraFilter: Record<string, unknown> = {},
  ): Promise<IssueListResult> {
    const filter = this.buildFilter(scope, query, extraFilter);
    const sort = this.buildSort(query);
    const limit = query.limit ?? 20;
    const skip = query.skip;

    const [items, total] = await Promise.all([
      this.issueModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.issueModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async updateByIdInWorkspace(
    id: string | Types.ObjectId,
    workspaceId: string | Types.ObjectId,
    update: UpdateQuery<IssueDocument>,
  ): Promise<IssueDocument | null> {
    const issueId = toObjectIdOrNull(id);
    if (!issueId) {
      return null;
    }

    return this.issueModel
      .findOneAndUpdate(
        {
          _id: issueId,
          workspaceId: toObjectId(workspaceId),
        },
        update,
        { new: true },
      )
      .exec();
  }

  async deleteByIdInWorkspace(
    id: string | Types.ObjectId,
    workspaceId: string | Types.ObjectId,
  ): Promise<boolean> {
    const issueId = toObjectIdOrNull(id);
    if (!issueId) {
      return false;
    }

    const result = await this.issueModel
      .deleteOne({
        _id: issueId,
        workspaceId: toObjectId(workspaceId),
      })
      .exec();

    return result.deletedCount > 0;
  }

  async deleteMany(filter: Record<string, unknown>): Promise<number> {
    const result = await this.issueModel.deleteMany(filter).exec();
    return result.deletedCount ?? 0;
  }

  private buildFilter(
    scope: WorkspaceScope,
    query: QueryIssueDto,
    extraFilter: Record<string, unknown>,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {
      workspaceId: toObjectId(scope.workspaceId),
      archivedAt: null,
      ...extraFilter,
    };

    if (query.status?.length) {
      filter.status = { $in: query.status };
    }

    if (query.priority?.length) {
      filter.priority = { $in: query.priority };
    }

    if (query.type?.length) {
      filter.type = { $in: query.type };
    }

    if (query.projectId) {
      filter.projectId = toObjectId(query.projectId);
    }

    if (query.cycleId) {
      filter.cycleId = toObjectId(query.cycleId);
    }

    if (query.assigneeIds?.length) {
      filter.assigneeId = {
        $in: query.assigneeIds.map((value) => toObjectId(value)),
      };
    }

    if (query.labels?.length) {
      filter.labels = { $all: query.labels };
    }

    if (query.search?.trim()) {
      const safe = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safe, 'i');
      filter.$or = [
        { title: regex },
        { description: regex },
        { identifier: regex },
        { labels: regex },
      ];
    }

    return filter;
  }

  private buildSort(query: QueryIssueDto): Record<string, SortOrder> {
    const direction: SortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sortBy = query.sortBy ?? IssueSortBy.UPDATED_AT;

    switch (sortBy) {
      case IssueSortBy.CREATED_AT:
        return { createdAt: direction, _id: direction };
      case IssueSortBy.DUE_DATE:
        return { dueDate: direction, updatedAt: -1 };
      case IssueSortBy.PRIORITY:
        return { priority: direction, updatedAt: -1 };
      case IssueSortBy.IDENTIFIER:
        return { identifier: direction };
      case IssueSortBy.TITLE:
        return { title: direction, updatedAt: -1 };
      case IssueSortBy.UPDATED_AT:
      default:
        return { updatedAt: direction, _id: direction };
    }
  }
}
