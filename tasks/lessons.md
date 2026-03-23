# Lessons Learned

## Date: 2026-03-23

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
