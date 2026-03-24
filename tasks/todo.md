# Dashboard MDX Rendering Fix Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect the existing docs MDX page that contains the dashboard heading guidance
- [x] Confirm the content is currently wrapped in JSX instead of written as native MDX

### 2. Fix
- [x] Convert the dashboard heading guidance to native MDX so headings, lists, and tables render correctly
- [x] Keep the page content aligned with the existing docs structure

### 3. Verification
- [x] Run focused verification for the touched MDX file
- [x] Record results

## Review / Results
- Updated `apps/project-dashboard/content/docs/components/note-details.mdx` so the dashboard heading guidance now uses native MDX instead of being wrapped inside a JSX `<Prose>` block.
- This keeps the content structure explicit for MDX parsing and preserves the intended heading, list, blockquote, and table rendering semantics.
- Trimmed the top-level imports in the doc page to only keep the typography import that is still referenced in examples on the page.
- Verification:
- `pnpm exec prettier --check content/docs/components/note-details.mdx` in `apps/project-dashboard` ✅

# Note Create Sheet Editor Upgrade Plan

## Status: COMPLETE

### 1. Audit
- [x] Confirm the current note create/edit sheet uses a simple textarea for the content field
- [x] Identify the expected editor interface from the shadcn-editor documentation to replace it with

### 2. Fix
- [x] Install the shadcn-editor package files via `pnpm dlx shadcn@latest add @shadcn-editor/editor` and review the generated components
- [x] Swap the textarea in `apps/project-dashboard/components/projects/note-create-sheet.tsx` with the new editor component while wiring the serialized state to the existing callbacks

### 3. Verification
- [x] Run `pnpm exec eslint components/projects/note-create-sheet.tsx` (apps/project-dashboard)
- [x] Confirm the editor loads in the sheet and keyboard shortcut still submits

## Review / Results
- Replaced the textarea inside `apps/project-dashboard/components/projects/note-create-sheet.tsx` with the `Editor` provided by `components/blocks/editor-00`, mirroring the shadcn-editor rich text configuration.
- Owned the editor state as a Lexical `SerializedEditorState`, kept a plain-text cache for form submissions, and wired `Cmd+Enter` handling through `SheetContent` so the shortcut still works.
- Verification: `pnpm exec eslint components/projects/note-create-sheet.tsx` in `apps/project-dashboard` ✅

# Project Details Implementation Plan

## Status: COMPLETE

### 1. Backend
- [x] Add a `GET /projects/:id/details` BFF endpoint backed by real project/task data
- [x] Add project-scoped task mutation endpoints for patch, move, and reorder flows
- [x] Persist stable task ordering fields so workstream/task order survives reloads

### 2. Frontend
- [x] Replace the project-details mock builder with a real project-details query client
- [x] Wire workstream/task interactions to the new backend mutations

### 3. Verification
- [x] Run focused backend verification for the new project details and task endpoints
- [x] Run focused frontend verification for the touched project details files

## Review / Results
- Added a real project-details BFF path in `apps/api/src/projects/projects.controller.ts` and `apps/api/src/projects/projects.service.ts` at `GET /projects/:id/details`. It now aggregates the project, workstreams, project tasks, timeline bars, and right-panel summary data from the existing `projects` and `tasks` collections instead of relying on `buildProjectDetailsFromSummary(...)`.
- Added project-scoped task interaction endpoints under `projects` for:
- `PATCH /projects/:id/tasks/:taskId`
- `PATCH /projects/:id/tasks/:taskId/move`
- `PATCH /projects/:id/workstreams/:workstreamId/tasks/reorder`
- `PATCH /projects/:id/tasks/reorder`
- Extended `apps/api/src/tasks/schemas/task.schema.ts` and `apps/api/src/tasks/tasks.repository.ts` with persistent `projectOrder` and `workstreamOrder` fields plus the repository helpers needed for project-scoped reads and reorder operations.
- Added the focused project details DTO/mutation DTOs in `apps/api/src/projects/dto/` and a regression spec in `apps/api/src/projects/projects.service.spec.ts`.
- Replaced the frontend mock project-details builder path with a real query client in `apps/project-dashboard/lib/projects/project-details-client.ts`, then wired the page and tabs through `apps/project-dashboard/components/projects/ProjectDetailsPage.tsx`, `WorkstreamTab.tsx`, and `ProjectTasksTab.tsx`.
- `apps/project-dashboard/lib/data/project-details.ts` now supports API-backed flat task ordering through `projectTasks` while preserving the old derived fallback.
- Verification:
- `pnpm exec eslint src/projects/projects.controller.ts src/projects/projects.module.ts src/projects/projects.service.ts src/projects/projects.service.spec.ts src/projects/dto/project-details-response.dto.ts src/projects/dto/move-project-task.dto.ts src/projects/dto/reorder-project-tasks.dto.ts src/tasks/tasks.module.ts src/tasks/tasks.repository.ts src/tasks/schemas/task.schema.ts` in `apps/api` ✅
- `pnpm test -- projects.service.spec.ts` in `apps/api` ✅
- `pnpm exec eslint components/projects/ProjectDetailsPage.tsx components/projects/WorkstreamTab.tsx components/projects/ProjectTasksTab.tsx lib/projects/projects-query.ts lib/projects/project-details-client.ts lib/data/project-details.ts` in `apps/project-dashboard` ✅
- `pnpm exec tsc --noEmit --pretty false 2>&1 | rg "src/(projects|tasks)/"` in `apps/api` returned no matches ✅
- `pnpm exec tsc --noEmit --pretty false 2>&1 | rg "(components/projects/ProjectDetailsPage|components/projects/WorkstreamTab|components/projects/ProjectTasksTab|lib/projects/projects-query|lib/projects/project-details-client|lib/data/project-details)"` in `apps/project-dashboard` returned no matches ✅
- Remaining follow-up:
- notes, audio processing, and assets/files still use placeholder empty-state data because this repo does not yet have dedicated backend persistence modules for those domains
- there are unrelated pre-existing worktree changes in `apps/project-dashboard/components/settings/*` and `apps/project-dashboard/components/ui/dialog.tsx` that were not touched for this task

# Project Details API Design Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect `ProjectDetailsPage` and its tab components to extract the page-level aggregate state and local interactions
- [x] Identify nested entity relationships, async workflows, and permission-sensitive mutations

### 2. Design
- [x] Define a production-ready domain model for projects, workstreams, tasks, notes, assets, clients, and users
- [x] Specify a BFF aggregate endpoint plus resource endpoints for interactive mutations

### 3. Deliverable
- [x] Map frontend actions to backend operations
- [x] Document non-functional recommendations for caching, optimistic UI, and async processing

## Review / Results
- Audited the current project details page flow in `apps/project-dashboard/components/projects/ProjectDetailsPage.tsx` and its tab children. The page is currently fed by a thin `ProjectSummary` query and then inflated client-side by `buildProjectDetailsFromSummary(...)`, which is the main source of BFF pressure.
- Confirmed the interactive hotspots that require first-class backend support:
- nested project -> workstream -> task state with same-lane reorder and cross-workstream move in `WorkstreamTab`
- project-wide task filtering and drag reorder in `ProjectTasksTab`
- timeline rendering from scheduled task spans in `TimelineGantt`
- async audio note upload/processing with AI output expectations in `NotesTab`, `UploadAudioModal`, and `NotePreviewModal`
- assets/files creation with both direct uploads and link-based records in `AssetsFilesTab` and `AddFileModal`
- Produced a production-ready API design centered on a single `GET /projects/:id/details` aggregate endpoint plus focused resource endpoints for task patching, move/reorder operations, notes, assets, and audio-processing jobs.
- Verification:
- checked the proposed domain and endpoints against the actual frontend state contracts in the audited project details components and `apps/project-dashboard/lib/data/project-details.ts`
- checked permission alignment against `apps/api/src/workspaces/workspace-permissions.ts`
- checked existing backend model compatibility against `apps/api/src/projects/schemas/project.schema.ts` and `apps/api/src/tasks/dto/task-response.dto.ts`

# Settings Sidebar Layout Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect the current settings dialog shell and sidebar rail layout
- [x] Confirm the muted background is only partially applied and does not fully read as a dedicated left column

### 2. Fix
- [x] Restructure the settings dialog/sidebar layout so the left rail owns the full muted column
- [x] Tune the sidebar spacing and active-item treatment to feel closer to a ChatGPT-style settings layout

### 3. Verification
- [x] Run targeted frontend verification for the touched settings files
- [x] Verify the updated layout in the live settings UI
- [x] Record results and remaining gaps

## Review / Results
- Updated `apps/project-dashboard/components/settings/shared/SettingsSidebarNav.tsx` so the sidebar is now a full-height muted rail with internal padding, tighter section labels, softer hover states, and a more inset active item treatment.
- Updated `apps/project-dashboard/components/settings/SettingsDialog.tsx` so the dialog shell supports the rail visually with a cleaner outer surface, dedicated background separation, and roomier content spacing.
- Verification:
- `pnpm exec eslint components/settings/SettingsDialog.tsx components/settings/shared/SettingsSidebarNav.tsx` in `apps/project-dashboard` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "components/settings/(SettingsDialog|shared/SettingsSidebarNav)\\.tsx" || true` in `apps/project-dashboard` returned no matches ✅
- Chrome DevTools verification:
- opened the live settings dialog from `http://localhost:3000/w/69c0b60618cdd085fd1e2aac`
- confirmed the left rail now reads as a dedicated muted settings column instead of a narrow bordered list
- confirmed the active item and teammates badge still render correctly within the updated rail ✅

# Task Quick Edit Fix Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect `TaskQuickCreateModal` and compare its edit payload with the working task update callers
- [x] Confirm the modal edit flow always resends project/workstream fields instead of only sending changed values

### 2. Fix
- [x] Build a minimal task update payload in the modal so unchanged project/workstream fields are not revalidated unnecessarily
- [x] Surface the real update error message in the modal toast instead of a generic fallback

### 3. Verification
- [x] Run targeted frontend verification for the touched task files
- [x] Record results and remaining follow-up

## Review / Results
- Updated `apps/project-dashboard/components/tasks/TaskQuickCreateModal.tsx` so the edit flow now builds a minimal `UpdateTaskInput` instead of always resending `projectId` and `workstreamId`.
- This avoids unnecessary backend project/workstream revalidation for unchanged tasks, which was the main difference between the failing modal edit path and the working inline task updates elsewhere in the app.
- The modal now also shows the real backend error message through `getErrorMessage(...)` instead of always collapsing to `Failed to update task`.
- Verification:
- `pnpm exec eslint components/tasks/TaskQuickCreateModal.tsx` in `apps/project-dashboard` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "components/tasks/TaskQuickCreateModal\\.tsx" || true` in `apps/project-dashboard` returned no matches ✅
- Remaining follow-up:
- I could not live-reproduce the exact edit failure in the current local workspace because `/tasks` has no available task projects or tasks to edit here. The fix is based on the concrete payload mismatch between this modal and the other working task update callers.

# Transaction Create Response Fix Plan

## Status: COMPLETE

### 1. Audit
- [x] Reproduce the transaction create failure from the live UI and inspect the API response
- [x] Confirm the transactions API is returning raw Mongoose documents instead of normalized DTO payloads

### 2. Fix
- [x] Serialize transaction create/read/list/update responses through the existing response DTO
- [x] Add focused regression coverage for normalized transaction responses

### 3. Verification
- [x] Run targeted backend verification for the touched transactions files
- [x] Record results and any remaining follow-up

## Review / Results
- Fixed `apps/api/src/transactions/transactions.service.ts` so transaction create, list, detail, and update responses are normalized through `TransactionResponseDto` instead of leaking raw Mongoose documents with `$__` and `_doc`.
- Added `apps/api/src/transactions/transactions.service.spec.ts` to cover normalized create and list response behavior.
- Verification:
- `pnpm test -- transactions.service.spec.ts` in `apps/api` ✅
- `pnpm exec eslint src/transactions/transactions.service.ts src/transactions/transactions.service.spec.ts` in `apps/api` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "src/transactions/transactions\\.service(\\.spec)?\\.ts" || true` in `apps/api` returned no matches ✅
- Chrome DevTools verification:
- reproduced the original `POST /transactions` failure and confirmed the API had been returning raw Mongoose documents in the list payload
- reloaded after the fix and confirmed the transactions page rendered correctly with stable item ids
- created a new `Taxi` expense for `$40` and confirmed the page stayed mounted, showed the success toast, and updated the list/summary totals ✅

# Budget Inactive List Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect the budgets controller path, query DTO, and repository filtering logic
- [x] Confirm the activity filter is applied through `QueryBudgetDto` before the controller delegates to the service

### 2. Fix
- [x] Preserve `isActive` as `undefined` when the client does not send the query param
- [x] Add a focused regression test for the budget query parsing behavior

### 3. Verification
- [x] Run targeted backend verification for the touched budget files
- [x] Record results and any remaining follow-up

## Review / Results
- Fixed `apps/api/src/budgets/dto/query-budget.dto.ts` so omitting `isActive` no longer transforms into `false` at the controller boundary. The budget list now only applies the active/inactive filter when the client explicitly sends that query parameter.
- Added `apps/api/src/budgets/dto/query-budget.dto.spec.ts` to lock in the expected behavior for both omitted and explicit `false` values.
- Verification:
- `pnpm test -- query-budget.dto.spec.ts budgets.service.spec.ts` in `apps/api` ✅
- `pnpm exec eslint src/budgets/dto/query-budget.dto.ts src/budgets/dto/query-budget.dto.spec.ts` in `apps/api` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "src/budgets/dto/query-budget\\.dto(\\.spec)?\\.ts" || true` in `apps/api` returned no matches ✅
- Remaining follow-up:
- The frontend budgets page still defaults its status filter to `"active"` in `apps/project-dashboard/components/budgets/BudgetsPage.tsx`, so inactive budgets will remain hidden there until that UX default is changed. This backend fix ensures the API itself no longer hides inactive budgets unless asked to.

# Settings Menu Badge Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect `SettingsDialog`, the settings sidebar nav, and the existing invitation query hooks
- [x] Confirm the teammate settings surface already exposes pending invitation state that can drive a menu badge

### 2. Fix
- [x] Add badge-count support to the settings sidebar nav
- [x] Surface a live teammates badge count in `SettingsDialog` from the existing invitation queries

### 3. Verification
- [x] Run targeted frontend verification for the touched settings files
- [x] Verify the badge appears in the settings UI with real pending invitation data
- [x] Record results and remaining gaps

## Review / Results
- Updated `apps/project-dashboard/components/settings/SettingsDialog.tsx` to fetch invitation counts only while the dialog is open, then compute a single teammates badge count from inbound invitations plus workspace pending invitations when the current user can manage them.
- Updated `apps/project-dashboard/components/settings/shared/SettingsSidebarNav.tsx` to support per-item badge counts and render a compact badge on the corresponding menu item.
- Kept the change scoped to the settings menu so the existing teammates pane remains the source of truth for invitation details while the nav now exposes that state earlier.
- Verification:
- `pnpm exec eslint components/settings/SettingsDialog.tsx components/settings/shared/SettingsSidebarNav.tsx` in `apps/project-dashboard` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "components/settings/(SettingsDialog|shared/SettingsSidebarNav)\\.tsx" || true` in `apps/project-dashboard` returned no matches ✅
- Chrome DevTools verification:
- opened the settings dialog from `http://localhost:3000/w/69c0b60618cdd085fd1e2aac`
- confirmed the sidebar shows `Teammates 1`
- confirmed the teammates pane shows `Pending Invitations` count `1`, matching the menu badge ✅

# Onboarding Invitation Delivery Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect the onboarding invite step, workspace invitation flow, and notifications layer
- [x] Confirm invite emails are currently only persisted in onboarding answers and never delivered
- [x] Identify the lowest-risk integration point: process onboarding invitees during onboarding completion

### 2. Fix
- [x] Create real workspace invitations from saved onboarding invitees when onboarding completes
- [x] Send in-app notifications to invited users that already exist in the system
- [x] Update the onboarding invite step copy so the UX reflects real delivery behavior

### 3. Verification
- [x] Run targeted backend/frontend checks for the touched files
- [x] Verify the onboarding invite UX and recipient notification behavior in Chrome DevTools
- [x] Record results and remaining gaps

## Review / Results
- Updated onboarding completion in `apps/api/src/onboarding/onboarding.service.ts` so saved invitee emails are converted into real workspace invitations as part of the existing setup-complete path.
- Added recipient-targeted notification creation in `apps/api/src/notifications/notifications.service.ts` and `apps/api/src/notifications/notifications.repository.ts`, then used that path from onboarding so existing users receive an in-app invite notification even before they are members of the target workspace.
- Kept onboarding invite notifications user-scoped and global (`workspaceId: null`) so invited users can see the invite from their current workspace instead of depending on access to the destination workspace first.
- Updated `apps/project-dashboard/components/onboarding/OnboardingPage.tsx` copy so the pending invite step and review state clearly explain that setup completion will deliver invitations and notifications.
- Added/updated backend regression coverage in `apps/api/src/onboarding/onboarding.service.spec.ts` for invite creation plus notification delivery to existing users.
- Verification:
- `pnpm exec eslint src/notifications/notifications.repository.ts src/notifications/notifications.service.ts src/onboarding/onboarding.service.ts src/onboarding/onboarding.service.spec.ts` in `apps/api` ✅
- `pnpm test -- onboarding.service.spec.ts` in `apps/api` ✅
- `pnpm exec eslint components/onboarding/OnboardingPage.tsx` in `apps/project-dashboard` ✅
- Chrome DevTools verification:
- inviter onboarding sessions completed without showing a self-notification badge afterward
- invited local dev user `dev@life-dashboard.local` saw `Workspace invitation: Dev Invite E2E's Workspace` in `/w/69c0b60618cdd085fd1e2aac/notifications` with unread count `1` ✅
- Remaining gaps:
- Users who do not already have an account still only receive the stored workspace invitation record; email delivery is still a separate follow-up if external invite emails are required.

# Frontend Typecheck Recovery Plan

## Status: COMPLETE

### 1. Audit
- [x] Re-run repo verification to capture the current failing typecheck and lint surfaces
- [x] Confirm the main blockers are concentrated in frontend chat, task client contracts, and strict null-safety errors

### 2. Fix
- [x] Align chat UI components with the shared chat types and add any missing UI/dependency pieces needed for compilation
- [x] Fix the task client response-shape mismatch and any related query contract issues
- [x] Resolve strict TypeScript failures in project wizard, gantt, workstream, and combobox components

### 3. Verification
- [x] Run targeted frontend typecheck/lint on the touched files
- [x] Run repo-level `pnpm check-types`
- [x] Record results and any remaining gaps

## Review / Results
- Added a shared `ScrollArea` implementation at `apps/project-dashboard/components/ui/scroll-area.tsx` so the chat components compile against the local UI library again.
- Aligned the chat frontend types and components in `apps/project-dashboard/lib/chat/*` and `apps/project-dashboard/app/w/[workspaceId]/chat/components/*` with the currently available backend contract: lowercase channel types, optional unread counts, message rendering without a nested author object, and a typed fallback declaration for the currently uninstalled `socket.io-client` module.
- Fixed the task detail client in `apps/project-dashboard/lib/tasks/tasks-client.ts` to return the unwrapped task payload instead of the full API envelope.
- Removed the strict TypeScript failures in `StepOwnership`, `StepQuickCreate`, `TimelineGantt`, `UploadAudioModal`, `WorkstreamTab`, `timeline-bar`, and `combobox` by replacing unsafe indexed access and optional reads with explicit guarded values.
- Verification:
- `pnpm exec tsc --noEmit 2>&1 | rg "app/w/\\[workspaceId\\]/chat/components/ChannelSidebar|app/w/\\[workspaceId\\]/chat/components/MessageList|lib/chat/(chat-query|types|use-chat-socket)|lib/tasks/tasks-client|components/project-wizard/steps/StepOwnership|components/project-wizard/steps/StepQuickCreate|components/projects/(TimelineGantt|UploadAudioModal|WorkstreamTab)|components/timeline-bar|components/ui/combobox|components/ui/scroll-area|types/socket.io-client"` in `apps/project-dashboard` returned no matches ✅
- `pnpm exec eslint 'app/w/[workspaceId]/chat/components/ChannelSidebar.tsx' 'app/w/[workspaceId]/chat/components/MessageList.tsx' lib/chat/chat-client.ts lib/chat/chat-query.ts lib/chat/types.ts lib/tasks/tasks-client.ts components/project-wizard/steps/StepOwnership.tsx components/project-wizard/steps/StepQuickCreate.tsx components/projects/TimelineGantt.tsx components/projects/UploadAudioModal.tsx components/projects/WorkstreamTab.tsx components/timeline-bar.tsx components/ui/combobox.tsx components/ui/scroll-area.tsx types/socket.io-client.d.ts` in `apps/project-dashboard` completed with warnings only ✅
- `pnpm check-types` at repo root ✅
- `pnpm lint` at repo root completed with existing warnings only ✅
- Remaining gaps:
- The repo still has lint-warning debt, especially React `prop-types` warnings in TypeScript files, unused imports/variables, and some `no-img-element` warnings in the project wizard and auth dialog flows.
- `apps/project-dashboard/lib/chat/use-chat-socket.ts` now typechecks via a local declaration file, but the package is still not installed; if the chat socket hook becomes part of an active route, add the real `socket.io-client` dependency instead of relying on the shim.

# Auth Success Workspace Cache Refresh Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect the frontend auth success mutations and confirm which paths currently refresh cached auth state
- [x] Confirm the workspace React Query key factory to use for targeted invalidation

### 2. Fix
- [x] Invalidate workspace queries when authentication succeeds so workspace-bound screens refetch the latest data
- [x] Keep the change scoped to the shared auth query layer used by sign-in flows

### 3. Verification
- [x] Run targeted frontend lint and TypeScript checks on the touched auth query file
- [x] Record results

## Review / Results
- Updated `apps/project-dashboard/lib/auth/auth-query.ts` so successful `useLoginMutation` and `useDevBootstrapMutation` paths now invalidate both `auth/me` and the workspace query namespace after persisting fresh auth tokens.
- Centralized that behavior behind a small `invalidateAuthenticatedQueries()` helper so the sign-in flows stay consistent and the workspace cache refresh logic only lives in one place.
- Verification:
- `pnpm exec eslint lib/auth/auth-query.ts` in `apps/project-dashboard` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "lib/auth/auth-query\\.ts" || true` in `apps/project-dashboard` returned no matches ✅
- `pnpm exec tsc --noEmit` in `apps/project-dashboard` still fails due to pre-existing unrelated TypeScript errors in project/chat/task files; this change did not add any new reported errors for `lib/auth/auth-query.ts`.

# Frontend Onboarding Integration Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect auth provider, auth guards, protected shell, and workspace route helpers
- [x] Confirm the frontend currently assumes a workspace context exists once the user is authenticated
- [x] Identify the new backend contract to consume: onboarding summary from `GET /auth/me` plus `GET /onboarding/me`, `POST /onboarding/start`, `PATCH /onboarding/steps/:step`, and `POST /onboarding/complete`

### 2. Frontend integration
- [x] Extend auth types and auth flow to carry onboarding summary state
- [x] Redirect incomplete users into a dedicated onboarding page before workspace-bound routes render
- [x] Add onboarding client/query hooks and a minimal onboarding setup page wired to the backend
- [x] Keep the protected shell usable by bypassing workspace/sidebar assumptions while onboarding is incomplete

### 3. Verification
- [x] Run targeted frontend lint and TypeScript checks
- [x] Verify the onboarding redirect and setup flow in Chrome DevTools
- [x] Record results and remaining gaps

## Review / Results
- Extended `apps/project-dashboard/lib/auth/types.ts` so `AuthUser` now carries the backend onboarding summary from `GET /auth/me`.
- Added a new onboarding frontend data layer in `apps/project-dashboard/lib/onboarding/*` with typed clients, query keys, mutations, and redirect helpers aligned to:
- `GET /onboarding/me`
- `POST /onboarding/start`
- `PATCH /onboarding/steps/:step`
- `POST /onboarding/complete`
- Updated `apps/project-dashboard/components/auth/auth-guard.tsx` so authenticated users with `user.onboarding.requiresOnboarding` are redirected to `/onboarding?next=...` before protected workspace routes render, and users who already completed onboarding are redirected away from `/onboarding`.
- Updated `apps/project-dashboard/components/auth/auth-shell.tsx` so onboarding uses a simplified protected shell without `WorkspaceRouteBoundary` or the sidebar while setup is incomplete.
- Added a dedicated onboarding route in `apps/project-dashboard/app/(protected)/onboarding/page.tsx` and the setup UI in `apps/project-dashboard/components/onboarding/OnboardingPage.tsx`.
- The onboarding page now:
- auto-starts a missing onboarding session
- persists profile, workspace, preferences, and invite-planning steps
- applies the workspace-name step through backend completion
- returns the user to the intended post-onboarding workspace route
- Verification:
- `pnpm exec eslint components/auth/auth-guard.tsx components/auth/auth-shell.tsx components/onboarding/OnboardingPage.tsx components/providers/auth-provider.tsx lib/auth/types.ts lib/onboarding/onboarding-client.ts lib/onboarding/onboarding-query.ts lib/onboarding/onboarding-utils.ts lib/onboarding/types.ts 'app/(protected)/onboarding/page.tsx'` in `apps/project-dashboard` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "components/(auth/auth-guard|auth/auth-shell|onboarding/OnboardingPage|providers/auth-provider)\\.tsx|lib/(auth/types|onboarding/)|app/\\(protected\\)/onboarding/page\\.tsx"` in `apps/project-dashboard` returned no matches ✅
- Chrome DevTools:
- opened `/login` and bootstrapped the local dev session
- created a live onboarding session for the current user through `POST http://localhost:3001/api/v1/onboarding/start`
- navigated to `/w/69c0b60618cdd085fd1e2aac/projects` and confirmed the frontend redirected to `/onboarding?next=...` before the projects page rendered
- completed the onboarding steps in the UI, including changing the workspace name to `Launch Pad`
- confirmed `Complete setup` redirected back to `/w/69c0b60618cdd085fd1e2aac/projects`
- confirmed the sidebar workspace switcher now shows `Launch Pad`
- confirmed revisiting `/onboarding` after completion redirects back into the workspace route
- Remaining gaps:
- Invite emails are stored in onboarding step answers only; the frontend does not yet send real workspace invitations from the onboarding flow.
- Chrome still reports one generic form-field `id`/`name` issue in the page console, but it did not block the onboarding flow in this pass.

# ChatModule Workspace Guard DI Fix Plan

## Status: COMPLETE

### 1. Audit
- [x] Trace the Nest DI error to `WorkspaceAccessGuard` being used inside `ChatController`
- [x] Confirm `ChatModule` does not currently import the module that exports `WorkspacesService`

### 2. Fix
- [x] Import the correct workspace module into `ChatModule`
- [x] Add or update a focused regression check for the chat module wiring if needed

### 3. Verification
- [x] Run targeted backend checks for the chat/workspace module slice
- [x] Record results

## Review / Results
- Imported `WorkspacesModule` into `apps/api/src/chat/chat.module.ts`, which makes the exported `WorkspacesService`, `WorkspaceAccessGuard`, and related workspace guard dependencies available inside the `ChatModule` DI context.
- Added `apps/api/src/chat/chat.module.spec.ts` to assert that `ChatModule` imports `WorkspacesModule`, so the workspace-guard dependency path is covered by a focused regression test.
- Cleaned existing lint debt in `apps/api/src/chat/chat.controller.ts` and formatting in `apps/api/src/chat/chat.module.ts` while verifying the slice.
- Verification:
- `pnpm test -- chat.module.spec.ts` in `apps/api` ✅
- `pnpm exec eslint src/chat/chat.module.ts src/chat/chat.module.spec.ts src/chat/chat.controller.ts src/workspaces/workspaces.module.ts src/workspaces/guards/workspace-access.guard.ts` in `apps/api` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "src/(chat/chat.module|chat/chat.module.spec|chat/chat.controller|workspaces/workspaces.module|workspaces/guards/workspace-access.guard)"` in `apps/api` returned no matches ✅

# Onboarding Backend Next Phase Plan

## Status: COMPLETE

### 1. Boundary cleanup
- [x] Remove hidden workspace provisioning from auth session/profile reads
- [x] Remove hidden workspace provisioning from workspace listing and access-resolution fallback paths
- [x] Replace silent workspace creation with explicit onboarding state for incomplete users

### 2. Onboarding APIs
- [x] Add a read endpoint for current onboarding state
- [x] Add step persistence for onboarding answers and completed steps
- [x] Add onboarding completion that finalizes session state and applies workspace basics

### 3. Verification
- [x] Add targeted regression coverage for the new onboarding/auth/workspace behavior
- [x] Run targeted backend lint, tests, and TypeScript checks
- [x] Record results and follow-up gaps

## Review / Results
- Updated `apps/api/src/auth/auth.service.ts` and `apps/api/src/auth/auth.module.ts` so auth token issuance and `GET /auth/me` no longer silently provision a workspace. `GET /auth/me` now returns explicit onboarding summary state instead.
- Extended `apps/api/src/onboarding/*` with:
- `GET /onboarding/me`
- `PATCH /onboarding/steps/:step`
- `POST /onboarding/complete`
- `OnboardingSummaryDto`
- `OnboardingStateResponseDto`
- `UpdateOnboardingStepDto`
- `OnboardingService` now supports read state, step persistence, and completion. Completion applies saved workspace-name basics from onboarding answers before marking the session completed.
- Updated `apps/api/src/workspaces/workspaces.service.ts` so workspace listing and access-context resolution no longer auto-create a default workspace. Incomplete users now get an explicit `Workspace setup is incomplete` failure instead of a hidden side effect.
- Extended regression coverage in:
- `apps/api/src/auth/auth.service.spec.ts`
- `apps/api/src/onboarding/onboarding.service.spec.ts`
- `apps/api/src/workspaces/workspaces.service.spec.ts`
- `apps/api/src/workspaces/workspace-provisioning.service.spec.ts`
- Verification:
- `pnpm test -- auth.service.spec.ts onboarding.service.spec.ts workspaces.service.spec.ts workspace-provisioning.service.spec.ts` in `apps/api` ✅
- `pnpm exec eslint src/auth/auth.module.ts src/auth/auth.service.ts src/auth/auth.service.spec.ts src/workspaces/workspaces.service.ts src/workspaces/workspaces.service.spec.ts src/workspaces/workspace-provisioning.service.ts src/workspaces/workspace-provisioning.service.spec.ts src/onboarding/onboarding.module.ts src/onboarding/onboarding.controller.ts src/onboarding/onboarding.service.ts src/onboarding/onboarding.service.spec.ts src/onboarding/dto/onboarding-session-response.dto.ts src/onboarding/dto/onboarding-state-response.dto.ts src/onboarding/dto/onboarding-summary.dto.ts src/onboarding/dto/update-onboarding-step.dto.ts src/onboarding/schemas/onboarding-session.schema.ts src/users/dto/user-response.dto.ts` in `apps/api` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "src/(auth/auth.module|auth/auth.service|auth/auth.service.spec|workspaces/workspaces.service|workspaces/workspaces.service.spec|workspaces/workspace-provisioning.service|workspaces/workspace-provisioning.service.spec|onboarding/|users/dto/user-response.dto)"` in `apps/api` returned no matches ✅
- Remaining gaps:
- There is still no dedicated workspace settings model, so onboarding completion only applies workspace basics from saved answers instead of persisting richer setup preferences yet.
- The frontend still needs to consume the new onboarding summary and onboarding endpoints so incomplete users are redirected into setup instead of falling into protected workspace routes.

# Onboarding Backend Foundation Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect the current registration flow and workspace provisioning path
- [x] Confirm workspace creation currently happens during registration and is also repaired on later auth/workspace reads
- [x] Identify the lowest-risk foundation change: extract provisioning, stop provisioning during registration, and add onboarding session start

### 2. Backend foundation
- [x] Extract a dedicated workspace provisioning service from the default-workspace creation path
- [x] Remove workspace provisioning from user registration
- [x] Add onboarding session persistence for backend-driven setup state
- [x] Add a protected `POST /onboarding/start` endpoint that provisions/resumes onboarding explicitly

### 3. Verification
- [x] Add targeted regression coverage for the changed auth/onboarding behavior
- [x] Run targeted backend lint, tests, and TypeScript checks
- [x] Record results and follow-up gaps

## Review / Results
- Extracted workspace provisioning into `apps/api/src/workspaces/workspace-provisioning.service.ts` and wired `WorkspacesService` to delegate default-workspace provisioning through that dedicated service.
- Updated `apps/api/src/auth/auth.service.ts` so registration no longer creates a workspace before verification. Workspace provisioning remains available through the dedicated provisioning service for the existing authenticated/session flows.
- Added a new onboarding backend slice in `apps/api/src/onboarding/*` with:
- `OnboardingSession` persistence
- `OnboardingService`
- `OnboardingController`
- `POST /onboarding/start`
- `POST /onboarding/start` now provisions or resolves the user’s initial workspace explicitly and creates or resumes a durable onboarding session linked to that workspace.
- Added regression tests in `apps/api/src/auth/auth.service.spec.ts` and `apps/api/src/onboarding/onboarding.service.spec.ts` to cover:
- registration no longer provisioning a workspace
- onboarding start creating a session from a provisioned workspace
- Added regression coverage in `apps/api/src/workspaces/workspace-provisioning.service.spec.ts` and updated `apps/api/src/workspaces/workspaces.service.spec.ts` so the extracted provisioning service and delegation path are both exercised.
- Verification:
- `pnpm test -- auth.service.spec.ts onboarding.service.spec.ts workspace-provisioning.service.spec.ts` in `apps/api` ✅
- `pnpm exec eslint src/auth/auth.service.ts src/auth/auth.service.spec.ts src/workspaces/workspaces.module.ts src/workspaces/workspaces.service.ts src/workspaces/workspaces.service.spec.ts src/workspaces/workspace-provisioning.service.ts src/workspaces/workspace-provisioning.service.spec.ts src/onboarding/onboarding.module.ts src/onboarding/onboarding.controller.ts src/onboarding/onboarding.service.ts src/onboarding/onboarding.service.spec.ts src/onboarding/dto/onboarding-session-response.dto.ts src/onboarding/schemas/onboarding-session.schema.ts src/app.module.ts` in `apps/api` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "src/(auth/auth.service|auth/auth.service.spec|workspaces/workspaces.module|workspaces/workspaces.service|workspaces/workspaces.service.spec|workspaces/workspace-provisioning.service|workspaces/workspace-provisioning.service.spec|onboarding/|app.module.ts)"` in `apps/api` returned no matches ✅
- Remaining gaps:
- Auth/session and workspace-read paths still perform default workspace provisioning for backward compatibility. The next onboarding phase should remove those hidden repair paths and shift frontend routing to explicit onboarding state.
- There is only a `start` endpoint so far. Step persistence, completion, and workspace settings application still need to be added in later phases.

# Journal Analytics Alignment Plan

## Status: COMPLETE

### 1. Audit
- [x] Confirm the current journal mood summary endpoint only follows the analytics date window
- [x] Review the journal page query state to identify the active search, tag, and mood filters that should also drive analytics

### 2. Backend
- [x] Extend the mood summary query DTO and repository methods to support mood, tag, and search filters
- [x] Keep the analytics aggregation scoped to the same filtered journal entry set as the list view

### 3. Frontend
- [x] Pass the active journal filters into the mood summary query
- [x] Keep the empty, loading, and analytics states stable while filtered analytics refresh

### 4. Verification
- [x] Run targeted backend/frontend checks for the touched journal files
- [x] Verify in Chrome DevTools that analytics change when search/tag/mood filters change
- [x] Record results and remaining risks

## Review / Results
- Extended `apps/api/src/journal-entries/dto/mood-summary.dto.ts` so the mood summary endpoint accepts the same `mood`, `tag`, and `search` filters as the journal list query, in addition to the existing date window.
- Refactored `apps/api/src/journal-entries/journal-entries.repository.ts` to share one journal-entry filter builder across list, summary, and trend queries so analytics and visible entries are scoped the same way.
- Updated `apps/api/src/journal-entries/journal-entries.service.ts` to forward the full mood summary query object to the repository, and added a regression test in `apps/api/src/journal-entries/journal-entries.service.spec.ts` covering filter forwarding.
- Updated `apps/project-dashboard/components/journal/JournalEntriesPage.tsx` and `apps/project-dashboard/lib/journal-entries/types.ts` so the mood summary React Query request now includes the active search, tag, and mood filters along with the selected analytics window.
- During browser verification, found and fixed a repository bug where the mood trend aggregation overwrote an explicit mood filter with `mood exists`, which caused the cards to update but not the trend. The fix now preserves explicit mood filters and only applies the existence condition when no mood filter is set.
- Verification:
- `pnpm test -- journal-entries.service.spec.ts` in `apps/api` ✅
- `pnpm exec eslint src/journal-entries/dto/mood-summary.dto.ts src/journal-entries/journal-entries.repository.ts src/journal-entries/journal-entries.service.ts src/journal-entries/journal-entries.service.spec.ts` in `apps/api` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "src/journal-entries/(dto/mood-summary|journal-entries.repository|journal-entries.service|journal-entries.service.spec)"` in `apps/api` returned no matches ✅
- `pnpm exec eslint components/journal/JournalEntriesPage.tsx lib/journal-entries/types.ts lib/journal-entries/journal-entries-client.ts lib/journal-entries/journal-entries-query.ts` in `apps/project-dashboard` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "components/journal/JournalEntriesPage.tsx|lib/journal-entries/"` in `apps/project-dashboard` returned no matches ✅
- Chrome DevTools on `http://localhost:3000/w/69bf9af23810b45fcb4d7caa/journal`:
- confirmed the default analytics still show both entries
- applied the `Good` mood filter and confirmed the summary cards and trend update to the single matching entry (`4.0 / 5`, `1` entry, `Good`, trend `4.0`)
- applied a `hello` text search and confirmed the analytics shift to the single matching entry (`1.0 / 5`, `1` entry, `Very Bad`, trend `1.0`)
- Remaining risks:
- The page now keeps analytics aligned to search, tag, mood, and analytics-window filters, but it still intentionally does not couple analytics to pagination because the summary endpoint aggregates over the full filtered dataset.

# Journal Entries Wellness Feature Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect `apps/api/src/journal-entries/*` to confirm create/list/update/delete and mood summary requirements
- [x] Review current dashboard routing, sidebar, and page patterns for a wellness feature entry point
- [x] Confirm live browser blocker after implementation and trace it to the notifications dropdown response shape

### 2. Backend support
- [x] Normalize journal entry service responses into stable DTO payloads for create/read/list/update paths
- [x] Add controller-level ObjectId validation for journal entry detail/update/delete routes
- [x] Add targeted backend regression coverage for serialized journal entry responses

### 3. Frontend integration
- [x] Add journal entry frontend types, API helpers, and TanStack Query hooks aligned to the backend contract
- [x] Add workspace route and sidebar wiring for the journal page
- [x] Build the journal entries page with daily entry CRUD, mood selection, analytics cards, and tag-based organization
- [x] Fix the notifications dropdown pagination-shape bug blocking the live journal route

### 4. Verification
- [x] Run targeted backend checks on touched journal files
- [x] Run targeted frontend checks on touched journal and notification files
- [x] Validate journal entry creation, analytics, and tag filtering in Chrome DevTools
- [x] Record results and remaining risks

## Review / Results
- Added stable backend serialization for journal entry create/read/list/update responses in `apps/api/src/journal-entries/journal-entries.service.ts` and controller-level ObjectId validation in `apps/api/src/journal-entries/journal-entries.controller.ts`.
- Added regression coverage in `apps/api/src/journal-entries/journal-entries.service.spec.ts` to lock the serialized journal DTO shape.
- Added a dedicated frontend journal data layer in `apps/project-dashboard/lib/journal-entries/*` with typed API helpers and TanStack Query hooks for list, detail, mood summary, create, update, and delete operations.
- Added the workspace journal routes and sidebar navigation wiring, then built `apps/project-dashboard/components/journal/JournalEntriesPage.tsx` with:
- daily journal entry create, edit, and delete flows
- five-level mood selection
- mood analytics summary cards, distribution, and day-by-day trend
- tag chips and tag filter organization
- search, mood filtering, and analytics time-window controls
- While validating the live page, found an unrelated runtime blocker in the notifications dropdown. Fixed `apps/project-dashboard/lib/notifications/notifications-client.ts` to normalize paginated notification responses before UI components consume them, which unblocked the journal route and protected the inbox/dropdown surfaces from the same shape mismatch.
- Tightened the journal empty state so filtered-empty results now show `No entries match these filters` with a `Reset filters` action instead of the misleading first-run empty state.
- Verification:
- `pnpm test -- journal-entries.service.spec.ts` in `apps/api` ✅
- `pnpm exec eslint src/journal-entries/journal-entries.controller.ts src/journal-entries/journal-entries.service.ts src/journal-entries/journal-entries.service.spec.ts` in `apps/api` ✅
- `pnpm exec eslint components/journal/JournalEntriesPage.tsx lib/journal-entries/journal-entries-client.ts lib/journal-entries/journal-entries-query.ts lib/journal-entries/types.ts lib/notifications/notifications-client.ts components/notifications/NotificationsDropdown.tsx components/app-sidebar.tsx lib/data/sidebar.ts 'app/(protected)/journal/page.tsx' 'app/(protected)/w/[workspaceId]/journal/page.tsx'` in `apps/project-dashboard` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "components/journal/JournalEntriesPage.tsx|lib/journal-entries/|lib/notifications/notifications-client.ts|components/notifications/NotificationsDropdown.tsx|components/app-sidebar.tsx|lib/data/sidebar.ts|app/\\(protected\\)/journal/page.tsx|app/\\(protected\\)/w/\\[workspaceId\\]/journal/page.tsx"` in `apps/project-dashboard` returned no matches ✅
- Chrome DevTools on `http://localhost:3000/w/69bf9af23810b45fcb4d7caa/journal`:
- confirmed the page renders without the previous notifications runtime exception
- created journal entries with different moods and tags, confirming summary cards, distribution, and mood trend updates
- verified tag-based filtering and the filtered-empty `Reset filters` recovery path
- edited an entry successfully and deleted a filtered entry successfully
- Remaining risks:
- Mood analytics currently follow the selected analytics window but not the current search/tag/mood list filters. That is consistent with the current page design, but if product expectations shift toward filter-coupled analytics, the summary query will need to incorporate those controls.

# Notifications UX Improvement Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect the existing sidebar inbox badge and workspace inbox page
- [x] Confirm the backend notifications module already supports list, unread count, mark read, and mark all read
- [x] Identify the frontend gaps as missing notification query/client wiring and mock inbox state

### 2. Frontend integration
- [x] Add a notifications frontend data layer with unread count and read-state mutations
- [x] Replace the hardcoded sidebar inbox badge with the real unread count
- [x] Add a notifications dropdown and refactor the inbox page to use the real notifications API
- [x] Support mark-all-as-read from both the dropdown and inbox page

### 3. Verification
- [x] Run targeted frontend checks on the touched notification files
- [x] Validate notification creation, unread counts, and mark-all-read behavior in Chrome DevTools
- [x] Record results and remaining risks

## Review / Results
- Added a dedicated notifications frontend data layer in `apps/project-dashboard/lib/notifications/*` with typed list and unread-count queries plus mutations for single-notification read state and mark-all-read.
- Replaced the hardcoded `Inbox` badge in `apps/project-dashboard/lib/data/sidebar.ts` and `apps/project-dashboard/components/app-sidebar.tsx` with the real unread count from the notifications API.
- Added a new sidebar notifications dropdown in `apps/project-dashboard/components/notifications/NotificationsDropdown.tsx` that shows recent notifications, the live unread count, a direct link into the inbox page, and a mark-all-read action.
- Rebuilt `apps/project-dashboard/components/inbox/InboxPage.tsx` to use the real notifications API instead of the old mock inbox state. The page now supports:
- live unread count
- live notifications list
- type filtering
- read/unread state changes on selection and detail actions
- page-level mark-all-as-read
- related-work links when notification payloads include a path or href
- Simplified `apps/project-dashboard/components/inbox/InboxFilterPopover.tsx` to focus on real notification type filters instead of the old mock client/type filter model.
- Verification:
- `pnpm exec eslint components/app-sidebar.tsx components/inbox/InboxPage.tsx components/inbox/InboxFilterPopover.tsx components/notifications/NotificationsDropdown.tsx lib/data/sidebar.ts lib/notifications/notification-utils.tsx lib/notifications/notifications-client.ts lib/notifications/notifications-query.ts lib/notifications/types.ts` in `apps/project-dashboard` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "components/(app-sidebar|inbox/InboxPage|inbox/InboxFilterPopover|notifications/NotificationsDropdown)\\.tsx|lib/(data/sidebar|notifications/)"` in `apps/project-dashboard` returned no matches ✅
- Chrome DevTools on `http://localhost:3000/w/69bf9af23810b45fcb4d7caa/inbox`:
- created three real notifications through `POST /api/v1/notifications` in the authenticated browser session to seed verification data
- confirmed the sidebar `Inbox` badge updated from the real unread count to `3`
- confirmed the new notifications dropdown showed the three recent notifications and its own mark-all-read action
- confirmed the inbox page listed the seeded notifications with `3 unread`
- toggled one notification unread via `PATCH /api/v1/notifications/:id/read` and confirmed both the sidebar count and page count updated to `1`
- used the page-level `Mark all as read` action and confirmed `POST /api/v1/notifications/mark-all-read` returned `200`, the unread count dropped back to `0`, and the `Inbox` badge disappeared
- Remaining risks:
- The inbox page currently fetches the first 100 notifications and applies type filters client-side. If notification volume grows beyond that, the page should move to server-side filtering and pagination controls rather than a single-page list.

# Verify Email OTP Refactor Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect the current verify-email form and existing auth flow wiring
- [x] Confirm a local shadcn `InputOTP` component already exists in the project
- [x] Attempt to fetch shadcn docs for `input-otp` and fall back to local component patterns when the CLI is blocked

### 2. Frontend refactor
- [x] Replace the raw verification code input with the shadcn OTP input composition
- [x] Keep React Hook Form and validation behavior intact for verify and resend actions
- [x] Align the form layout with the repo’s shadcn spacing and field conventions

### 3. Verification
- [x] Run targeted frontend lint/type checks on the touched auth files
- [x] Validate the updated verify-email UI in Chrome DevTools
- [x] Record results and remaining risks

## Review / Results
- Refactored `apps/project-dashboard/components/auth/VerifyEmailForm.tsx` to use the local shadcn `InputOTP` composition instead of a plain text input for the six-digit verification code.
- Kept the existing auth flow intact by wiring the OTP input through `react-hook-form` `Controller`, preserving the current verify mutation, resend mutation, validation schema, and form reset behavior after successful verification.
- Added numeric-only OTP input constraints with `REGEXP_ONLY_DIGITS`, kept `autoComplete="one-time-code"`, and cleared stale root-level verification errors as soon as the code changes.
- Aligned the form layout with the repo’s current shadcn conventions by replacing `space-y-*` with `flex flex-col gap-*` and using the existing `Field`, `FieldDescription`, and OTP slot primitives already installed in the project.
- Verification:
- `pnpm exec eslint components/auth/VerifyEmailForm.tsx` in `apps/project-dashboard` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "components/auth/VerifyEmailForm.tsx"` in `apps/project-dashboard` returned no matches ✅
- Chrome DevTools:
- opened `http://localhost:3000/verify-email?email=dev%40life-dashboard.local`
- confirmed the OTP field renders with six visual slots plus the existing email and action buttons
- filled `123456` into the OTP field and confirmed the slot UI updated to display all six digits
- Remaining risks:
- The shadcn CLI docs fetch for `input-otp` could not complete because npm registry DNS resolution is blocked locally (`ENOTFOUND`), so this refactor used the repo’s installed `components/ui/input-otp.tsx` implementation and the local `input-otp` package docs instead of remote registry metadata.

# Dev Auth Bootstrap Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect backend auth/user services and current login form flow
- [x] Confirm the browser verification blocker is the lack of a reliable local dev account/bootstrap path

### 2. Backend
- [x] Add a development-only auth bootstrap endpoint that returns usable session tokens
- [x] Add targeted backend regression coverage for the dev bootstrap flow

### 3. Frontend
- [x] Add auth client/query support for the dev bootstrap endpoint
- [x] Add a login-page helper UI using existing shadcn components to trigger the bootstrap flow

### 4. Verification
- [x] Run targeted frontend/backend checks
- [x] Validate the bootstrap flow in Chrome DevTools
- [x] Record results and remaining risks

## Review / Results
- Added a development-only `POST /auth/dev-bootstrap` endpoint in `apps/api/src/auth/auth.controller.ts` and `apps/api/src/auth/auth.service.ts`. In development, it creates or reuses `dev@life-dashboard.local`, verifies the account if needed, ensures a default workspace exists, and returns live access/refresh tokens. Outside development it returns `404` to avoid exposing the helper in non-local environments.
- Added backend regression coverage in `apps/api/src/auth/auth.service.spec.ts` for both the happy path and the non-development rejection path.
- Added frontend auth integration in `apps/project-dashboard/lib/auth/auth-client.ts` and `apps/project-dashboard/lib/auth/auth-query.ts`, including token persistence and `auth/me` invalidation after the bootstrap mutation succeeds.
- Updated `apps/project-dashboard/components/auth/LoginForm.tsx` to expose a localhost-only `Local Dev Access` helper card using existing local shadcn primitives. The form layout was also aligned with the project’s shadcn spacing/icon guidance by using `gap-*` layout and a button icon with `data-icon`.
- Verification:
- `pnpm test -- auth.service.spec.ts` in `apps/api` ✅
- `pnpm exec eslint src/auth/auth.controller.ts src/auth/auth.service.ts src/auth/auth.service.spec.ts` in `apps/api` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "src/auth/(auth.controller|auth.service|auth.service.spec)"` in `apps/api` returned no matches ✅
- `pnpm exec eslint components/auth/LoginForm.tsx lib/auth/auth-client.ts lib/auth/auth-query.ts` in `apps/project-dashboard` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "components/auth/LoginForm.tsx|lib/auth/auth-client.ts|lib/auth/auth-query.ts"` in `apps/project-dashboard` returned no matches ✅
- Chrome DevTools:
- opened `http://localhost:3000/login?next=%2Fw%2F69bf9af23810b45fcb4d7caa%2Fbudgets`
- triggered `Use local development account`
- confirmed `POST http://localhost:3001/api/v1/auth/dev-bootstrap` returned `200`
- confirmed redirect into a newly created local workspace at `/w/69c0b60618cdd085fd1e2aac/budgets`
- created a budget successfully via `POST /api/v1/budgets` with a `201` response
- toggled that budget inactive via `PATCH /api/v1/budgets/69c0b61318cdd085fd1e2adf` with a `200` response and confirmed it disappeared from the default `Active` filter
- Remaining risks:
- The helper is intentionally limited to `localhost` on the frontend and `development` on the backend. If the local app is served from a different host alias later, the frontend hostname gate will need to be widened deliberately.

# Budget Management Frontend Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect `apps/api/src/budgets/*` to confirm list, summary, create, update, and delete requirements
- [x] Review existing dashboard route, sidebar, and TanStack Query patterns to mirror for the new budget page

### 2. Frontend integration
- [x] Add budget frontend types, API helpers, and TanStack Query hooks aligned to the backend contract
- [x] Add workspace route and sidebar wiring for the new budget page
- [x] Build a budget management page with summary metrics, filters, and create/edit/delete flows

### 3. Backend support
- [x] Fix any budget response-path issues that would block the frontend from working end to end

### 4. Verification
- [x] Run targeted frontend and backend checks on the touched budget files
- [x] Review the rendered budget page in Chrome DevTools
- [x] Record results and remaining risks

## Review / Results
- Added a dedicated budget frontend data layer in `apps/project-dashboard/lib/budgets/*` with:
- typed budget and budget-summary models
- API client helpers for list/detail/summary/create/update/delete
- TanStack Query hooks using hierarchical query keys, query placeholder retention, and targeted invalidation for list/summary/detail caches
- Added full routing and navigation support for budgets:
- `app/(protected)/budgets/page.tsx` redirect
- `app/(protected)/w/[workspaceId]/budgets/page.tsx`
- sidebar navigation entry and route activation wiring
- Built a new budget management page in `components/budgets/BudgetsPage.tsx` with:
- summary cards for planned, spent, remaining, and over-budget counts
- search plus status / period / category filters
- create and edit dialog
- activate / deactivate action
- delete confirmation
- responsive budget cards showing planned spend, actual spend, remaining amount, utilization, date window, and category/period badges
- The budgets backend also needed the same response normalization fix previously seen in habits/goals. Updated `apps/api/src/budgets/budgets.service.ts` and `apps/api/src/budgets/dto/budget-response.dto.ts` so create/read/list/update/summary return stable serialized payloads with string ids and summary metrics. Added controller-level ObjectId validation in `apps/api/src/budgets/budgets.controller.ts` and a regression spec in `apps/api/src/budgets/budgets.service.spec.ts`.
- Verification:
- `pnpm exec eslint components/budgets/BudgetsPage.tsx lib/budgets/budgets-client.ts lib/budgets/budgets-query.ts lib/budgets/types.ts components/app-sidebar.tsx lib/data/sidebar.ts app/'(protected)'/budgets/page.tsx app/'(protected)'/w/'[workspaceId]'/budgets/page.tsx` in `apps/project-dashboard` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "components/budgets/BudgetsPage.tsx|lib/budgets/|components/app-sidebar.tsx|lib/data/sidebar.ts|app/\\(protected\\)/budgets/page.tsx|app/\\(protected\\)/w/\\[workspaceId\\]/budgets/page.tsx"` in `apps/project-dashboard` returned no matches ✅
- `pnpm test -- budgets.service.spec.ts` in `apps/api` ✅
- `pnpm exec eslint src/budgets/budgets.controller.ts src/budgets/budgets.service.ts src/budgets/budgets.service.spec.ts src/budgets/dto/budget-response.dto.ts` in `apps/api` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "src/budgets/(budgets.controller|budgets.service|budgets.service.spec|dto/budget-response.dto)"` in `apps/api` returned no matches ✅
- Chrome DevTools:
- confirmed the new `/w/[workspaceId]/budgets` route resolves in the running app build
- could not complete an authenticated in-browser budget CRUD pass because the current browser session redirected to `/login` and the repository does not include a working dev credential for that live session
- Remaining risks:
- The browser-level budget page interactions were not fully exercised in an authenticated session, so the code and API contracts are verified, but a live CRUD walkthrough still depends on restoring a valid local login.
- Budget summary totals currently aggregate visible budgets even if multiple currencies are present. The UI flags mixed-currency cases, but it does not perform currency conversion.

# Goals Page Completion Plan

## Status: COMPLETE

### 1. Audit
- [x] Review `apps/project-dashboard/components/goals/GoalsPage.tsx` and the goals query/client layer
- [x] Confirm missing feature coverage versus backend capabilities and identify page-level state bugs

### 2. Frontend completion
- [x] Fix stale dialog/form state for create, edit, and log-progress flows
- [x] Add UI for linking and unlinking tasks/habits on goals
- [x] Improve page summaries and empty/error states around the completed feature set

### 3. Verification
- [x] Run targeted frontend lint/type checks on the touched goals files
- [x] Review the rendered goals page in Chrome DevTools
- [x] Record results and remaining risks

## Review / Results
- Fixed stale dialog state in `components/goals/GoalsPage.tsx` so the create/edit form and log-progress dialog reset correctly when reopening or switching between goals.
- Added a new `Manage Goal Links` dialog in `components/goals/GoalsPage.tsx` backed by the existing goals/task/habit query layer, including:
- task selection and linking
- habit selection and linking
- unlink by deselection
- goal-type gating for unsupported task/habit combinations
- Added visible summary cards and richer card badges for overdue state and linked task/habit counts, and improved error messaging to surface the actual request failure text when goals loading fails.
- During Chrome DevTools verification, `POST /api/v1/goals` initially still returned `500 Internal Server Error` for a valid create payload. Root cause was the backend goals module still returning raw Mongoose documents/aggregate objects rather than stable DTOs.
- Updated `apps/api/src/goals/goals.service.ts` and `apps/api/src/goals/dto/goal-response.dto.ts` to normalize create/read/list/update/log/link/unlink responses, including `type`, `workspaceId`, `linkedTasks`, `linkedHabits`, and computed `progressPercent`. Added a regression spec in `apps/api/src/goals/goals.service.spec.ts`.
- Chrome DevTools verification on `http://localhost:3000/w/69bf9af23810b45fcb4d7caa/goals`:
- confirmed the new summary cards render
- created a goal successfully after the backend fix
- opened the card menu and verified the new `Manage Links` action
- linked a task successfully and confirmed the card/summary counts updated
- Verification:
- `pnpm exec eslint components/goals/GoalsPage.tsx lib/goals/goals-client.ts lib/goals/goals-query.ts lib/goals/types.ts` in `apps/project-dashboard` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "components/goals/GoalsPage.tsx|lib/goals/"` in `apps/project-dashboard` returned no matches ✅
- `pnpm test -- goals.service.spec.ts` in `apps/api` ✅
- `pnpm exec eslint src/goals/goals.service.ts src/goals/goals.service.spec.ts src/goals/dto/goal-response.dto.ts` in `apps/api` ✅
- `pnpm exec tsc --noEmit 2>&1 | rg "src/goals/(goals.service|goals.service.spec|dto/goal-response.dto)"` in `apps/api` returned no matches ✅
- Remaining risks:
- The goals page currently loads only the first 100 tasks and first 100 active habits into the link dialog. If a workspace exceeds that, the linking UI will need search and pagination rather than a single-page selector.
- Chrome still reports a generic accessibility/dev warning that some form field is missing an `id` or `name`. The new goals flows worked despite that warning, but I did not trace that warning to a specific existing field in this pass.

# Goals Request Exception Fix Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect `apps/api/src/goals/goals.controller.ts` and the downstream service/repository path
- [x] Confirm the request exception comes from unvalidated Mongo ObjectId route params reaching Mongoose

### 2. Backend fix
- [x] Validate `goals` route params at the controller boundary with the shared ObjectId pipe
- [x] Keep the change minimal and localized to the failing request paths

### 3. Verification
- [x] Run targeted backend checks on the touched controller
- [x] Record results and remaining risks

## Review / Results
- Root cause: `GoalsController` forwarded raw `id`, `taskId`, and `habitId` params into repository methods that immediately construct `new Types.ObjectId(...)`. Invalid route params therefore surfaced as request-time Mongoose exceptions instead of a clean `400 Bad Request`.
- Updated `apps/api/src/goals/goals.controller.ts` to apply the shared `ParseObjectIdPipe` to every goal route param that becomes a Mongo ObjectId downstream: goal lookup, update, delete, progress logging, task linking/unlinking, and habit linking/unlinking.
- This keeps the fix localized to the request boundary and aligns the goals module with the existing shared validation pattern in `apps/api/src/common/pipes/parse-object-id.pipe.ts`.
- Verification:
- `pnpm exec eslint src/goals/goals.controller.ts` in `apps/api` ✅
- `pnpm exec tsc --noEmit` in `apps/api` ✅
- Remaining risks:
- Request body arrays such as `linkedTasks`, `linkedHabits`, `taskIds`, and `habitIds` are still validated by downstream logic rather than controller-level ObjectId pipes. That is outside this controller fix, but invalid IDs there can still fail later in the request path if DTO validation does not already constrain them.

# Habit Logs Page Integration Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect `apps/api/src/habit-logs/habit-logs.controller.ts` and DTOs
- [x] Review existing `project-dashboard` habits/tasks patterns for workspace-scoped data pages

### 2. Frontend integration
- [x] Add habit log frontend types, API client helpers, and React Query hooks
- [x] Replace the placeholder workspace habit logs page with a full client page wired to the API
- [x] Support list, filter, create, update, and delete flows matching the available backend routes

### 3. Verification
- [x] Run targeted frontend lint or type checks on the touched files
- [x] Validate the rendered page in Chrome DevTools
- [x] Record results and remaining risks

## Review / Results
- Added a dedicated habit-log frontend data layer in `apps/project-dashboard/lib/habit-logs/*` with typed list/detail/create/update/delete helpers and React Query hooks aligned to the backend controller routes.
- Replaced the placeholder workspace route with a full client page in `components/habit-logs/HabitLogsPage.tsx`, including:
  - workspace-scoped list loading
  - habit filter, date range filter, and note search
  - summary cards
  - empty states
  - create/edit dialog
  - delete confirmation
- Kept the page visually aligned with the existing dashboard shell and habits module rather than introducing a separate design system.
- Normalized backend habit-log responses in `apps/api/src/habit-logs/habit-logs.service.ts` so the frontend receives plain serialized objects instead of raw Mongoose documents. Added a regression spec for create serialization.
- Chrome DevTools verification:
  - Opened the authenticated route at `http://localhost:3000/w/69bf9af23810b45fcb4d7caa/habit-logs`
  - Confirmed the page renders inside the protected app shell
  - Confirmed the empty-state layout is shown cleanly when the API returns no logs
  - Opened and inspected the `New log` dialog successfully
  - Checked console/network: the current route loads `auth/me`, workspace context, habits, and habit logs successfully with 200 responses
- Verification:
  - `pnpm exec eslint components/habit-logs/HabitLogsPage.tsx app/'(protected)'/w/'[workspaceId]'/habit-logs/page.tsx lib/habit-logs/habit-logs-client.ts lib/habit-logs/habit-logs-query.ts lib/habit-logs/types.ts` in `apps/project-dashboard` ✅
  - `pnpm exec tsc --noEmit 2>&1 | rg 'components/habit-logs/HabitLogsPage.tsx|lib/habit-logs/|app/\\(protected\\)/w/\\[workspaceId\\]/habit-logs/page.tsx'` in `apps/project-dashboard` returned no matches ✅
  - `pnpm test -- habit-logs.service.spec.ts` in `apps/api` ✅
  - `pnpm exec eslint src/habit-logs/habit-logs.service.ts src/habit-logs/habit-logs.service.spec.ts src/habit-logs/dto/habit-log-response.dto.ts` in `apps/api` ✅
- Remaining risks:
  - The live workspace currently returned no habit logs during browser verification, so I validated the empty state and dialog on real data, but not a full create/edit/delete round-trip against the live API from the browser.

# Habit Create Exception Fix Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect the habits create flow in `apps/api`
- [x] Confirm why the request can fail after the document has already been saved

### 2. Backend fix
- [x] Normalize habit create/read/list/update/archive responses into plain DTOs
- [x] Add a regression test for the create response shape

### 3. Verification
- [x] Run targeted backend tests
- [x] Record results and remaining risks

## Review / Results
- Root cause: the habits module returned raw Mongoose documents from create/read/update/archive/list flows. The database write succeeded, but the response path could still fail when NestJS interceptors and serialization handled the hydrated document.
- Updated `HabitsService` to serialize habits into `HabitResponseDto` before returning them. This converts `_id`, `workspaceId`, and `userId` into plain strings and returns stable plain-object payloads instead of hydrated Mongoose documents.
- Expanded `HabitResponseDto` so the normalized payload still includes the key persisted fields the client expects, including `status`, `startDate`, `endDate`, and `archivedAt`.
- Added a regression spec covering `HabitsService.create()` to ensure a successful save returns a serialized habit response with string ids.
- Verification:
  - `pnpm test -- habits.service.spec.ts` in `apps/api` ✅
  - `pnpm exec eslint src/habits/habits.service.ts src/habits/habits.service.spec.ts src/habits/dto/habit-response.dto.ts` in `apps/api` ✅
- Remaining risks:
  - I validated the backend response path directly. The current habits frontend route is still a placeholder, so I did not verify an end-to-end browser create flow in the UI.

# Settings Dialog Panel Extraction Plan

## Status: COMPLETE

### 1. Audit
- [x] Review `apps/project-dashboard/components/settings/SettingsDialog.tsx` and identify panel, shell, and shared-component boundaries
- [x] Define the extraction target for config, sidebar, formatters, and panel files

### 2. Refactor
- [x] Replace the monolithic settings dialog with a shell-only orchestrator
- [x] Extract each settings panel into its own component while preserving existing UI and behavior
- [x] Move shared settings config, sidebar nav, section/row primitives, formatters, and invite feedback banner into dedicated files

### 3. Verification
- [x] Run targeted frontend lint on the extracted settings module
- [x] Run focused TypeScript checks for the extracted settings files
- [x] Record results and remaining risks

## Review / Results
- Replaced the large single-file settings dialog with a small shell in `components/settings/SettingsDialog.tsx` that only manages dialog state, sidebar selection, and active panel rendering.
- Added `components/settings/settings-config.ts`, `components/settings/shared/*`, and one file per panel in `components/settings/panels/*` so each settings area is independently readable and maintainable.
- Preserved the existing account, teammates, import, notifications, preferences, identity, types, billing, agents, skills, and placeholder behavior during the extraction.
- Verification:
  - `pnpm exec eslint components/settings/SettingsDialog.tsx components/settings/settings-config.ts components/settings/shared/*.tsx components/settings/shared/*.ts components/settings/panels/*.tsx` in `apps/project-dashboard` ✅
  - `pnpm exec tsc --noEmit 2>&1 | rg "components/settings/|settings-config|shared/Setting|shared/settings-formatters|InlineFeedbackBanner|SettingsSidebarNav"` in `apps/project-dashboard` returned no matches, so there were no TypeScript errors in the extracted settings files ✅
- Remaining risks:
  - I validated the extracted settings module specifically. I did not re-run full frontend lint/typecheck for unrelated files outside this refactor.

# Task Dialog Consistency Plan

# Project CRUD UI Integration Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect `apps/api/src/projects/projects.controller.ts` and current project dashboard UI/query wiring
- [x] Confirm the project dashboard list/board views still rely on local mock data and a non-persisted wizard flow

### 2. Frontend integration
- [x] Add a real project client/query layer for list/create/update/delete
- [x] Wire the projects page list and board views to backend project data
- [x] Add create, edit, delete, and status-update UI backed by the project controller endpoints

### 3. Verification
- [x] Run targeted frontend lint on the changed project files
- [x] Record results and remaining risks

## Review / Results
- Added a real project frontend client/query layer for `GET /projects`, `POST /projects`, `PATCH /projects/:id`, and `DELETE /projects/:id`, with invalidation that also refreshes the task-project selector cache.
- Replaced the projects page’s mock-backed create flow with a real `ProjectFormDialog` and wired list/board views to backend data, including create, edit, delete, and board status updates.
- Refactored the project cards and project progress summary to render from the backend project shape returned by `projects.controller.ts`, using workstreams as the visible project structure summary.
- Verification:
  - `pnpm exec eslint components/projects-content.tsx components/project-card.tsx components/project-cards-view.tsx components/project-board-view.tsx components/project-header.tsx components/project-progress.tsx components/projects/ProjectFormDialog.tsx lib/projects/projects-client.ts lib/projects/projects-query.ts` in `apps/project-dashboard` ✅
  - `pnpm exec tsc --noEmit 2>&1 | rg "projects-content|project-card|project-cards-view|project-board-view|project-header|project-progress|ProjectFormDialog|lib/projects/projects-client|lib/projects/projects-query"` in `apps/project-dashboard` returned no errors for the changed files ✅
- Remaining risks:
  - The separate project timeline/details surfaces still rely on older mock-data paths and are not yet integrated with the backend project controller.
  - `pnpm exec tsc --noEmit` for the whole frontend still fails on multiple pre-existing unrelated files outside this change set.

# Project Timeline And Details Integration Plan

## Status: COMPLETE

### 1. Audit
- [x] Confirm `ProjectTimeline` still bootstraps from `lib/data/projects`
- [x] Confirm `ProjectDetailsPage` still loads from `getProjectDetailsById(...)`

### 2. Frontend integration
- [x] Add project detail query support for `GET /projects/:id`
- [x] Wire the project details page to backend data and backend edit flow
- [x] Wire the project timeline to backend project list data through a shared adapter

### 3. Verification
- [x] Run targeted frontend lint on the changed timeline/details files
- [x] Check TypeScript output for the changed files

## Review / Results
- Added `getProject(...)` plus `useProjectQuery(...)` so project details can read a single backend project record from `projects.controller.ts`.
- Replaced the mock load in `ProjectDetailsPage` with `useProjectQuery(...)`, mapped the backend project into the existing detail-page view model, and swapped the edit button to the real `ProjectFormDialog` plus update mutation.
- Replaced the hardcoded timeline seed data in `ProjectTimeline` with `useProjectsQuery(...)` and a shared summary-to-list-item adapter, so the timeline now reflects backend projects instead of the static demo list.
- Added shared adapters in `lib/data/project-details.ts` to map the backend project summary into the existing project list/detail UI shapes, keeping the current detail subcomponents working without a full redesign.
- Verification:
  - `pnpm exec eslint components/project-timeline.tsx components/projects/ProjectDetailsPage.tsx lib/data/project-details.ts lib/projects/projects-client.ts lib/projects/projects-query.ts` in `apps/project-dashboard` produced warnings only; no errors ✅
  - `pnpm exec tsc --noEmit 2>&1 | rg "project-timeline|ProjectDetailsPage|lib/data/project-details|lib/projects/projects-client|lib/projects/projects-query"` in `apps/project-dashboard` returned no errors for the changed files ✅
- Remaining risks:
  - `ProjectTimeline` still has pre-existing lint warnings unrelated to the backend data integration (`useMemo` dependency and two unused `_checked` params).
  - The detail page still uses adapted placeholder content for notes/files/overview sections because the backend currently exposes project CRUD data, not the richer project-detail domain data those tabs would need.

# Workspace Invitation Permission UI Plan

## Status: COMPLETE

### 1. UI permissions
- [x] Disable teammate invitation actions for non-admin workspace roles in `TeammatesSettingsPane`
- [x] Add clear inline messaging for roles that cannot invite or revoke

### 2. Verification
- [x] Run targeted frontend lint on the settings dialog
- [x] Record results and remaining risks

## Review / Results
- Added frontend permission gating in `TeammatesSettingsPane` based on `workspaceContext.role`, allowing invitation management only for `OWNER` and `ADMIN`.
- Disabled the invite email field, role selector, invite button, and pending-invitation `Revoke` buttons for `MEMBER` and `VIEWER`, and added inline explanatory text when the current role cannot manage invitations.
- Kept defensive handler checks in place so even if a disabled UI state is bypassed in the browser, the pane still shows a permission error message instead of attempting the action silently.
- Verification:
  - `pnpm exec eslint components/settings/SettingsDialog.tsx` in `apps/project-dashboard` produced warnings only; no errors ✅
- Remaining risks:
  - `SettingsDialog.tsx` still has pre-existing warnings unrelated to this permission change (`EmptyState`, `members` hook dependency, `resolvedTheme`, `handleResetPhoto`, and `<img>` usage).

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
# Workspace Invitation API Permission Enforcement Plan

## Status: COMPLETE

### 1. Audit
- [x] Inspect workspace invitation routes and confirm current backend protection
- [x] Confirm frontend lockout should be backed by explicit API authorization

### 2. Backend fix
- [x] Protect invite/list/revoke invitation routes with explicit workspace permission enforcement
- [x] Add regression coverage for invitation permission metadata and permission guard behavior

### 3. Verification
- [x] Run targeted backend tests and lint
- [x] Record results and remaining risks

## Review / Results
- Switched workspace invitation management routes from role-threshold checks to the explicit workspace permission contract. `invite`, `listWorkspaceInvitations`, and `revokeInvitation` now use `WorkspacePermissionGuard` plus `RequireWorkspacePermission(WorkspacePermission.MEMBER_INVITE)`.
- This keeps the API aligned with the frontend lockout: `OWNER` and `ADMIN` still pass through the permission map, while `MEMBER` and `VIEWER` are blocked even if they call the endpoints directly.
- Added controller metadata coverage to ensure the invitation-management routes keep both `WorkspaceAccessGuard` and `WorkspacePermissionGuard`, and added a focused `WorkspacePermissionGuard` spec for allow/deny behavior.
- Verification:
  - `pnpm test -- workspaces.controller.spec.ts workspace-permission.guard.spec.ts` in `apps/api` ✅
  - `pnpm exec eslint src/workspaces/workspaces.controller.ts src/workspaces/workspaces.controller.spec.ts src/workspaces/guards/workspace-permission.guard.spec.ts` in `apps/api` ✅
- Remaining risks:
  - This enforces invitation-management permissions at the route level. If you later want even tighter defense-in-depth, the service methods could also accept the actor context and assert permissions internally, but that was not necessary to close the direct API-call gap.

# Task Delete Alert Dialog Plan

## Status: COMPLETE

### 1. Audit
- [x] Confirm the task row delete action still uses `window.confirm` in `task-helpers.tsx`
- [x] Confirm the project already has shadcn `alert-dialog` available

### 2. Frontend fix
- [x] Replace the delete confirmation with shadcn `AlertDialog`
- [x] Prevent the dialog trigger from bubbling into the task row open handler

### 3. Verification
- [x] Run targeted frontend lint on the changed task helper file
- [x] Record results and remaining risks

## Review / Results
- Replaced the task-row delete `window.confirm` flow with the existing shadcn `AlertDialog` component in `task-helpers.tsx`.
- Wrapped the delete icon button in `AlertDialogTrigger asChild` and added propagation guards on the trigger so opening the confirm dialog does not also open the task edit flow.
- The confirm action now deletes through the existing `onDelete` handler, while cancel and confirm stay inside the modal interaction pattern.
- Verification:
  - `pnpm exec eslint components/tasks/task-helpers.tsx` in `apps/project-dashboard` ✅
- Remaining risks:
  - I attempted `npx shadcn@latest docs alert-dialog` per the shadcn workflow, but it did not return in this environment, so the implementation uses the local installed `components/ui/alert-dialog.tsx` API directly.

# Task List Delete Wiring Fix Plan

## Status: COMPLETE

### 1. Audit
- [x] Confirm the list-view delete path in `task-helpers.tsx` is failing because delete props are referenced without being declared or forwarded

### 2. Frontend fix
- [x] Add delete-related props to `ProjectTasksSection`
- [x] Forward delete props from `ProjectTaskListView` into `ProjectTasksSection`

### 3. Verification
- [x] Run targeted frontend lint on the changed task helper file
- [x] Record results and remaining risks

## Review / Results
- Root cause: `ProjectTasksSection` referenced `onDeleteTask` and `deletingTaskId` without declaring them in its props or function parameters, which caused the runtime `ReferenceError` in list view.
- Added those delete props to `ProjectTasksSection` and forwarded them from `ProjectTaskListView`, restoring the existing delete handler path that `MyTasksPage` already provides.
- Verification:
  - `pnpm exec eslint components/tasks/task-helpers.tsx` in `apps/project-dashboard` ✅
- Remaining risks:
  - This fixes list-view delete wiring only. Broader task-flow behavior still depends on the existing delete mutation and confirmation UI, which were not changed here.

# Task Dialog Consistency Plan

# Auth Service Revamp Plan

## Status: IN PROGRESS

### 1. Audit
- [x] Review the existing auth controller/service flow (`apps/api/src/auth`) and user schema/repo to understand the current `/me` implementation and profile handling
- [x] Confirm related DTO contracts (`users`, `auth tokens`, `onboarding summary`) and token metadata that need to evolve for identity/profile separation

### 2. Fix
- [ ] Extend the `User` domain (schema + DTOs + repo) to include roles, avatar, status, lastLogin, and tokenVersion, plus a modular `/me` response shape covering identity, profile, metadata, and workspace defaults
- [ ] Introduce dedicated service boundaries (e.g., `ProfileService`, `AccountService`) so token issuance, user/profile data, and account lifecycle logic remain decoupled
- [ ] Implement `PATCH /me`, `POST /auth/change-password`, `POST /auth/update-email`, and `DELETE /me` with validation, re-auth/password confirmation, OTP-driven email verification, audit hooks, and refresh-token invalidation
- [ ] Document cascading cleanup for `DELETE /me` (soft delete strategy, idempotency) and ensure security/anti-abuse controls (rate limiting, token version bumps)

### 3. Verification
- [ ] Add targeted unit tests/specs around the new DTOs and services or note verification gaps if tests cannot run here
- [ ] Double-check rate limiting/audit coverage on the sensitive endpoints using the existing throttler guard and logging config

## Review / Results
- Pending
