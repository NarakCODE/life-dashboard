# Tasks TODO List

## Current Task: Generate Issues Postman Collection

- [x] Inspect the existing Postman collection structure and the implemented `issues` API contract
- [x] Add an `issues` Postman collection and register it in the unified API collection/docs
- [x] Verify the generated JSON and record the result

### Result

- Added `apps/api/postman/collections/13-issues.json` with workspace-scoped examples for create, list, my issues, get by id, update, and delete, including an automatic `issueId` environment capture after create.
- Registered the same `13 - Issues` section in `apps/api/postman/life-dashboard.json` so the unified import stays aligned with the split collection set.
- Updated `apps/api/postman/README.md` to document the new collection, import flow, and `issueId` environment variable.
- Verified the new collection JSON parses successfully with `node -e "const fs=require('fs'); ['apps/api/postman/collections/13-issues.json','apps/api/postman/life-dashboard.json'].forEach((file)=>JSON.parse(fs.readFileSync(file,'utf8'))); console.log('json-ok')"`.

## Current Task: Implement Issues Backend Module

- [x] Inspect the existing `tasks`, `projects`, workspace permission, and seeding patterns in `apps/api`
- [x] Add workspace permissions and decide whether the current `projects` module is suitable for issue linkage
- [x] Implement the `issues` feature with Mongoose schemas, DTOs, repository, service, controller, module, and seed support
- [x] Add lightweight `cycles` and `views` backend modules to establish the feature structure for Linear-style project management
- [x] Register the new modules in `AppModule` and package scripts where needed
- [x] Verify the new backend feature with targeted tests or type/build checks

### Result

- Kept the existing `apps/api/src/projects` module as the canonical project backend because it already provides workspace-scoped project access suitable for issue linkage, so no duplicate `project-management/projects` module was introduced.
- Added a full `issues` feature under `apps/api/src/issues` with strict workspace-scoped Mongoose schemas, DTOs, repository, service, controller, module, and a workspace-seeded identifier sequence for `ISS-*` issue numbers.
- Added `ISSUE_READ` and `ISSUE_WRITE` workspace permissions, protected the issue routes with the same JWT + workspace access + workspace permission guard stack used by `tasks`, and updated the workspace-permissions spec coverage.
- Added lightweight `apps/api/src/cycles/cycles.module.ts` and `apps/api/src/views/views.module.ts` scaffolds so the backend feature layout now includes `issues`, `cycles`, and `views`.
- Registered `IssuesModule`, `CyclesModule`, and `ViewsModule` in `AppModule`, and added issue seeding support via `IssueSeeder`, `tools/seeds/seed-issues.ts`, `seed:issues`, and `seed:issues:clear`.
- Verified with `pnpm --dir apps/api exec jest src/workspaces/workspace-permissions.spec.ts --runInBand`, `pnpm --dir apps/api exec jest --runInBand --passWithNoTests src/issues`, and a filtered `pnpm --dir apps/api exec tsc --noEmit -p tsconfig.json` check that returned no issue-module-specific errors. Repo-wide API typecheck may still have unrelated existing failures outside this new feature.

## Current Task: Apply Light Green Theme Preset

- [x] Inspect the current green preset metadata and CSS token overrides
- [x] Replace the green preset with the supplied Light Green theme values and rename it in the selector UI
- [x] Verify formatting and build for the dashboard app

### Result

- Replaced the existing `green` preset token overrides in `apps/project-dashboard/app/globals.css` with the supplied Light Green light and dark values, including background, surface, accent, chart, sidebar, and radius tokens that the dashboard theme system consumes.
- Renamed the visible selector option in `apps/project-dashboard/lib/theme/theme-preset.ts` from `Green` to `Light Green` and updated its preview swatches, while keeping the stored preset value as `green` for compatibility with existing selections.
- Verified with `pnpm exec prettier --check lib/theme/theme-preset.ts app/globals.css` and a successful `pnpm run build` in `apps/project-dashboard`.

## Current Task: Move Theme Mode To Preferences

- [x] Inspect the settings dialog preferences pane and current sidebar theme entry point
- [x] Move the theme selector into the Preferences settings pane as its own section
- [x] Remove the sidebar theme trigger and verify the dashboard app

### Result

- Removed the theme trigger from `apps/project-dashboard/components/app-sidebar.tsx`, so the sidebar header no longer exposes theme controls directly.
- Added a dedicated `Appearance` section to `apps/project-dashboard/components/settings/panels/PreferencesSettingsPane.tsx` and placed the existing `ThemePresetSelector` there.
- Verified with `pnpm exec prettier --check components/app-sidebar.tsx components/settings/panels/PreferencesSettingsPane.tsx` and a successful `pnpm run build` in `apps/project-dashboard`.

## Current Task: Remove Project Dashboard Websocket

- [x] Inspect websocket-related frontend hooks, UI usage, and package references in `apps/project-dashboard`
- [x] Remove websocket hook usage and supporting app-local socket types/dependencies
- [x] Verify the dashboard app no longer references websocket code and still builds

### Result

- Removed the inbox websocket integration by deleting `hooks/use-notifications-socket.ts` and removing its usage from `components/inbox/InboxPage.tsx`.
- Removed the app-local `socket.io-client` shim at `types/socket.io-client.d.ts` and dropped `socket.io-client` from `apps/project-dashboard/package.json`.
- Refreshed the workspace lockfile with `pnpm install --lockfile-only`, confirmed there are no remaining websocket or `socket.io-client` references under `apps/project-dashboard`, and verified `pnpm run build` still passes for the dashboard app.

## Current Task: Fix Workspace Provisioning Spec

- [x] Inspect `apps/api/src/workspaces/workspace-provisioning.service.spec.ts` against the current service contract
- [x] Update the spec mocks and assertions to match the current workspace provisioning behavior
- [x] Verify the spec with a targeted API test or compile check

### Result

- Confirmed `apps/api/src/workspaces/workspace-provisioning.service.spec.ts` was already passing against the current `WorkspaceProvisioningService` contract.
- Identified the actual failing workspace tests in `apps/api/src/workspaces/workspaces.service.spec.ts`, where the constructor setup was missing the `joinRequestModel` dependency added to `WorkspacesService`.
- Updated those test instantiations to pass the correct six constructor arguments and filled the expired-invitation user stub with the required `findByEmail` method.
- Verified both `pnpm --dir apps/api exec jest src/workspaces/workspaces.service.spec.ts --runInBand` and `pnpm --dir apps/api exec jest src/workspaces/workspace-provisioning.service.spec.ts --runInBand` pass.

## Current Task: Move Theme Selector To Sidebar

- [x] Inspect the existing sidebar header and current theme selector placement
- [x] Move the theme selector entry point to the top sidebar with a compact control
- [x] Remove the duplicate account-settings placement and verify the affected app

### Result

- Moved the theme selector entry point to the top sidebar header, directly below the workspace switcher.
- Wrapped the existing selector in a compact popover trigger so the sidebar stays narrow while preserving preset swatches and mode controls.
- Removed the duplicate appearance section from account settings so the selector has a single primary location.
- Verified with targeted ESLint for the touched components and a successful `pnpm run build` in `apps/project-dashboard`.

## Current Task: Project Dashboard Theme Selector

- [x] Inspect the current theme provider, global CSS tokens, settings UI, and unused mode toggle path
- [x] Add a preset-theme state layer with root attribute application and localStorage restore
- [x] Extend the token CSS with Default, Slate, Zinc, Stone, Blue, Green, Orange, Rose, and Violet presets for light and dark mode
- [x] Replace the plain appearance select with a theme selector that shows swatches, active state, and preserves light/dark/system mode controls
- [x] Verify the affected app with targeted lint/type/build checks

### Result

- Added a preset theme layer on top of the existing `next-themes` mode provider, using `data-theme` on the root element plus `localStorage` restore via an inline pre-hydration script.
- Extended `apps/project-dashboard/app/globals.css` with token overrides for `default`, `slate`, `zinc`, `stone`, `blue`, `green`, `orange`, `rose`, and `violet`, while preserving the existing `dark` class behavior.
- Replaced the plain appearance select in account settings with a richer selector that includes mode toggles, preview swatches, and a visible active state.
- Updated the Sonner toaster to follow the resolved light/dark mode instead of forcing light theme.
- Verified with targeted ESLint on the touched TS/TSX files and a successful `pnpm run build` in `apps/project-dashboard`.
- `pnpm exec tsc --noEmit` still reports pre-existing unrelated errors in editor and auth files outside this change set.

## Current Task: Remove API Onboarding Feature

- [x] Trace onboarding dependencies in auth and app module wiring
- [x] Replace auth-facing onboarding DTO/service dependency with a static summary DTO
- [x] Remove the onboarding module and API artifacts
- [x] Verify the API starts past the previous Swagger crash

### Result

- Removed `OnboardingModule` from `AppModule` and `AuthModule`.
- Deleted the entire `apps/api/src/onboarding` feature and removed the onboarding Postman collection from the API bundle.
- Added `src/common/dto/user-onboarding-summary.dto.ts` so `/auth/me` and user DTOs keep an onboarding-shaped payload without importing the removed onboarding module.
- Updated `ProfileService` to build a static completed onboarding summary from the user record instead of calling `OnboardingService`.
- Verified `pnpm start` now progresses past the previous Nest Swagger circular-dependency crash; the remaining startup failures in this sandbox are database and Redis connection errors, not onboarding/Swagger errors.

## Current Task: Fix Project Dashboard App API Dev Error

- [x] Reproduce the `pnpm dev` error in `apps/project-dashboard`
- [x] Trace the failing `app/api` route or import path
- [x] Implement the minimal fix for the dev-time failure
- [x] Verify the app starts past the original error

### Result

- `pnpm dev` could not be fully exercised in the sandbox because binding `0.0.0.0:3000` is blocked with `listen EPERM`, so verification relied on targeted compile/type checks instead of a live dev server.
- Confirmed the `app/api/ai/write/route.ts` route is structurally valid and still type-generates correctly.
- Fixed the actual frontend compile failure in `app/(protected)/workspaces/join/[token]/page.tsx` by replacing the invalid `@phosphor-icons/react/dist/ssr` `Loader2` import with the correct `lucide-react` import.
- Targeted ESLint passed for the join route and `app/api/ai/write/route.ts`.
- Targeted TypeScript grep no longer reports errors for `app/api/ai/write/route.ts`, `workspaces/join/[token]/page.tsx`, or `Loader2`.

## Current Task: Fix Nest Swagger Circular Dependency Error

- [x] Trace the Swagger schema error source for `property key: "PROFILE"`
- [x] Normalize the offending DTO Swagger enum metadata
- [x] Verify the touched DTO passes targeted lint

### Result

- Identified `apps/api/src/onboarding/dto/update-onboarding-step.dto.ts` as the likely Swagger failure source because `nextStep` used `enum: Object.values(OnboardingStep)`.
- Updated that decorator to `enum: OnboardingStep` with `enumName: 'OnboardingStep'`, matching the rest of the onboarding DTOs and avoiding Swagger's object-literal recursion into enum keys like `PROFILE`.
- Added an explicit `@ApiParam` for `onboarding.controller.ts` route param `:step` using `enum: OnboardingStep` and `enumName: 'OnboardingStep'` so Swagger stops inferring the enum-typed param schema from the method signature.
- Targeted ESLint passed for the touched DTO.

## Current Task: Fix Chat Removal Relationship Errors

- [x] Inspect remaining chat-related references and current compiler failures
- [x] Remove stale route shells and generated type references left behind by chat deletion
- [x] Verify chat-related frontend compile errors are gone

### Result

- Removed the empty leftover route directories `app/(protected)/w/[workspaceId]/chat`, `app/(protected)/w/[workspaceId]/chats`, and `app/w/[workspaceId]/chat` that were still causing Next to treat chat as an active route.
- Regenerated Next route types with `pnpm exec next typegen`.
- Deleted the stale generated `.next/types` chat page entries that still referenced the removed route files.
- Verified `pnpm exec tsc --noEmit` no longer reports any `/chat` or `/chats` missing-module errors; only unrelated pre-existing frontend type errors remain.

## Current Task: Remove Frontend Chat Feature

- [x] Inspect frontend chat routes, shared client code, and navigation references
- [x] Remove the chat UI/client implementation from `apps/project-dashboard`
- [x] Remove shared navigation and notification references that still expose chat
- [x] Verify the touched frontend package after the removal

### Result

- Removed both workspace chat pages, the entire `apps/project-dashboard/lib/chat` client stack, and all chat UI components under `apps/project-dashboard/components/chat`.
- Removed chat and chats entries from sidebar navigation and stripped chat-specific route handling from the app sidebar.
- Removed the frontend `chat_message` notification type and associated label/icon mappings to match the backend removal.
- Verified there are no remaining product-chat references in `apps/project-dashboard` apart from the unrelated AI provider `/chat/completions` call in `app/api/ai/write/route.ts`.
- Targeted ESLint passed for the touched shared frontend files.
- `pnpm exec tsc --noEmit` still fails because `.next` contains stale generated references to the deleted chat pages and because the package already has unrelated pre-existing type errors in editor, auth, performance, and other frontend files.

## Current Task: Remove API Chat Feature

- [x] Inspect the API chat module and identify all registration and artifact references
- [x] Remove the chat feature implementation from `apps/api`
- [x] Remove API-facing chat collections/docs references
- [x] Verify the API package after the removal

### Result

- Removed the entire `apps/api/src/chat` feature and unregistered `ChatModule` from the Nest app root.
- Removed the chat Postman collection and deleted the bundled `13 - Chat` section from `apps/api/postman/life-dashboard.json`.
- Removed chat-specific notification enum/seed entries and updated notification seeder docs totals from 22 to 20.
- Verified no `chat` references remain under `apps/api/src`, `apps/api/docs`, or `apps/api/postman`.
- Added `apps/api/tools/maintenance/drop-chat-collections.ts` and `pnpm run drop:chat-collections` for repeatable Mongo cleanup.
- Dropped the leftover MongoDB collections: `chat_channels`, `chat_messages`, `chat_channel_members`, and `chat_configs`.
- `pnpm exec tsc --noEmit -p tsconfig.json` still fails due to pre-existing `workspaces.service.spec.ts` constructor-arity errors.
- `pnpm exec jest --runInBand --passWithNoTests` still fails from pre-existing `workspaces`, `auth`, and `habits` spec failures unrelated to chat removal.

## Current Task: Task Quick Create Assignee Members

- [x] Inspect the quick-create modal and existing members query/client pattern
- [x] Update the task quick-create assignee dropdown to load workspace members
- [x] Preserve modal state correctly while async member data resolves
- [x] Verify the touched frontend file with a targeted check

### Result

- The quick-create task assignee picker now uses the workspace members query instead of hardcoding the authenticated user, so the dropdown lists all available workspace members for assignment.
- Added async-selection sync so create mode keeps the current form state intact while members load, and edit mode upgrades the temporary assignee value to the canonical workspace member option once the query resolves.
- Targeted ESLint passed for `apps/project-dashboard/components/tasks/TaskQuickCreateModal.tsx`.

## Current Task: Projects Mockup Seeder

- [x] Inspect the existing projects module and current seeder/CLI pattern
- [x] Implement a projects mock-data seeder with workspace-scoped validation and realistic sample records
- [x] Wire the seeder into the projects module and expose CLI scripts
- [x] Verify the touched backend files with targeted checks

### Result

- Added `ProjectSeeder` with workspace-scoped mock project generation, duplicate-seed protection, and both scoped and global clear methods.
- Wired the seeder into `ProjectsModule` and added `seed:projects` / `seed:projects:clear` package scripts plus a CLI entrypoint at `apps/api/tools/seeds/seed-projects.ts`.
- Targeted ESLint passed for the touched backend files.
- Repo-wide API typecheck still fails from pre-existing constructor-arity errors in `apps/api/src/workspaces/workspaces.service.spec.ts`, unrelated to this change.

## Current Task: Auth Response Shape Alignment

- [x] Inspect the login route, auth client path, and backend auth controller response shape
- [x] Align the frontend auth success response handling with the backend auth controller contract
- [x] Align the frontend auth error response handling with the backend auth controller contract
- [x] Align the login UX with the unverified-email backend flow by redirecting to OTP verification
- [x] Verify the touched auth frontend files with targeted checks

### Result

- Confirmed the login route page is only a wrapper and that the real response-shape boundary for the login flow is `apps/project-dashboard/lib/auth/auth-client.ts`.
- Hardened auth response parsing so token and `/auth/me` consumers tolerate either a direct DTO payload or an extra nested `data` object if the backend/controller path returns one.
- Aligned frontend auth types with the backend `MeResponseDto` contract by treating `defaultWorkspaceId` as nullable and normalizing optional onboarding fields to `null`.
- Updated the shared API client error parser to accept plain Nest error payloads like `{ message, error, statusCode }`, so login now preserves the backend unverified-email message instead of falling back to a generic request error.
- Updated the login form so an unverified-email backend response now redirects directly to `/verify-email?email=...` instead of leaving the user on the login page.
- Updated the verify-email page to surface the backend message as a warning state: `Email verification required` with the backend description preserved after redirect.
- Targeted ESLint passed for `apps/project-dashboard/components/auth/LoginForm.tsx`, `apps/project-dashboard/components/auth/VerifyEmailForm.tsx`, `apps/project-dashboard/lib/api/api-client.ts`, `apps/project-dashboard/lib/auth/auth-client.ts`, and `apps/project-dashboard/lib/auth/types.ts`.

## Current Task: Onboarding Workspace Creation Flow

- [x] Inspect the current onboarding page, reference wizard step UI, and onboarding data shape
- [x] Refactor the onboarding page into an in-page StepMode-inspired workspace creation flow
- [x] Verify the touched onboarding file with targeted frontend checks

### Result

- Reworked the onboarding experience into a centered in-page workspace creation flow with a StepMode-inspired shell instead of the previous generic two-card form layout.
- Kept the existing backend onboarding behavior and mutations intact while upgrading the step UI to use stronger step framing, rounded surfaces, and selection-card interactions for planning preferences.
- Enhanced the workspace creation step with a more explicit workspace naming panel and starter-direction choices without introducing new backend requirements.
- Targeted ESLint passed for `apps/project-dashboard/components/onboarding/OnboardingPage.tsx`.

## Current Task: Chats Direct Messages

- [x] Read the DM endpoint summary and current chats page integration
- [x] Add frontend DM types, client methods, and TanStack Query hooks for `/chat/dms`
- [x] Replace the ad hoc DM creation flow with the dedicated get-or-create DM flow
- [x] Render DMs correctly in the chats sidebar and selected chat header
- [x] Verify the touched chats files with targeted frontend checks

### Result

- Added dedicated frontend support for `GET /chat/dms` and `POST /chat/dms/:userId`, including query keys and mutation handling in the shared chat data layer.
- Updated the chats page to merge regular channels with DMs, keep DM lists refreshed on chat activity, and select newly created DMs immediately.
- Updated the channel modal to select exactly one target user for DMs and route DM creation through the idempotent backend DM endpoint instead of generic channel creation.
- Updated the sidebar and chat header to render DM display name, email, and avatar from `otherUser`.
- File-scoped ESLint passed for the touched chat data layer, modal, sidebar, and chats page files.

## Current Task: Chats Emoji Picker

- [x] Inspect the Frimousse API and current chat composer integration point
- [x] Integrate a Frimousse emoji picker into the shared chat composer used by `/chats`
- [x] Verify the chats page emoji picker integration with targeted frontend checks

### Result

- Integrated Frimousse into the shared `MessageInput` used by the workspace chats page, replacing the placeholder emoji action with a searchable picker in a popover.
- Emoji selection inserts into the textarea at the current cursor position, restores focus, preserves auto-resize behavior, and keeps the typing indicator flow active.
- File-scoped ESLint passed for the touched composer and chats page files.

## Current Task: Quick User Profile Popover

- [x] Inspect the existing chats page, shared UI primitives, and `/users/:id` API shape
- [x] Add shared users client and TanStack Query hook for user details
- [x] Create a reusable avatar-triggered quick user profile popover
- [x] Integrate the popover into chat message avatars on `/chats`
- [x] Verify the touched frontend files with targeted checks
- [x] Add GLightbox iframe-based large avatar preview inside the popover
- [x] Verify the GLightbox avatar preview integration

### Result

- Added shared `/users/:id` frontend client and a keyed TanStack Query hook with reusable query options, `staleTime`, and prefetch support.
- Added a reusable quick profile popover with loading and retry states, triggered from avatar clicks and prefetched on hover/focus.
- Integrated the popover into chat message avatars on the workspace chats page.
- File-scoped ESLint passed for all touched frontend files.
- App-wide `pnpm run check-types` still fails from unrelated pre-existing errors in editor, performance, auth, and socket files outside this change set.
- Added a GLightbox-powered large avatar preview from the popover using the library's iframe/external slide path with a generated HTML document around the image.
- File-scoped ESLint passed again after the GLightbox enhancement.

## Current Task: Chats Page UX Consistency

- [x] Inspect the existing `/chats` page integration
- [x] Replace the ad hoc composer with shared chat primitives
- [x] Verify the edited page with file-scoped lint

### Result

- The chats page now uses the shared `MessageInput`, `ConnectionStatus`, and `TypingIndicator` components.
- Message rendering is sorted chronologically so the newest message stays at the bottom.
- File-scoped ESLint passed for the touched frontend file.

## Current Task: Workspace Member Avatar Field

- [x] Inspect workspace member response shape
- [x] Add `avatarUrl` to enriched workspace member user payload
- [x] Verify the workspace package still typechecks for the touched files

### Result

- Workspace member payloads now include `user.avatarUrl` from the underlying user record.
- File-scoped ESLint passed for the touched backend files.

## Current Task: Teammates Pane Avatar Display

- [x] Read the teammates settings pane layout
- [x] Render the member avatar alongside display name and email
- [x] Verify the changed frontend files with targeted lint

### Result

- Teammates now show `user.avatarUrl` in the avatar component with initials fallback.
- File-scoped ESLint passed for the touched frontend files.

**Created:** March 26, 2026
**Based on:** Backend & Frontend Integration Analysis

---

## Priority 1: Critical Missing Features

### [ ] Task 1: Clients Backend Module

**Priority:** HIGH
**Effort:** 4-6 hours
**Status:** NOT STARTED

**Description:** Implement complete backend for Clients module

**Subtasks:**

- [ ] Create NestJS module structure (clients.module.ts)
- [ ] Create TypeORM entity (client.entity.ts)
- [ ] Create DTOs (create-client.dto.ts, update-client.dto.ts)
- [ ] Create service (clients.service.ts)
- [ ] Create controller (clients.controller.ts) with endpoints:
  - POST /clients - Create client
  - GET /clients - List clients (paginated, workspace-scoped)
  - GET /clients/:id - Get client details
  - PATCH /clients/:id - Update client
  - DELETE /clients/:id - Delete client
  - GET /clients/:id/projects - Get client projects
  - GET /clients/:id/notes - Get client notes
- [ ] Add workspace permissions
- [ ] Add Swagger documentation
- [ ] Write unit tests

**Files to Create:**

```
/apps/api/src/clients/
  ├── clients.module.ts
  ├── clients.service.ts
  ├── clients.controller.ts
  ├── entities/client.entity.ts
  ├── dto/create-client.dto.ts
  ├── dto/update-client.dto.ts
  └── dto/client-query.dto.ts
```

---

### [ ] Task 2: Clients Frontend Integration

**Priority:** HIGH
**Effort:** 3-4 hours
**Status:** NOT STARTED

**Description:** Create API client and integrate with frontend

**Subtasks:**

- [ ] Create clients-client.ts (API client)
- [ ] Create clients-query.ts (TanStack Query hooks)
- [ ] Create clients page at /w/:workspaceId/clients
- [ ] Create client detail page at /w/:workspaceId/clients/:id
- [ ] Remove mock data from /lib/data/clients.ts
- [ ] Add client form components
- [ ] Add client list/table component
- [ ] Add client detail view

**Files to Create:**

```
/apps/project-dashboard/lib/clients/
  ├── clients-client.ts
  └── clients-query.ts
/apps/project-dashboard/app/(protected)/w/[workspaceId]/clients/
  └── page.tsx
/apps/project-dashboard/app/(protected)/w/[workspaceId]/clients/[id]/
  └── page.tsx
```

---

## Priority 2: AI Features (High Impact)

### [ ] Task 3: AI Infrastructure Setup

**Priority:** HIGH
**Effort:** 2-3 hours
**Status:** NOT STARTED

**Description:** Set up AI provider and service layer

**Subtasks:**

- [ ] Choose AI provider (OpenAI/Anthropic/Ollama)
- [ ] Install dependencies:
  - `pnpm add ai @ai-sdk/openai` (or @ai-sdk/anthropic)
  - `pnpm add langchain @langchain/core`
  - `pnpm add pgvector` (if using pgvector)
- [ ] Add environment variables to .env.example:
  - OPENAI_API_KEY or ANTHROPIC_API_KEY
  - AI_MODEL=gpt-4o or claude-3-5-sonnet
- [ ] Create AI service module in backend
- [ ] Create AI configuration service
- [ ] Add rate limiting for AI endpoints
- [ ] Add AI usage tracking/logging

**Files to Create:**

```
/apps/api/src/ai/
  ├── ai.module.ts
  ├── ai.service.ts
  ├── ai.config.ts
  └── dto/ai-request.dto.ts
```

---

### [ ] Task 4: Journal AI Analysis

**Priority:** HIGH
**Effort:** 8-12 hours
**Status:** NOT STARTED

**Description:** Implement AI-powered journal analysis and insights

**Subtasks:**

- [ ] Create journal analysis service
- [ ] Implement sentiment analysis endpoint
- [ ] Implement mood trend analysis
- [ ] Create auto-summary generation
- [ ] Implement pattern detection
- [ ] Create frontend AI insights component
- [ ] Add weekly/monthly report generation
- [ ] Add mood prediction chart

**Backend Endpoints to Create:**

```
POST   /journal-entries/:id/analyze           - Analyze single entry
GET    /journal-entries/analysis/summary      - Get period summary
GET    /journal-entries/insights              - Get AI insights
POST   /journal-entries/generate-summary      - Generate period report
GET    /journal-entries/mood-trends           - Get mood trends
```

**Files to Create:**

```
/apps/api/src/journal-entries/journal-ai.service.ts
/apps/api/src/journal-entries/dto/analyze-entry.dto.ts
/apps/project-dashboard/lib/journal-entries/journal-ai-client.ts
/apps/project-dashboard/components/journal/ai-insights.tsx
```

---

### [ ] Task 5: Task & Goal Recommendations

**Priority:** HIGH
**Effort:** 10-15 hours
**Status:** NOT STARTED

**Description:** AI-powered task prioritization and goal recommendations

**Subtasks:**

- [ ] Create task recommendation service
- [ ] Implement smart prioritization algorithm
- [ ] Create goal achievement prediction
- [ ] Add workload balancing suggestions
- [ ] Create milestone generation
- [ ] Build frontend recommendation UI
- [ ] Add "Recommended Next Action" feature
- [ ] Create goal insights dashboard

**Backend Endpoints to Create:**

```
GET    /tasks/recommendations                 - Get task recommendations
GET    /tasks/priority-score/:id              - Calculate priority score
GET    /goals/insights                        - Get goal insights
POST   /goals/generate-milestones             - AI-generate milestones
GET    /performance/suggestions               - Get improvement suggestions
POST   /goals/predict-achievement/:id         - Predict success rate
```

**Files to Create:**

```
/apps/api/src/tasks/task-recommendation.service.ts
/apps/api/src/goals/goal-insights.service.ts
/apps/project-dashboard/lib/tasks/task-recommendations-client.ts
/apps/project-dashboard/lib/goals/goal-insights-client.ts
/apps/project-dashboard/components/tasks/recommended-tasks.tsx
/apps/project-dashboard/components/goals/goal-insights.tsx
```

---

## Priority 3: AI Features (Medium Impact)

### [ ] Task 6: Chat AI Assistant

**Priority:** MEDIUM
**Effort:** 15-20 hours
**Status:** NOT STARTED

**Description:** AI-powered chat assistance and summarization

**Subtasks:**

- [ ] Create chat AI service
- [ ] Implement message summarization
- [ ] Add smart reply suggestions
- [ ] Create AI assistant channel bot
- [ ] Implement thread summarization
- [ ] Add context-aware responses
- [ ] Build frontend AI assistant UI
- [ ] Add "Ask AI" feature in chat

**Backend Endpoints to Create:**

```
POST   /chat/messages/:id/summarize           - Summarize message thread
POST   /chat/ai-reply                         - Generate AI reply
GET    /chat/channels/:id/summary             - Get channel summary
POST   /chat/ai/ask                           - Ask AI assistant
POST   /chat/messages/suggest-reply           - Suggest reply
GET    /chat/channels/:id/key-points          - Extract key points
```

**Files to Create:**

```
/apps/api/src/chat/chat-ai.service.ts
/apps/project-dashboard/lib/chat/chat-ai-client.ts
/apps/project-dashboard/components/chat/ai-assistant.tsx
/apps/project-dashboard/components/chat/message-summary.tsx
/apps/project-dashboard/components/chat/smart-replies.tsx
```

---

### [ ] Task 7: Performance Insights

**Priority:** MEDIUM
**Effort:** 6-10 hours
**Status:** NOT STARTED

**Description:** AI-powered performance analysis and insights

**Subtasks:**

- [ ] Create performance analysis service
- [ ] Implement productivity pattern detection
- [ ] Add focus time optimization
- [ ] Create burnout risk detection
- [ ] Generate weekly performance reports
- [ ] Build insights dashboard UI
- [ ] Add productivity trends chart
- [ ] Create goal suggestion engine

**Backend Endpoints to Create:**

```
GET    /performance/insights                  - Get AI insights
GET    /performance/weekly-report             - Generate weekly report
GET    /performance/patterns                  - Detect patterns
POST   /performance/generate-goals            - Suggest new goals
GET    /performance/burnout-risk              - Assess burnout risk
GET    /performance/focus-time-analysis       - Analyze focus patterns
```

**Files to Create:**

```
/apps/api/src/performance/performance-ai.service.ts
/apps/project-dashboard/lib/performance/performance-ai-client.ts
/apps/project-dashboard/components/performance/ai-insights.tsx
/apps/project-dashboard/components/performance/weekly-report.tsx
```

---

### [ ] Task 8: Note Summarization & Audio Transcription

**Priority:** MEDIUM
**Effort:** 10-15 hours
**Status:** NOT STARTED

**Description:** Auto-summarize notes and transcribe audio

**Subtasks:**

- [ ] Create note summarization service
- [ ] Implement audio transcription (Whisper API)
- [ ] Add action item extraction
- [ ] Create smart tagging system
- [ ] Build meeting notes template
- [ ] Add summary generation UI
- [ ] Create transcription progress indicator
- [ ] Add searchable transcript text

**Backend Endpoints to Create:**

```
POST   /notes/:id/summarize                   - Summarize note
POST   /notes/transcribe-audio                - Transcribe audio note
POST   /notes/extract-action-items            - Extract tasks from note
POST   /notes/auto-tag                        - Auto-generate tags
GET    /notes/:id/key-points                  - Extract key points
POST   /notes/meeting-to-tasks                - Convert meeting to tasks
```

**Files to Create:**

```
/apps/api/src/notes/note-ai.service.ts
/apps/project-dashboard/lib/notes/note-ai-client.ts
/apps/project-dashboard/components/notes/note-summary.tsx
/apps/project-dashboard/components/notes/audio-transcription.tsx
/apps/project-dashboard/components/notes/action-items.tsx
```

---

## Priority 4: AI Features (Lower Impact)

### [ ] Task 9: Smart Categorization

**Priority:** LOW
**Effort:** 6-8 hours
**Status:** NOT STARTED

**Description:** Auto-categorize transactions and tasks

**Subtasks:**

- [ ] Create categorization service
- [ ] Implement transaction auto-categorization
- [ ] Add task categorization suggestions
- [ ] Create expense pattern detection
- [ ] Build budget recommendations
- [ ] Add category learning from user behavior
- [ ] Create manual override UI
- [ ] Add category confidence scores

**Backend Endpoints to Create:**

```
POST   /transactions/:id/categorize           - Auto-categorize
GET    /transactions/suggestions              - Get category suggestions
GET    /budgets/recommendations               - Budget optimization tips
POST   /transactions/analyze-patterns         - Detect spending patterns
GET    /transactions/category-stats           - Category statistics
POST   /tasks/suggest-category                - Suggest task category
```

**Files to Create:**

```
/apps/api/src/transactions/categorization.service.ts
/apps/project-dashboard/lib/transactions/categorization-client.ts
/apps/project-dashboard/components/transactions/category-suggestions.tsx
/apps/project-dashboard/components/budgets/recommendations.tsx
```

---

## Priority 5: Page Integration Cleanup

### [ ] Task 10: Budgets Page Integration

**Priority:** MEDIUM
**Effort:** 1-2 hours
**Status:** NOT STARTED

**Description:** Create dedicated budgets page in workspace route

**Subtasks:**

- [ ] Create /w/:workspaceId/budgets page
- [ ] Add budget list view
- [ ] Add budget form
- [ ] Add spending summary chart
- [ ] Connect to existing API client

---

### [ ] Task 11: Habits Page Integration

**Priority:** MEDIUM
**Effort:** 1-2 hours
**Status:** NOT STARTED

**Description:** Create dedicated habits page in workspace route

**Subtasks:**

- [ ] Create /w/:workspaceId/habits page
- [ ] Add habit list with completion status
- [ ] Add habit form
- [ ] Add habit streak visualization
- [ ] Connect to existing API client

---

### [ ] Task 12: Journal Page Integration

**Priority:** MEDIUM
**Effort:** 2-3 hours
**Status:** NOT STARTED

**Description:** Create dedicated journal page in workspace route

**Subtasks:**

- [ ] Create /w/:workspaceId/journal page
- [ ] Add journal entry list
- [ ] Add journal editor
- [ ] Add mood tracking visualization
- [ ] Add AI insights panel (when Task 4 complete)
- [ ] Connect to existing API client

---

### [ ] Task 13: Performance Page Integration

**Priority:** LOW
**Effort:** 1-2 hours
**Status:** NOT STARTED

**Description:** Create dedicated performance page in workspace route

**Subtasks:**

- [ ] Create /w/:workspaceId/performance page
- [ ] Add KPI dashboard
- [ ] Add charts for metrics
- [ ] Add AI insights panel (when Task 7 complete)
- [ ] Connect to existing API client

---

### [ ] Task 14: Inbox Page Integration

**Priority:** LOW
**Effort:** 2-3 hours
**Status:** NOT STARTED

**Description:** Create unified inbox for notifications and updates

**Subtasks:**

- [ ] Create /w/:workspaceId/inbox page
- [ ] Aggregate notifications, mentions, updates
- [ ] Add notification preferences
- [ ] Add read/unread management
- [ ] Connect to notifications API

---

### [ ] Task 15: Habit Logs Page Integration

**Priority:** LOW
**Effort:** 1-2 hours
**Status:** NOT STARTED

**Description:** Create habit logs view page

**Subtasks:**

- [ ] Create /w/:workspaceId/habit-logs page
- [ ] Add calendar view
- [ ] Add habit log list
- [ ] Add filtering by habit/date
- [ ] Connect to existing API client

---

## Summary

### Total Tasks: 15

| Priority        | Count  | Estimated Hours |
| --------------- | ------ | --------------- |
| HIGH (Critical) | 3      | 9-13 hours      |
| HIGH (AI)       | 2      | 18-27 hours     |
| MEDIUM (AI)     | 2      | 16-25 hours     |
| MEDIUM (Pages)  | 3      | 4-7 hours       |
| LOW (AI)        | 1      | 6-8 hours       |
| LOW (Pages)     | 4      | 5-9 hours       |
| **TOTAL**       | **15** | **58-89 hours** |

### AI-Specific Tasks: 6

- Task 3: AI Infrastructure Setup
- Task 4: Journal AI Analysis
- Task 5: Task & Goal Recommendations
- Task 6: Chat AI Assistant
- Task 7: Performance Insights
- Task 8: Note Summarization & Audio Transcription
- Task 9: Smart Categorization

**Total AI Implementation:** 55-80 hours

---

## Recommended Order of Execution

1. **Week 1:** Task 1 (Clients Backend), Task 2 (Clients Frontend), Task 3 (AI Setup)
2. **Week 2:** Task 4 (Journal AI)
3. **Week 3:** Task 5 (Task/Goal Recommendations)
4. **Week 4:** Task 7 (Performance Insights), Task 10-13 (Page integrations)
5. **Week 5:** Task 6 (Chat AI)
6. **Week 6:** Task 8 (Note Summarization), Task 9 (Smart Categorization), Task 14-15

---

## Notes

- All AI features require an AI provider API key (OpenAI, Anthropic, or self-hosted)
- Consider implementing rate limiting and usage tracking for AI features
- Add user preferences for AI features (opt-in/opt-out)
- Consider cost implications of AI API calls
- Add caching for AI-generated content to reduce API calls

---

## Summary

| Priority        | Count  | Estimated Hours |
| --------------- | ------ | --------------- |
| HIGH (Critical) | 3      | 9-13 hours      |
| HIGH (AI)       | 2      | 18-27 hours     |
| MEDIUM (AI)     | 2      | 16-25 hours     |
| MEDIUM (Pages)  | 3      | 4-7 hours       |
| LOW (AI)        | 1      | 6-8 hours       |
| LOW (Pages)     | 4      | 5-9 hours       |
| **TOTAL**       | **15** | **58-89 hours** |
