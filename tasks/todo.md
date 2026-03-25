# Tasks - API Integration Audit

## Status: COMPLETE

### 1. Backend API Inventory

**Total: 111 endpoints across 15 modules**

| Module          | Endpoints | Key Routes                                                                                     |
| --------------- | --------- | ---------------------------------------------------------------------------------------------- |
| auth            | 12        | `/auth/register`, `/auth/login`, `/auth/me`, `/auth/refresh`, `/auth/change-password`          |
| workspaces      | 15        | `/workspaces`, `/workspaces/:id`, `/workspaces/:id/invitations`, `/workspaces/resolve-context` |
| projects        | 10        | `/projects`, `/projects/:id`, `/projects/:id/details`, `/projects/:id/tasks/:id`               |
| tasks           | 6         | `/tasks`, `/tasks/my-tasks`, `/tasks/:id`                                                      |
| goals           | 10        | `/goals`, `/goals/:id`, `/goals/:id/log-progress`, `/goals/:id/link-tasks`                     |
| chat            | 10        | `/chat/channels`, `/chat/messages`, `/chat/unread-count`                                       |
| notifications   | 7         | `/notifications`, `/notifications/unread-count`, `/notifications/mark-all-read`                |
| budgets         | 6         | `/budgets`, `/budgets/summary`, `/budgets/:id`                                                 |
| habits          | 6         | `/habits`, `/habits/:id`, `/habits/:id/archive`                                                |
| habit-logs      | 6         | `/habit-logs`, `/habit-logs/habit/:id`, `/habit-logs/:id`                                      |
| journal-entries | 6         | `/journal-entries`, `/journal-entries/mood-summary`, `/journal-entries/:id`                    |
| notes           | 6         | `/notes`, `/notes/by-project/:projectId`, `/notes/:id`                                         |
| transactions    | 6         | `/transactions`, `/transactions/summary`, `/transactions/:id`                                  |
| dashboard       | 1         | `/dashboard/tasks-overview`                                                                    |
| onboarding      | 4         | `/onboarding/me`, `/onboarding/start`, `/onboarding/complete`                                  |
| users           | 0         | No controller (user ops via auth module)                                                       |

**Guards Used:**

- `JwtAuthGuard` - JWT authentication
- `WorkspaceAccessGuard` - Workspace membership verification
- `WorkspacePermissionGuard` - Permission-level checks (BUDGET_READ, TASK_WRITE, etc.)
- `WorkspaceRoleGuard` - Role-level checks (OWNER, ADMIN, MEMBER)

---

### 2. Frontend Requirements

**17 API client modules** in `apps/project-dashboard/lib/`:

- auth, workspaces, projects, project-details, tasks, project-wizard
- budgets, habits, habit-logs, goals, journal-entries, notes
- transactions, notifications, chat, onboarding

**Key Pages Requiring API Data:**

- `/projects`, `/projects/:id`, `/projects/:id/backlog`
- `/tasks`, `/budgets`, `/habits`, `/goals`, `/journal`
- `/inbox`, `/notifications`, `/chat`, `/onboarding`
- `/performance`, `/clients`, `/workspace/:id`

---

### 3. Existing API Design Documents

Found: `tasks/tasks_api_design.md` - Comprehensive design for tasks module including:

- Data structure (Project, Workstream, Task, User)
- JSON schema examples
- Backend API design with filters and aggregations
- Database schema recommendations (Mongoose)
- Implementation notes for NestJS

**Key design requirements from document:**

- `GET /tasks/my-tasks` with filters and `filterCounts` in meta
- Denormalized `projectName`, `workstreamName` in task responses
- Aggregated filter counts for status, members, tags
- Support for drag-and-drop reordering with `position` field

---

### 4. Gap Analysis: Backend vs Frontend

#### ✅ Fully Implemented

| Feature              | Backend                             | Frontend                       | Status      |
| -------------------- | ----------------------------------- | ------------------------------ | ----------- |
| Authentication       | Full JWT + refresh + OTP            | Auth hooks, guards             | ✅ Complete |
| Workspace management | CRUD + invitations + members        | Sidebar switcher, settings     | ✅ Complete |
| Projects             | CRUD + details endpoint             | Project list, details page     | ✅ Complete |
| Tasks (basic)        | CRUD + my-tasks                     | Task list, board, quick create | ✅ Complete |
| Goals                | CRUD + link tasks/habits + progress | Goals page, linking UI         | ✅ Complete |
| Habits               | CRUD + archive                      | Habits page                    | ✅ Complete |
| Habit Logs           | CRUD by habit                       | Habit logs page                | ✅ Complete |
| Budgets              | CRUD + summary                      | Budgets page, summary cards    | ✅ Complete |
| Transactions         | CRUD + summary                      | Transactions page              | ✅ Complete |
| Journal              | CRUD + mood summary                 | Journal page, analytics        | ✅ Complete |
| Notes                | CRUD + by-project                   | Notes tab in project details   | ✅ Complete |
| Notifications        | CRUD + unread + mark-all            | Inbox page, dropdown badge     | ✅ Complete |
| Chat                 | Channels + messages + unread        | Chat page, sidebar             | ✅ Complete |
| Onboarding           | State + steps + complete            | Onboarding setup page          | ✅ Complete |

#### ⚠️ Partially Implemented / Gaps

| Feature                    | Gap                                                                       | Impact                                | Priority |
| -------------------------- | ------------------------------------------------------------------------- | ------------------------------------- | -------- |
| **Tasks - Filter Counts**  | Backend returns tasks but `filterCounts` aggregation may be incomplete    | Filter popover shows incorrect totals | High     |
| **Tasks - Reorder**        | No dedicated `PATCH /tasks/reorder` endpoint for cross-project reordering | Drag-and-drop reordering limited      | Medium   |
| **Tasks - Position field** | Task schema lacks `position`/`order` field for manual sorting             | Cannot persist custom task order      | Medium   |
| **Project Details**        | Notes, files, timeline tabs use placeholder data                          | Rich project details incomplete       | Low      |
| **Chat - Socket**          | No WebSocket integration for real-time messages                           | Chat requires manual refresh          | Low      |
| **Performance Module**     | Only 1 endpoint (`/dashboard/tasks-overview`)                             | Performance page likely incomplete    | Medium   |
| **Clients Module**         | No backend clients module                                                 | `/clients` route uses mock data       | High     |

#### 🔴 Missing Endpoints

| Endpoint                   | Purpose               | Frontend Need               |
| -------------------------- | --------------------- | --------------------------- |
| `GET /clients`             | List clients          | Clients page                |
| `POST /clients`            | Create client         | Client create dialog        |
| `GET /clients/:id`         | Client details        | Client details page         |
| `PATCH /clients/:id`       | Update client         | Client edit                 |
| `DELETE /clients/:id`      | Delete client         | Client delete action        |
| `PATCH /tasks/reorder`     | Batch reorder tasks   | Drag-and-drop across groups |
| `GET /performance/metrics` | Performance analytics | Performance dashboard       |
| `POST /performance/goals`  | Set performance goals | Goal setting UI             |

---

### 5. Recommendations

#### Immediate (High Priority)

1. **Add Clients Module** - Frontend has routes but no backend support
2. **Fix Tasks Filter Counts** - Ensure `GET /tasks/my-tasks` returns accurate aggregations
3. **Add Task Reorder Endpoint** - Support drag-and-drop with `position` field

#### Short-term (Medium Priority)

4. **Expand Performance Module** - Add metrics and goals endpoints
5. **Project Details Enrichment** - Add real notes/files/timeline data endpoints
6. **Add `@ApiProperty()` to `PaginatedResultDto.meta`** - Fix Swagger documentation

#### Long-term (Low Priority)

7. **WebSocket for Chat** - Real-time message delivery
8. **Currency Conversion for Budgets** - Multi-workspace currency support

---

### 6. Schema Recommendations

**Task Schema Updates Needed:**

```typescript
@Prop({ type: Number, default: 0 })
position?: number; // For manual ordering

@Prop({ type: [{ type: Types.ObjectId, ref: 'Habit' }], default: [] })
linkedHabits?: Types.ObjectId[]; // Already in goals, consider bidirectional

@Prop({ type: [{ type: Types.ObjectId, ref: 'Client' }], default: [] })
linkedClients?: Types.ObjectId[]; // For client-linked tasks
```

**New Schema Needed:**

```typescript
// clients/client.schema.ts
@Schema({ timestamps: true })
export class Client extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  email?: string;

  @Prop()
  phone?: string;

  @Prop({ type: Types.ObjectId, ref: "Workspace", required: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: "Project" }], default: [] })
  projects?: Types.ObjectId[];
}
```

---

## Review / Results

- Audited 16 backend modules: 15 with controllers, 1 (users) service-only
- Documented 111 total endpoints with guards and permission requirements
- Mapped 17 frontend API client modules to backend endpoints
- Identified 8 missing endpoints (clients module, task reorder, performance)
- Found existing API design doc: `tasks/tasks_api_design.md`
- Recommended 3 immediate fixes, 3 short-term improvements, 2 long-term enhancements

---

## 7. Postman Collections Update Task

### Status: COMPLETE

### Objectives

Review all `@apps/api` modules and update the Postman collections in `@apps/api/postman/collections/` to ensure all endpoints are testable.

### Tasks

- [x] Create missing collections:
    - [x] 14-notes.json
    - [x] 15-onboarding.json
    - [x] 16-performance.json
    - [x] 17-health.json
    - [x] 18-filters.json
    - [x] 19-upload.json
- [x] Review and update existing collections:
    - [x] 01-auth.json (Updated with profile and account management)
    - [x] 02-tasks.json (Standardized and verified)
    - [x] 10-dashboard.json (Updated)
    - [x] 11-workspaces.json (Updated with invitations and context resolution)
    - [x] 12-projects.json (Updated with details and reordering)
    - [x] 13-chat.json (Updated with messages and unread summary)
- [x] Standardize variables and environment:
    - [x] Use `{{baseUrl}}` for `http://localhost:3001/api/v1`
    - [x] Use `{{accessToken}}` for Authorization
    - [x] Use `{{workspaceId}}` in headers or URL as needed

---

## 8. Latest Push Review (2026-03-25)

### Status: COMPLETE

### Plan

- [x] Inspect latest commit scope and changed files
- [x] Review backend/frontend changes for correctness and security risks
- [x] Summarize findings with severity and recommendations

### Results

- Reviewed commit `8db74a8` covering chat socket, upload module, performance dashboard, and Postman updates.
- Identified high-priority access-control risk in chat gateway workspace handling.
- Identified functional mismatch in upload MIME validation for documented attachment types.
- Identified repository hygiene issue from committed runtime upload artifacts.
