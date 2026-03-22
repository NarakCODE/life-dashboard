# Task Dialog Consistency Plan

# Refresh Token Unauthorized Fix Plan

## Status: COMPLETE

### 1. Audit
- [x] Trace frontend refresh retry flow and backend refresh-token validation/rotation
- [x] Confirm repeated `/auth/refresh` calls fail because the backend invalidates the previous refresh token immediately

### 2. Backend fix
- [x] Make refresh resilient to repeated app refresh calls without forcing a stale-token 401
- [x] Add targeted auth service regression coverage for refresh behavior

### 3. Verification
- [x] Run targeted backend tests and lint
- [x] Record results and remaining risks

## Review / Results
- Root cause: the backend used strict refresh-token rotation semantics. Every successful `/auth/refresh` minted and stored a brand new refresh token hash, so any repeated app refresh call using the previous token immediately failed with `401 Unauthorized`.
- Updated `AuthService.refresh()` to keep using the existing validated refresh token and mint only a new access token during refresh. Login still creates and stores the initial refresh token hash; repeated refresh calls now remain valid until logout or token expiry.
- Added `auth.service.spec.ts` to verify that refresh returns the same refresh token and does not overwrite the stored refresh token hash on refresh.
- Verification:
  - `pnpm test -- auth.service.spec.ts` in `apps/api` ✅
  - `pnpm exec eslint src/auth/auth.service.ts src/auth/auth.service.spec.ts` in `apps/api` ✅
- Remaining risks:
  - This trades strict one-time refresh-token rotation for app-level resilience. If you later want rotation again, the safer path would be server-side support for previous-token grace or token family tracking rather than returning to immediate invalidation.

# Workspace Invitation Inline Notification Plan

## Status: COMPLETE

### 1. UI
- [x] Add an inline sender-facing invitation feedback banner in the teammates settings pane
- [x] Reuse it for invite and revoke success/error states

### 2. Verification
- [x] Run targeted frontend lint on the settings dialog
- [x] Record results and remaining risks

## Review / Results
- Added a persistent inline feedback banner directly under the invite form in `TeammatesSettingsPane`, which is the highest-signal location for sender feedback without forcing the user to rely only on transient toasts.
- The banner now shows invite success, invite validation/errors, missing-workspace guidance, and revoke success/error states.
- Verification:
  - `pnpm exec eslint components/settings/SettingsDialog.tsx` in `apps/project-dashboard` produced warnings only; no errors ✅
- Remaining risks:
  - `SettingsDialog.tsx` still has the same pre-existing warnings unrelated to this banner (`members` hook dependency, `resolvedTheme`, `handleResetPhoto`, and `<img>` usage).

# Workspace Invitation Admin List Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect current workspace invitation API/query layer and sender-side settings UI
- [x] Confirm sender-side pending invitation listing is missing in both backend and frontend

### 2. Backend
- [x] Add a workspace-scoped invitations list endpoint for admins
- [x] Cover the new workspace invitation list behavior with targeted tests

### 3. Frontend
- [x] Add workspace invitation query support in the frontend client/query layer
- [x] Replace the teammates settings pane mock data with live members plus pending invitations and revoke action

### 4. Verification
- [x] Run targeted backend and frontend validation
- [x] Record results and remaining risks

## Review / Results
- Root cause: sender-side pending invitation visibility was missing entirely. The API only exposed "my invitations" for recipients, while the settings UI used hardcoded teammate data and had no workspace invitation list to read from.
- Added `GET /workspaces/:workspaceId/invitations` for admin-scoped pending invitation listing, with controller coverage ensuring the route is registered before the generic `GET /workspaces/:workspaceId` detail handler.
- Added frontend workspace invitation fetching via `workspace-client` and `workspace-query`, and invalidated that cache on invite/revoke.
- Replaced the `Teammates` settings pane mock state with live workspace members from the active workspace plus a real pending invitations table that shows email, role, inviter, expiry, and `Revoke`.
- Verification:
  - `pnpm test -- workspaces.controller.spec.ts workspaces.service.spec.ts` in `apps/api` ✅
  - `pnpm exec eslint src/workspaces/workspaces.controller.ts src/workspaces/workspaces.controller.spec.ts src/workspaces/workspaces.service.ts src/workspaces/workspaces.service.spec.ts` in `apps/api` ✅
  - `pnpm exec eslint components/settings/SettingsDialog.tsx lib/workspaces/workspace-client.ts lib/workspaces/workspace-query.ts` in `apps/project-dashboard` produced warnings only; no errors ✅
- Remaining risks:
  - `SettingsDialog.tsx` still has pre-existing frontend warnings unrelated to this feature (`resolvedTheme`, `handleResetPhoto`, `<img>`, and a hook dependency warning around `members`). The sender-side invitation flow works, but that file still needs a separate cleanup pass if you want it warning-free.

# Workspace Invitation 500 Fix Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect `WorkspacesModule`, invitation routes, and service methods used by invite/accept/reject/revoke flows
- [x] Identify unhandled failure paths that can surface as 500s

### 2. Backend fix
- [x] Normalize invalid invitation/workspace id handling in workspace invitation flows
- [x] Add regression tests for malformed invitation/workspace ids

### 3. Verification
- [x] Run targeted backend tests
- [x] Record results and remaining risks

## Review / Results
- Root cause: there were two invitation 500 paths. First, malformed ids could throw raw BSON/ObjectId errors. Second, and more importantly for valid invite requests, expired invitations remained in `pending` status while the Mongo unique partial index still enforced one pending invite per workspace/email. Re-inviting after expiry then crashed on duplicate key during `save()`.
- A third response-side issue was also possible: invitation endpoints were returning raw Mongoose documents. If persistence succeeded but response serialization hit a document edge case, the client would see an error even though the record had already been written.
- Added a shared `toObjectId` guard in `WorkspacesService` and routed invitation invite/revoke/accept/reject lookups through it so malformed ids now return `BadRequestException` instead of an internal server error.
- Updated `inviteMember` to detect an expired pending invitation, mark it rejected, and only then create the replacement invitation. That clears the unique-index collision that was still causing valid invite requests to fail with 500.
- Normalized invitation responses to plain objects with string ids (`id`, `workspaceId`, `invitedBy`, `acceptedBy`) instead of returning raw Mongoose documents from invite/list/accept/reject/revoke flows.
- Added service regressions covering invalid workspace ids for `inviteMember`, invalid invitation ids for `acceptInvitation`, and the expired-invitation replacement flow.
- Verification:
  - `pnpm test -- workspaces.service.spec.ts` in `apps/api` ✅
  - `pnpm exec eslint src/workspaces/workspaces.service.ts src/workspaces/workspaces.service.spec.ts` in `apps/api` ✅
- Remaining risks:
  - This fixes the malformed-id and expired-pending-invitation crash paths. If invite requests still 500 with a valid workspace id and no prior pending invite for that email, the next suspect is a database write failure outside application logic or an unexpected guard/user lookup edge case.

# Task Board Card Interaction Fix Plan

## Status: COMPLETE

### 1. Fix
- [x] Prevent inline board-card tag interactions from bubbling into the edit-task open handler

### 2. Verification
- [x] Run targeted lint on the changed board-card file
- [x] Record results and remaining risks

## Review / Results
- Root cause: the board card was fully clickable for edit mode, and the inline tag dropdown trigger lived inside that clickable container without stopping propagation.
- Stopped click, key, and pointer-down events on the tag trigger from reaching the card-level open handler in `TaskBoardCard`.
- Removed the local unused `isDefault` variable so the file lints cleanly.
- Verification:
  - `pnpm exec eslint components/tasks/TaskBoardCard.tsx` in `apps/project-dashboard` ✅
- Remaining risks:
  - This change covers the tag trigger itself. Full browser smoke coverage would still be useful for touch interactions across the entire board card.

# Task Edit Implementation Plan

## Status: COMPLETE

### 1. Audit
- [x] Trace existing create and partial edit flows in task list and board views
- [x] Confirm backend update support and identify missing frontend wiring

### 2. Frontend task editing
- [x] Make task rows/cards open the shared modal in edit mode consistently
- [x] Preload all editable task fields in the modal for edit mode

### 3. Verification
- [x] Run targeted lint on the changed task files
- [x] Record results and remaining risks

## Review / Results
- Root cause: edit mode existed only as a partial board-view path. List rows had no open handler, so the shared modal's update flow was not reachable from the main list UI.
- Made `TaskRowBase` optionally openable and stopped checkbox and drag-handle interactions from bubbling into edit mode.
- Wired `ProjectTaskListView` and task rows to call `openEditTask(task)`, so list and board views now open the same shared modal for editing.
- Added optional `dueDate` to the frontend task shape and preload it into the modal's target-date field during edit mode.
- Verification:
  - `pnpm exec eslint components/tasks/TaskQuickCreateModal.tsx components/tasks/TaskRowBase.tsx components/tasks/task-helpers.tsx components/tasks/MyTasksPage.tsx lib/data/project-details.ts` in `apps/project-dashboard` ✅
- Remaining risks:
  - Board card inline tag controls still sit inside a clickable card, so that specific interaction pattern should be smoke-tested in the browser to confirm it never opens edit unintentionally.

## Status: COMPLETE

### 1. Audit
- [x] Trace all task dialog triggers under `apps/project-dashboard/components/tasks`
- [x] Confirm where create context is passed and where the modal falls back to empty project state

### 2. Shared modal logic
- [x] Normalize create-task defaults inside the shared modal
- [x] Ensure project/workstream selection resets consistently when opening or changing project

### 3. Trigger cleanup
- [x] Remove caller-specific project/workstream patching that fights the shared modal defaults

### 4. Verification
- [x] Run targeted lint on the changed task component files
- [x] Record results and remaining risks

## Review / Results
- Root cause: the shared task modal only prefilled `projectId` when a caller supplied context, so no-context triggers opened with an empty project selector while project-scoped triggers injected their own defaults.
- Standardized create-mode initialization in `TaskQuickCreateModal` so every open resolves through the same default path: caller context first, otherwise the first available project, then that project's first available workstream.
- Reset project/workstream state consistently when the user changes project so stale workstream labels do not carry across opens or project switches.
- Removed the project section shortcut that previously guessed a workstream from `tasks[0]`, leaving workstream selection to the shared modal logic.
- Verification:
  - `pnpm exec eslint components/tasks/TaskQuickCreateModal.tsx components/tasks/task-helpers.tsx` in `apps/project-dashboard` ✅
- Remaining risks:
  - Board-view add buttons still do not pass date context, so the modal is now consistent for project/workstream defaults but not yet date-prefilled from the selected day column.

## Status: COMPLETE

### 1. Audit
- [x] Trace the `/workspaces/resolve-context` request path in the frontend and backend
- [x] Confirm the 403 comes from the workspace guard validating the route param value `"resolve-context"`

### 2. Backend fix
- [x] Add an explicit `GET /workspaces/resolve-context` controller route before `GET /workspaces/:workspaceId`
- [x] Resolve workspace context from the authenticated user plus optional `workspaceId` query input

### 3. Verification
- [x] Add a regression test for the resolve-context controller route
- [x] Run targeted backend tests
- [x] Record results and remaining risks

## Review / Results
- Root cause: `GET /workspaces/resolve-context` was missing from `WorkspacesController`, so Nest matched the request against `GET /workspaces/:workspaceId` and the guard tried to validate the literal string `"resolve-context"` as an ObjectId.
- Added an explicit `resolve-context` route that delegates to `WorkspacesService.resolveAccessContext(userId, workspaceId)` and placed it before the dynamic `:workspaceId` route.
- Added a controller regression spec that verifies the route metadata and method order so the static route stays ahead of the dynamic workspace detail route.
- Verification:
  - `pnpm test -- workspaces.controller.spec.ts workspaces.service.spec.ts` in `apps/api` ✅
  - `pnpm exec eslint src/workspaces/workspaces.controller.ts src/workspaces/workspaces.controller.spec.ts` in `apps/api` ✅
- Remaining risks:
  - This fix covers the controller routing failure for workspace bootstrap. It does not change workspace membership rules or any downstream business endpoint behavior.

# Workspace Switching Refactor Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect protected routes, workspace state, API client, and TanStack Query usage
- [x] Confirm current failure points for stale data, missing workspace headers, and cache pollution

### 2. Routing and state
- [x] Introduce `workspaceId` as a protected route segment and shared route helpers
- [x] Make the active workspace resolve from the route first and stop relying on implicit global scope

### 3. API and query scoping
- [x] Add explicit workspace context support to the API client
- [x] Scope task, project, and dashboard query keys and fetchers by `workspaceId`
- [x] Reset or remove workspace-scoped queries during workspace switch

### 4. Shell integration
- [x] Update sidebar navigation and workspace switching to navigate by workspace route
- [x] Keep auth and workspace bootstrapping coherent on initial load and redirects

### 5. Verification
- [x] Run relevant frontend validation
- [x] Verify the workspace switch flow in the running app as far as the local auth state allows
- [x] Record review/results and remaining risks

## Review / Results
- Implemented canonical workspace-scoped protected routes under `app/(protected)/w/[workspaceId]/...` and converted the legacy top-level protected pages into client redirects toward the canonical workspace route.
- Added shared workspace routing/scope helpers plus a route boundary so the frontend derives workspace scope from the URL, validates it against the backend workspace context, and redirects away from invalid workspace routes.
- Updated the API client to send `x-workspace-id`, then refactored dashboard, tasks, and task-project queries/mutations so their request paths and TanStack Query keys are scoped by `workspaceId`.
- Updated sidebar switching so it cancels/removes the old workspace query namespace and navigates to the matching route in the new workspace instead of relying on `router.refresh()`.
- Updated key project/client links to preserve workspace context when navigating deeper into the protected app.
- Verification:
  - `pnpm exec eslint ...` across the changed workspace, routing, query, and page files ✅
  - Browser smoke check: `http://localhost:3000/w/test/tasks` resolves through the app and redirects to `login?next=%2Fw%2Ftest%2Ftasks`, confirming the new route exists in the running app ✅
- Remaining risks:
  - Some protected screens still use mock data instead of workspace-scoped API data, so this refactor hardens the real API-backed surfaces first but does not make the mock-data screens truly multi-tenant.
  - There are still two pre-existing unrelated lint warnings in `components/clients-content.tsx` and `components/clients/ClientDetailsDrawer.tsx`.
