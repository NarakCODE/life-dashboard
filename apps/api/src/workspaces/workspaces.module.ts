import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { Workspace, WorkspaceSchema } from './schemas/workspace.schema';
import {
  WorkspaceInvitation,
  WorkspaceInvitationSchema,
} from './schemas/workspace-invitation.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: WorkspaceInvitation.name, schema: WorkspaceInvitationSchema },
    ]),
    UsersModule,
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
