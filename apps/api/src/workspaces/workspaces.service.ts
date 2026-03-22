import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import {
  Workspace,
  WorkspaceDocument,
  WorkspaceRole,
  WorkspaceStatus,
  WorkspaceType,
} from './schemas/workspace.schema';
import {
  WorkspaceInvitation,
  WorkspaceInvitationDocument,
  InvitationStatus,
} from './schemas/workspace-invitation.schema';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UsersService } from '../users/users.service';
import {
  WorkspaceMembership,
  WorkspaceMembershipDocument,
  WorkspaceMembershipStatus,
} from './schemas/workspace-membership.schema';
import { WorkspaceRequestContext } from './interfaces/workspace-context.interface';
import { getWorkspacePermissions } from './workspace-permissions';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name)
    private workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(WorkspaceInvitation.name)
    private invitationModel: Model<WorkspaceInvitationDocument>,
    @InjectModel(WorkspaceMembership.name)
    private membershipModel: Model<WorkspaceMembershipDocument>,
    private usersService: UsersService,
  ) {}

  async create(userId: string, dto: CreateWorkspaceDto): Promise<Workspace> {
    const user = await this.usersService.findById(userId);
    const workspace = await this.workspaceModel.create({
      name: dto.name,
      ownerId: user._id,
      createdBy: user._id,
      type: WorkspaceType.COLLABORATIVE,
      status: WorkspaceStatus.ACTIVE,
      members: [
        {
          userId: user._id,
          role: WorkspaceRole.OWNER,
        },
      ],
    });

    await this.upsertMembership(workspace._id, user._id, WorkspaceRole.OWNER, {
      status: WorkspaceMembershipStatus.ACTIVE,
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    });

    if (!user.defaultWorkspaceId) {
      await this.usersService.updateWorkspacePreferences(user._id, {
        defaultWorkspaceId: workspace._id,
      });
    }

    if (!user.activeWorkspaceId) {
      await this.usersService.updateWorkspacePreferences(user._id, {
        activeWorkspaceId: workspace._id,
      });
    }

    return workspace.toObject();
  }

  async findAllForUser(userId: string): Promise<Workspace[]> {
    await this.ensureDefaultWorkspaceForUser(userId);
    const memberships = await this.membershipModel
      .find({
        userId: new Types.ObjectId(userId),
        status: WorkspaceMembershipStatus.ACTIVE,
      })
      .lean()
      .exec();

    const workspaceIds = memberships.map(
      (membership) => membership.workspaceId,
    );
    if (!workspaceIds.length) {
      return [];
    }

    return this.workspaceModel
      .find({
        _id: { $in: workspaceIds },
        status: WorkspaceStatus.ACTIVE,
      })
      .exec();
  }

  async findOne(id: string): Promise<Workspace> {
    const workspace = await this.workspaceModel.findById(id).exec();
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async update(id: string, dto: UpdateWorkspaceDto): Promise<Workspace> {
    const workspace = await this.workspaceModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async delete(id: string): Promise<void> {
    const result = await this.workspaceModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Workspace not found');
    await this.membershipModel.deleteMany({ workspaceId: result._id }).exec();
    await this.invitationModel.deleteMany({ workspaceId: result._id }).exec();
  }

  async inviteMember(
    workspaceId: string,
    invitedBy: string,
    dto: InviteMemberDto,
  ) {
    const userToInvite = await this.usersService.findByEmail(dto.email);

    if (userToInvite) {
      const existingMembership = await this.membershipModel
        .findOne({
          workspaceId: new Types.ObjectId(workspaceId),
          userId: userToInvite._id,
          status: WorkspaceMembershipStatus.ACTIVE,
        })
        .exec();

      if (existingMembership) {
        throw new BadRequestException(
          'User is already a member of this workspace',
        );
      }
    }

    const existingPendingInvitation = await this.invitationModel
      .findOne({
        workspaceId: new Types.ObjectId(workspaceId),
        email: dto.email.toLowerCase(),
        status: InvitationStatus.PENDING,
      })
      .exec();

    if (existingPendingInvitation) {
      throw new BadRequestException('A pending invitation already exists');
    }

    const invitation = new this.invitationModel({
      workspaceId: new Types.ObjectId(workspaceId),
      email: dto.email,
      invitedBy: new Types.ObjectId(invitedBy),
      role: dto.role,
      status: InvitationStatus.PENDING,
      token: randomBytes(24).toString('hex'),
      expiresAt: this.buildInvitationExpiry(),
    });

    return invitation.save();
  }

  async removeMember(workspaceId: string, userIdToRemove: string) {
    const workspace = await this.findOne(workspaceId);
    if (workspace.ownerId.toString() === userIdToRemove) {
      throw new BadRequestException('Cannot remove the owner of the workspace');
    }

    await this.membershipModel
      .findOneAndUpdate(
        {
          workspaceId: new Types.ObjectId(workspaceId),
          userId: new Types.ObjectId(userIdToRemove),
        },
        { $set: { status: WorkspaceMembershipStatus.LEFT } },
        { new: true },
      )
      .exec();

    await this.workspaceModel
      .findByIdAndUpdate(workspaceId, {
        $pull: { members: { userId: new Types.ObjectId(userIdToRemove) } },
      })
      .exec();
  }

  async ensureDefaultWorkspaceForUser(
    userId: string,
  ): Promise<WorkspaceDocument> {
    const user = await this.usersService.findById(userId);

    if (user.defaultWorkspaceId) {
      if (!user.activeWorkspaceId) {
        await this.usersService.updateWorkspacePreferences(user._id, {
          activeWorkspaceId: user.defaultWorkspaceId,
        });
      }

      const existingWorkspace = await this.workspaceModel
        .findById(user.defaultWorkspaceId)
        .exec();
      if (existingWorkspace) {
        return existingWorkspace;
      }
    }

    let defaultWorkspace = await this.workspaceModel
      .findOne({ defaultForUserId: user._id })
      .exec();

    if (!defaultWorkspace) {
      try {
        defaultWorkspace = await this.workspaceModel.create({
          name: `${user.displayName}'s Workspace`,
          ownerId: user._id,
          createdBy: user._id,
          type: WorkspaceType.SOLO,
          status: WorkspaceStatus.ACTIVE,
          defaultForUserId: user._id,
          members: [{ userId: user._id, role: WorkspaceRole.OWNER }],
        });
      } catch (error) {
        if (!this.isDuplicateKeyError(error)) {
          throw error;
        }

        defaultWorkspace = await this.workspaceModel
          .findOne({ defaultForUserId: user._id })
          .exec();
      }
    }

    if (!defaultWorkspace) {
      throw new NotFoundException(
        'Default workspace could not be resolved for the current user',
      );
    }

    await this.upsertMembership(
      defaultWorkspace._id,
      user._id,
      WorkspaceRole.OWNER,
      {
        status: WorkspaceMembershipStatus.ACTIVE,
        joinedAt: defaultWorkspace.createdAt ?? new Date(),
        lastActiveAt: new Date(),
      },
    );

    await this.usersService.updateWorkspacePreferences(user._id, {
      defaultWorkspaceId: defaultWorkspace._id,
      activeWorkspaceId: user.activeWorkspaceId ?? defaultWorkspace._id,
    });

    return defaultWorkspace;
  }

  async resolveAccessContext(
    userId: string,
    requestedWorkspaceId?: string,
  ): Promise<WorkspaceRequestContext> {
    const defaultWorkspace = await this.ensureDefaultWorkspaceForUser(userId);
    const user = await this.usersService.findById(userId);

    const fallbackWorkspaceId =
      requestedWorkspaceId ??
      user.activeWorkspaceId?.toString() ??
      user.defaultWorkspaceId?.toString() ??
      defaultWorkspace._id.toString();

    if (!Types.ObjectId.isValid(fallbackWorkspaceId)) {
      throw new ForbiddenException('Valid workspace id is required');
    }

    const workspace = await this.workspaceModel
      .findOne({
        _id: new Types.ObjectId(fallbackWorkspaceId),
        status: WorkspaceStatus.ACTIVE,
      })
      .exec();

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    let membership: WorkspaceMembershipDocument | null =
      await this.membershipModel
        .findOne({
          workspaceId: workspace._id,
          userId: new Types.ObjectId(userId),
        })
        .exec();

    if (!membership) {
      const embeddedMember = workspace.members.find(
        (member) => member.userId.toString() === userId,
      );

      if (embeddedMember) {
        membership = await this.upsertMembership(
          workspace._id,
          embeddedMember.userId,
          embeddedMember.role,
          {
            status: WorkspaceMembershipStatus.ACTIVE,
            joinedAt: workspace.createdAt ?? new Date(),
            lastActiveAt: new Date(),
          },
        );
      }
    }

    if (!membership && workspace.ownerId.toString() === userId) {
      membership = await this.upsertMembership(
        workspace._id,
        workspace.ownerId,
        WorkspaceRole.OWNER,
        {
          status: WorkspaceMembershipStatus.ACTIVE,
          joinedAt: workspace.createdAt ?? new Date(),
          lastActiveAt: new Date(),
        },
      );
    }

    if (!membership || membership.status !== WorkspaceMembershipStatus.ACTIVE) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    await this.membershipModel
      .findByIdAndUpdate(membership._id, { $set: { lastActiveAt: new Date() } })
      .exec();

    return {
      workspaceId: workspace._id.toString(),
      actorUserId: userId,
      role: membership.role,
      membershipStatus: membership.status,
      permissions: getWorkspacePermissions(membership.role),
      workspaceName: workspace.name,
      workspaceType: workspace.type,
      defaultWorkspaceId: user.defaultWorkspaceId?.toString() ?? null,
      activeWorkspaceId: user.activeWorkspaceId?.toString() ?? null,
    };
  }

  async acceptInvitation(invitationId: string, userId: string) {
    const invitation = await this.getPendingInvitation(invitationId);
    const user = await this.usersService.findById(userId);

    if (invitation.email !== user.email.toLowerCase()) {
      throw new ForbiddenException('Invitation does not belong to this user');
    }

    await this.upsertMembership(
      invitation.workspaceId,
      user._id,
      invitation.role,
      {
        status: WorkspaceMembershipStatus.ACTIVE,
        invitedBy: invitation.invitedBy,
        joinedAt: new Date(),
        lastActiveAt: new Date(),
      },
    );

    await this.ensureEmbeddedMember(
      invitation.workspaceId,
      user._id,
      invitation.role,
    );

    invitation.status = InvitationStatus.ACCEPTED;
    invitation.acceptedBy = user._id;
    invitation.respondedAt = new Date();
    await invitation.save();

    if (!user.activeWorkspaceId) {
      await this.usersService.updateWorkspacePreferences(user._id, {
        activeWorkspaceId: invitation.workspaceId,
      });
    }

    return invitation;
  }

  async rejectInvitation(invitationId: string, userId: string) {
    const invitation = await this.getPendingInvitation(invitationId);
    const user = await this.usersService.findById(userId);

    if (invitation.email !== user.email.toLowerCase()) {
      throw new ForbiddenException('Invitation does not belong to this user');
    }

    invitation.status = InvitationStatus.REJECTED;
    invitation.respondedAt = new Date();
    await invitation.save();

    return invitation;
  }

  async revokeInvitation(workspaceId: string, invitationId: string) {
    const invitation = await this.invitationModel
      .findOne({
        _id: new Types.ObjectId(invitationId),
        workspaceId: new Types.ObjectId(workspaceId),
        status: InvitationStatus.PENDING,
      })
      .exec();

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    invitation.status = InvitationStatus.REVOKED;
    invitation.respondedAt = new Date();
    await invitation.save();

    return invitation;
  }

  async leaveWorkspace(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.findOne(workspaceId);
    if (workspace.ownerId.toString() === userId) {
      throw new BadRequestException(
        'Workspace owner cannot leave the workspace',
      );
    }

    await this.removeMember(workspaceId, userId);

    const user = await this.usersService.findById(userId);
    if (user.activeWorkspaceId?.toString() === workspaceId) {
      await this.usersService.updateWorkspacePreferences(user._id, {
        activeWorkspaceId: user.defaultWorkspaceId ?? null,
      });
    }
  }

  async switchActiveWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<void> {
    await this.resolveAccessContext(userId, workspaceId);
    await this.usersService.updateWorkspacePreferences(userId, {
      activeWorkspaceId: workspaceId,
    });
  }

  async listPendingInvitationsForUser(userId: string) {
    const user = await this.usersService.findById(userId);
    return this.invitationModel
      .find({
        email: user.email.toLowerCase(),
        status: InvitationStatus.PENDING,
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  private async upsertMembership(
    workspaceId: Types.ObjectId,
    userId: Types.ObjectId,
    role: WorkspaceRole,
    extras?: Partial<WorkspaceMembership>,
  ): Promise<WorkspaceMembershipDocument> {
    try {
      return await this.membershipModel
        .findOneAndUpdate(
          { workspaceId, userId },
          {
            $set: {
              role,
              status: extras?.status ?? WorkspaceMembershipStatus.ACTIVE,
              invitedBy: extras?.invitedBy ?? null,
              joinedAt: extras?.joinedAt ?? new Date(),
              lastActiveAt: extras?.lastActiveAt ?? null,
            },
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
          },
        )
        .exec();
    } catch (error) {
      if (!this.isDuplicateKeyError(error)) {
        throw error;
      }

      const existingMembership = await this.membershipModel
        .findOne({ workspaceId, userId })
        .exec();

      if (!existingMembership) {
        throw error;
      }

      return existingMembership;
    }
  }

  private isDuplicateKeyError(error: unknown): error is { code: number } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    );
  }

  private async ensureEmbeddedMember(
    workspaceId: Types.ObjectId,
    userId: Types.ObjectId,
    role: WorkspaceRole,
  ): Promise<void> {
    const workspace = await this.workspaceModel.findById(workspaceId).exec();
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const existingMember = workspace.members.find(
      (member) => member.userId.toString() === userId.toString(),
    );

    if (existingMember) {
      existingMember.role = role;
      await workspace.save();
      return;
    }

    workspace.members.push({ userId, role });
    await workspace.save();
  }

  private async getPendingInvitation(invitationId: string) {
    const invitation = await this.invitationModel
      .findOne({
        _id: new Types.ObjectId(invitationId),
        status: InvitationStatus.PENDING,
      })
      .exec();

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.expiresAt <= new Date()) {
      invitation.status = InvitationStatus.REJECTED;
      invitation.respondedAt = new Date();
      await invitation.save();
      throw new BadRequestException('Invitation has expired');
    }

    return invitation;
  }

  private buildInvitationExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return expiresAt;
  }
}
