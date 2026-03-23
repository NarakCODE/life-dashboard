# Lessons Learned

## Date: 2026-03-23

### Lesson: Edit Flows Should Not Resend Unchanged Relational Fields

**Context**: Fixed the task quick-edit modal after it was failing updates while simpler task mutations elsewhere in the UI continued to work.

**Mistake/Risk Avoided**:
- The modal edit flow always resent `projectId` and `workstreamId`, even when the user only changed a title, status, or date.
- That forced the backend to re-run project/workstream validation on every edit and made the modal more fragile than the inline task updates that only send changed fields.

**Root Cause**:
- The frontend reused the create-style payload shape for edits instead of building an update-specific payload.
- Relational identifiers behave differently from simple fields because resending them can trigger access/context validation that is unrelated to the user’s actual change.

**Preventative Rule**:
1. Build edit payloads from diffs against the existing record whenever the backend supports partial updates.
2. Avoid resending unchanged relational fields like project, workspace, or foreign-key references from modal edit forms.
3. If an update still fails, surface the real backend message in the toast first before falling back to a generic string.

**Applied In**: `apps/project-dashboard/components/tasks/TaskQuickCreateModal.tsx` now sends a minimal `UpdateTaskInput` and uses `getErrorMessage(...)` for update failures.

### Lesson: Do Not Return Raw Mongoose Documents From API Services

**Context**: Fixed the transactions create flow after the API started returning raw Mongoose documents that leaked `$__` and `_doc` internals into the JSON response.

**Mistake/Risk Avoided**:
- The transactions service returned `TransactionDocument` instances directly for create, list, detail, and update operations.
- That leaked Mongo internals into the API contract, broke the frontend’s `id` expectations, and contributed to the transaction create/list failure path.

**Root Cause**:
- The feature already had `TransactionResponseDto`, but the service layer was bypassing it and exposing repository documents directly.
- Repository return shapes are persistence-layer objects, not stable API contracts.

**Preventative Rule**:
1. Normalize repository documents in the service layer before they cross the controller boundary.
2. Reuse or add response DTOs for every CRUD path, not just selected endpoints.
3. When a frontend starts receiving `_id`, `$__`, or `_doc`, treat that as a service serialization bug immediately.

**Applied In**: `apps/api/src/transactions/transactions.service.ts` now maps transactions into `TransactionResponseDto`, and `apps/api/src/transactions/transactions.service.spec.ts` covers the normalized response shape.

### Lesson: Boolean Query Transforms Must Preserve Omitted Values

**Context**: Fixed the budgets list API so marking a budget inactive does not disappear it from the unfiltered response due to controller-level query parsing.

**Mistake/Risk Avoided**:
- `QueryBudgetDto` transformed `isActive` with `value === 'true' || value === true`, which silently converted an omitted query parameter into `false`.
- That caused the controller/service path to apply an inactive-only filter even when the client did not request any activity filter at all.

**Root Cause**:
- The DTO transform treated “missing” and “explicit false” as the same input.
- For optional boolean query params, Nest/class-transformer runs the transform before the repository filter logic, so a lossy transform changes endpoint semantics globally.

**Preventative Rule**:
1. For optional boolean query fields, return `undefined` from `@Transform(...)` when the raw value is missing or empty.
2. Add a focused DTO regression test for both omitted and explicit `false` inputs whenever query transforms affect filtering.
3. Fix optional-filter behavior at the DTO boundary instead of compensating in controllers or repositories downstream.

**Applied In**: `apps/api/src/budgets/dto/query-budget.dto.ts` now preserves omitted `isActive`, and `apps/api/src/budgets/dto/query-budget.dto.spec.ts` covers the regression.

### Lesson: Notification Visibility Must Be Scoped To The Recipient, Not Just The Workspace

**Context**: Added onboarding invite delivery so completing setup creates real workspace invitations and in-app notifications for existing users who were invited during onboarding.

**Mistake/Risk Avoided**:
- The first pass created the invite notification successfully, but repository reads still used a workspace-scoped filter that could expose a notification to the inviter or other members of the same workspace.
- That would have turned a UX improvement into a privacy bug because notifications are inherently recipient-specific even when they reference a shared workspace.

**Root Cause**:
- `NotificationsRepository` reused a workspace-centric filter shape for list, count, read, update, and delete operations.
- One branch of that filter matched workspace-wide records without enforcing the recipient user id, which was too broad for notification delivery semantics.

**Preventative Rule**:
1. Treat notifications as recipient-owned data first, with workspace scope as optional metadata.
2. Require the recipient user id in every repository query branch that returns or mutates notifications.
3. Live-verify both the sender and recipient UI states after changing notification delivery so visibility bugs are caught before closeout.

**Applied In**: `apps/api/src/notifications/notifications.repository.ts` now uses a recipient-scoped filter, and onboarding invite notifications are created through `createForRecipient(...)` with global scope when the recipient is not yet a workspace member.

### Lesson: Avoid Root Lint Runs That Auto-Fix Unrelated Packages Mid-Task

**Context**: Cleared the frontend typecheck backlog from the monorepo root and ran `pnpm lint` to verify the repo after the fixes.

**Mistake/Risk Avoided**:
- The root lint pipeline runs the API package with `eslint --fix`, which rewrote unrelated backend chat and user files even though the task only targeted frontend issues.
- That kind of incidental churn makes it harder to review the real change set and increases the risk of mixing unrelated edits into one task.

**Root Cause**:
- I treated the root lint command as a read-only verification step.
- In this repo, package-level lint scripts are not symmetrical: the frontend lints without fixes, but the backend lints with auto-fix enabled.

**Preventative Rule**:
1. Check whether repo or package lint scripts include `--fix` before using them as a verification step.
2. Prefer targeted lint commands for the touched package when a root pipeline would auto-edit unrelated files.
3. If root verification is still needed, inspect the worktree immediately after running it and remove incidental churn before closing the task.

**Applied In**: Reverted the unrelated API formatting churn after the root lint run and kept the actual task scoped to frontend typecheck fixes.

### Lesson: Redirect Incomplete Users Before Workspace Queries Mount

**Context**: Integrated the new onboarding backend state into the Next.js frontend so authenticated users without completed setup are redirected into `/onboarding`.

**Mistake/Risk Avoided**:
- The protected frontend originally treated “authenticated” as equivalent to “workspace-ready” and mounted `WorkspaceRouteBoundary`, the sidebar, and workspace queries immediately.
- Once the backend stopped auto-provisioning workspace context, that old assumption would have produced empty shells, `#` links, or failing workspace-context requests before the redirect could happen.

**Root Cause**:
- Workspace readiness is now a separate concern from authentication.
- The route shell and guards were still keyed only on session validity, not on `auth/me` onboarding summary state.

**Preventative Rule**:
1. Gate protected workspace UI on both authentication and onboarding readiness.
2. Redirect incomplete users to setup before rendering workspace-bound providers, sidebars, or query hooks.
3. Give onboarding its own protected shell path that does not assume a workspace context exists yet.

**Applied In**: `apps/project-dashboard/components/auth/auth-guard.tsx` now redirects incomplete users to `/onboarding`, and `apps/project-dashboard/components/auth/auth-shell.tsx` bypasses `WorkspaceRouteBoundary` and the sidebar for onboarding.

### Lesson: Guard Dependencies Must Be Available In Every Consuming Module

**Context**: `ChatController` applied `WorkspaceAccessGuard`, and Nest failed at startup with `Nest can't resolve dependencies of the WorkspaceAccessGuard ... WorkspacesService at index [0] is available in the ChatModule module`.

**Mistake/Risk Avoided**:
- The controller reused a guard exported from the workspace feature, but `ChatModule` did not import `WorkspacesModule`.
- Nest resolves guard dependencies in the consuming module context, so exporting the guard alone is not enough if that context cannot also see the guard’s dependencies through module imports.

**Root Cause**:
- I treated controller-level guard reuse as if it were globally available once the app imported `WorkspacesModule` at the root.
- Nest DI does not work that way; each feature module that uses the guard must import the module exporting the full dependency graph.

**Preventative Rule**:
1. When adding `@UseGuards(...)` with a feature guard, import the module that exports that guard into the same feature module as the controller.
2. Verify the consuming module can see both the guard and the guard’s constructor dependencies.
3. Add a focused module metadata regression test when a feature module starts depending on another feature’s guards.

**Applied In**: `apps/api/src/chat/chat.module.ts` now imports `WorkspacesModule`, and `apps/api/src/chat/chat.module.spec.ts` locks that dependency path in place.

### Lesson: Do Not Reuse Similar Enums Via Direct Casts

**Context**: Extended the onboarding backend with explicit state DTOs that expose both persisted session status and a derived `not_started` state for legacy users.

**Mistake/Risk Avoided**:
- The first pass cast `OnboardingStatus` directly to `OnboardingStateStatus` because their string values overlap for `in_progress`, `completed`, and `skipped`.
- TypeScript rejected the cast, and that kind of shortcut makes status mapping fragile as soon as either enum changes.

**Root Cause**:
- Two enums can represent related concepts without being type-compatible.
- I treated “same runtime string today” as if it were “same contract,” which is not true under strict TypeScript.

**Preventative Rule**:
1. Map related enums through an explicit function instead of casting between them.
2. Use the mapper as the single place where derived API state is translated from persistence state.
3. Re-run focused TypeScript checks immediately after introducing derived DTO enums.

**Applied In**: `apps/api/src/onboarding/onboarding.service.ts` now uses `mapSessionStatus()` instead of casting `OnboardingStatus` directly to `OnboardingStateStatus`.

### Lesson: Preserve Explicit Aggregate Filters When Adding Fallback Match Conditions

**Context**: Extended the journal mood summary endpoint so analytics follow the same search, tag, and mood filters as the visible journal list.

**Mistake/Risk Avoided**:
- The first backend pass fixed the summary counts but left the mood trend wrong under an active mood filter.
- `getMoodTrend` spread the shared filter object and then overwrote `matchStage.mood` with `{ $exists: true, $ne: null }`, which silently discarded the explicit selected mood.

**Root Cause**:
- The aggregation needed a fallback “only entries with mood” condition, but I applied it after building the shared filter object without checking whether `mood` was already set intentionally.

**Preventative Rule**:
1. When reusing shared match objects, treat explicit filter fields as authoritative.
2. Only add fallback aggregate conditions when the corresponding explicit filter is absent.
3. Re-verify both aggregate summaries and aggregate trends in the browser after backend filtering changes, because one can be correct while the other is still wrong.

**Applied In**: `apps/api/src/journal-entries/journal-entries.repository.ts` now only adds the `mood exists` constraint in `getMoodTrend` when no explicit mood filter was provided.

### Lesson: Normalize Paginated API Shapes in the Client Layer

**Context**: Verified the new journal page in Chrome after wiring the frontend to `apps/api/src/journal-entries/*`.

**Mistake/Risk Avoided**:
- The journal route initially crashed before its own UI could render because `NotificationsDropdown.tsx` tried to call `.map()` on a paginated notifications payload object.
- The notifications endpoint returned an envelope whose `data` field contained a paginated DTO, but the client helper exposed that nested object directly instead of flattening it into the array shape the UI expected.

**Root Cause**:
- The notification client assumed every successful list endpoint returned `payload.data` as the final item array.
- This codebase mixes simple list responses and paginated DTOs inside the same outer API envelope, so the client boundary must normalize before React components consume the result.

**Preventative Rule**:
1. For every list endpoint, inspect the actual backend DTO shape before wiring the UI.
2. Flatten paginated responses in the API client helper, not ad hoc in each component.
3. When a shared surface like notifications is used across pages, regression-test or live-verify one unrelated route to catch cross-feature runtime breakage early.

**Applied In**: `apps/project-dashboard/lib/notifications/notifications-client.ts` now normalizes paginated notification bodies into a stable `{ data: Notification[]; meta.pagination }` shape before the dropdown and inbox page read from it.

## Date: 2026-03-22

### Lesson: Handle Indexed Array Access Explicitly Under Strict TypeScript

**Context**: Split the settings import wizard into `ImportSettingsPane.tsx` during the settings dialog panel extraction.

**Mistake/Risk Avoided**:
- A refactor kept `const previousStage = importStages[index - 1]` behind an `index > 0` check, but TypeScript still treated the indexed lookup as possibly `undefined`.
- That left the extracted panel failing focused type verification even though the runtime logic was safe.

**Root Cause**:
- With strict indexed access rules, numeric guards do not fully narrow array element reads.
- The refactor preserved the old control flow but did not convert the indexed read into a fully typed fallback value.

**Preventative Rule**:
1. Treat `array[index]` as maybe-undefined in extracted UI logic even when the index appears guarded.
2. Normalize guarded indexed reads into fallback scalars or optional chaining before using nested properties.
3. Re-run focused TypeScript checks immediately after moving wizard or progress-step logic across files.

**Applied In**: `apps/project-dashboard/components/settings/panels/ImportSettingsPane.tsx` now derives `previousStageThreshold` with an explicit fallback before the comparison.

### Lesson: Edit Task Plans Carefully

**Context**: Added a new task plan entry to `tasks/todo.md` while another completed plan already existed at the top of the file.

**Mistake/Risk Avoided**:
- The first patch duplicated an existing heading block and briefly left `tasks/todo.md` with redundant status sections.
- That kind of bookkeeping error makes the plan file harder to trust during longer sessions.

**Root Cause**:
- I inserted the new plan at the file top without first checking how the previous top-level section should be preserved.

**Preventative Rule**:
1. Read the current top section of tracking files before prepending a new plan.
2. Replace or insert with exact surrounding context instead of broad top-of-file patches.
3. Re-read the diff for tracking files immediately after patching them.

**Applied In**: `tasks/todo.md` was corrected in the same session after the duplicate sections were detected.

### Lesson: Avoid Socket-Bound HTTP Tests in This Sandbox

**Context**: Added a regression test for `GET /workspaces/resolve-context` while working inside the Codex sandbox.

**Mistake/Risk Avoided**:
- An initial `supertest` route test tried to bind a local port and failed with `listen EPERM`.
- That failure was environmental noise, not a backend regression, and could have wasted time or produced a misleading result.

**Root Cause**:
- This sandbox can restrict socket binding even for local test servers.
- `supertest` can still attempt to listen when given a non-listening server object.

**Preventative Rule**:
1. Prefer controller/unit or metadata-based route regression tests when the sandbox blocks local port binding.
2. Only use socket-bound integration tests when the environment explicitly supports local listeners.
3. If a route-order bug is the real concern, assert the static route metadata and controller method order directly.

**Applied In**: `apps/api/src/workspaces/workspaces.controller.spec.ts` now verifies the `resolve-context` route without opening a socket.

## Date: 2026-03-21

### Lesson: Dependency Update Strategy

**Context**: Updated 40 packages in `apps/project-dashboard` using a phased approach.

**Mistake/Risk Avoided**: 
- Could have updated all packages at once including major versions
- Major version updates (zod v4, recharts v3, sonner v2, etc.) could introduce breaking changes

**Root Cause**: 
- Major version updates often include API changes requiring code modifications
- Not all major updates are necessary if current versions work fine

**Preventative Rule**:
1. Use a phased approach: Patch/Minor first, Major later
2. Test build after each phase
3. Research changelogs before major version updates
4. Consider keeping major versions if no compelling reason to upgrade
5. Commit between phases for easy rollback

**Applied In**: `apps/project-dashboard` dependency updates - completed Phase 1 & 2, deferred Phase 3 & 4 major updates.

### Lesson: Consistency Layout with SidebarInset

**Context**: Found duplicated layout wrapper code `<div className={"flex flex-1 flex-col bg-background mx-2 my-2 border border-border rounded-lg min-w-0"}>` implemented across every `page` and major content component (e.g., `projects-content.tsx`, `performance-content.tsx`, etc.).

**Mistake/Risk Avoided**: 
- Code duplication and harder maintenance if we decide to change the global padding/border of the main content area.
- Breaking the single source of truth for app architecture by having every page manage its own outer layout container wrappers.

**Root Cause**: 
- Not utilizing the existing shared layout component correctly. Shadcn `SidebarInset` is already responsible for providing the main content area context and wrappers.
- The `ProtectedAppShell` was already wrapping all routes with `SidebarInset` but the individual pages were still wrapped with manually duplicated CSS.

**Preventative Rule**:
1. Do not recreate layout wrappers like page borders, margins, or backgrounds within individual pages.
2. Standardize all global layout constraints in `ProtectedAppShell` directly on the `SidebarInset` component.
3. Page components should start at the semantic level of routing content (e.g., `flex flex-col flex-1` inside the inset) without asserting outer spacing or border bounds.

**Applied In**: `apps/project-dashboard` components like `projects-content.tsx`, `clients-content.tsx`, `performance-content.tsx` and the dashboard `page.tsx` now rely on `ProtectedAppShell`'s injected `SidebarInset` layout class.
