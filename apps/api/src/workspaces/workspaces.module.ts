import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { Workspace, WorkspaceSchema } from './schemas/workspace.schema';
import {
  WorkspaceInvitation,
  WorkspaceInvitationSchema,
} from './schemas/workspace-invitation.schema';
import {
  WorkspaceMembership,
  WorkspaceMembershipSchema,
} from './schemas/workspace-membership.schema';
import { UsersModule } from '../users/users.module';
import { WorkspaceAccessGuard } from './guards/workspace-access.guard';
import { WorkspaceRoleGuard } from './guards/workspace-role.guard';
import { WorkspacePermissionGuard } from './guards/workspace-permission.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: WorkspaceInvitation.name, schema: WorkspaceInvitationSchema },
      { name: WorkspaceMembership.name, schema: WorkspaceMembershipSchema },
    ]),
    UsersModule,
  ],
  controllers: [WorkspacesController],
  providers: [
    WorkspacesService,
    WorkspaceAccessGuard,
    WorkspaceRoleGuard,
    WorkspacePermissionGuard,
  ],
  exports: [
    WorkspacesService,
    WorkspaceAccessGuard,
    WorkspaceRoleGuard,
    WorkspacePermissionGuard,
  ],
})
export class WorkspacesModule {}
