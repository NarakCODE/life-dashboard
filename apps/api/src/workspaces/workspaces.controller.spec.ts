import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { WorkspaceMembershipStatus } from './schemas/workspace-membership.schema';
import { WorkspaceRole, WorkspaceType } from './schemas/workspace.schema';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesController', () => {
  const userId = 'user-123';
  const workspaceId = '69bf9af23810b45fcb4d7caa';
  const resolveAccessContext = jest.fn();
  const listWorkspaceInvitations = jest.fn();
  const workspacesService = {
    resolveAccessContext,
    listWorkspaceInvitations,
  } as Pick<WorkspacesService, 'resolveAccessContext'> as WorkspacesService;

  beforeEach(() => {
    resolveAccessContext.mockReset();
    listWorkspaceInvitations.mockReset();
  });

  it('delegates resolve-context requests to resolveAccessContext', async () => {
    const controller = new WorkspacesController(workspacesService);

    resolveAccessContext.mockResolvedValue({
      workspaceId,
      actorUserId: userId,
      role: WorkspaceRole.OWNER,
      membershipStatus: WorkspaceMembershipStatus.ACTIVE,
      permissions: [],
      workspaceName: 'Workspace',
      workspaceType: WorkspaceType.SOLO,
      defaultWorkspaceId: workspaceId,
      activeWorkspaceId: workspaceId,
    });

    await expect(
      controller.resolveContext(userId, workspaceId),
    ).resolves.toEqual({
      success: true,
      data: {
        workspaceId,
        actorUserId: userId,
        role: WorkspaceRole.OWNER,
        membershipStatus: WorkspaceMembershipStatus.ACTIVE,
        permissions: [],
        workspaceName: 'Workspace',
        workspaceType: WorkspaceType.SOLO,
        defaultWorkspaceId: workspaceId,
        activeWorkspaceId: workspaceId,
      },
    });
    expect(resolveAccessContext).toHaveBeenCalledWith(userId, workspaceId);
  });

  it('registers resolve-context as a GET route before the dynamic workspaceId route', () => {
    const methodNames = Object.getOwnPropertyNames(
      WorkspacesController.prototype,
    );
    const resolveContextIndex = methodNames.indexOf('resolveContext');
    const findOneIndex = methodNames.indexOf('findOne');

    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        WorkspacesController.prototype.resolveContext,
      ),
    ).toBe('resolve-context');
    expect(
      Reflect.getMetadata(
        METHOD_METADATA,
        WorkspacesController.prototype.resolveContext,
      ),
    ).toBe(RequestMethod.GET);
    expect(resolveContextIndex).toBeGreaterThan(-1);
    expect(findOneIndex).toBeGreaterThan(-1);
    expect(resolveContextIndex).toBeLessThan(findOneIndex);
  });

  it('registers the workspace invitations list route before the dynamic workspace detail route', () => {
    const methodNames = Object.getOwnPropertyNames(
      WorkspacesController.prototype,
    );
    const listInvitationsIndex = methodNames.indexOf(
      'listWorkspaceInvitations',
    );
    const findOneIndex = methodNames.indexOf('findOne');

    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        WorkspacesController.prototype.listWorkspaceInvitations,
      ),
    ).toBe(':workspaceId/invitations');
    expect(
      Reflect.getMetadata(
        METHOD_METADATA,
        WorkspacesController.prototype.listWorkspaceInvitations,
      ),
    ).toBe(RequestMethod.GET);
    expect(listInvitationsIndex).toBeGreaterThan(-1);
    expect(findOneIndex).toBeGreaterThan(-1);
    expect(listInvitationsIndex).toBeLessThan(findOneIndex);
  });
});
