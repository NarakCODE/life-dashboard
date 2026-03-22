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
