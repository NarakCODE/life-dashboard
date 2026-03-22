import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workspace, WorkspaceDocument } from '../schemas/workspace.schema';

@Injectable()
export class WorkspaceAccessGuard implements CanActivate {
  constructor(
    @InjectModel(Workspace.name)
    private workspaceModel: Model<WorkspaceDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Appended by JwtAuthGuard

    if (!user || !user.sub) {
      throw new ForbiddenException('User is not authenticated');
    }

    // Try finding workspaceId in headers first, then params
    const workspaceId =
      request.headers['x-workspace-id'] ||
      request.params.workspaceId ||
      request.body.workspaceId ||
      request.query.workspaceId;

    if (!workspaceId || !Types.ObjectId.isValid(workspaceId as string)) {
      throw new ForbiddenException(
        'Valid Workspace ID is required for this route',
      );
    }

    const workspace = await this.workspaceModel.findById(workspaceId).exec();

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check if user is owner
    if (workspace.ownerId.toString() === user.sub) {
      request.workspaceRole = 'OWNER';
      request.workspaceId = workspaceId;
      return true;
    }

    // Check if user is a member
    const member = workspace.members.find(
      (m) => m.userId.toString() === user.sub,
    );

    if (member) {
      request.workspaceRole = member.role;
      request.workspaceId = workspaceId;
      return true;
    }

    throw new ForbiddenException('You do not have access to this workspace');
  }
}
