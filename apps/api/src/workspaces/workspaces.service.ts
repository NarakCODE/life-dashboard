import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workspace, WorkspaceDocument, WorkspaceRole } from './schemas/workspace.schema';
import { WorkspaceInvitation, WorkspaceInvitationDocument, InvitationStatus } from './schemas/workspace-invitation.schema';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(WorkspaceInvitation.name) private invitationModel: Model<WorkspaceInvitationDocument>,
    private usersService: UsersService,
  ) {}

  async create(userId: string, dto: CreateWorkspaceDto): Promise<Workspace> {
    const workspace = await this.workspaceModel.create({
      ...dto,
      ownerId: new Types.ObjectId(userId),
      members: [
        {
          userId: new Types.ObjectId(userId),
          role: WorkspaceRole.OWNER,
        },
      ],
    });
    return workspace.toObject();
  }

  async findAllForUser(userId: string): Promise<Workspace[]> {
    return this.workspaceModel
      .find({ 'members.userId': new Types.ObjectId(userId) })
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
  }

  async inviteMember(workspaceId: string, invitedBy: string, dto: InviteMemberDto) {
    const userToInvite = await this.usersService.findByEmail(dto.email);
    
    if (userToInvite) {
      const workspace = await this.findOne(workspaceId);
      const isMember = workspace.members.some(m => m.userId.toString() === (userToInvite as any)._id?.toString() || m.userId.toString() === (userToInvite as any).id);
      if (isMember) {
        throw new BadRequestException('User is already a member of this workspace');
      }
    }

    const invitation = await this.invitationModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      email: dto.email,
      invitedBy: new Types.ObjectId(invitedBy),
      role: dto.role,
      status: InvitationStatus.PENDING,
    });

    return invitation;
  }

  async removeMember(workspaceId: string, userIdToRemove: string) {
    const workspace = await this.findOne(workspaceId);
    if (workspace.ownerId.toString() === userIdToRemove) {
      throw new BadRequestException('Cannot remove the owner of the workspace');
    }

    await this.workspaceModel.findByIdAndUpdate(workspaceId, {
      $pull: { members: { userId: new Types.ObjectId(userIdToRemove) } }
    }).exec();
  }
}
