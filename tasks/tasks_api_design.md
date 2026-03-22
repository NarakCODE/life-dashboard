# Tasks API Design & Analysis

## 1. Data Structure Analysis

The static data in `MyTasksPage.tsx` relies on the following relationships and entities:

### Core Entities

1.  **Project**: Groups tasks logically.
    - **Fields**: `id`, `name`, `status`, `target/timeline`, `priority`, etc.
2.  **Workstream**: A sub-grouping of tasks within a project.
    - **Fields**: `id`, `name`, `projectId`.
3.  **User (Assignee)**:
    - **Fields**: `id`, `name`, `avatarUrl`, `role`.
4.  **Task / ProjectTask**: The main entity.
    - **Fields**:
      - `id` (string): Unique identifier.
      - `name` (string): Task title.
      - `status` (enum): `"todo" | "in-progress" | "done"`.
      - `projectId` (string): Relational link to `Project`.
      - `projectName` (string): Denormalized project name (for performance in aggregations).
      - `workstreamId` (string): Relational link to `Workstream`.
      - `workstreamName` (string): Denormalized workstream name.
      - `startDate` (Date, optional): Used for sorting and week board views.
      - `assignee` (User, optional): User object or relational User ID.
      - `priority` (string, optional): `"no-priority" | "low" | "medium" | "high" | "urgent"`.
      - `tag` (string, optional): Categorization tag (e.g., "frontend", "bug").
      - `description` (string, optional): Short description.

### Derived & State Fields

- **FilterCounts**: Aggregated totals (e.g., number of tasks per status, member, priority, tags). This is critical for the `FilterPopover`.
- **Permissions**: A user can see tasks assigned to them, or tasks for projects they belong to.

---

## 2. JSON Schema Examples

### Example API Request (List `/tasks`)

```json
{
  "filters": {
    "members": ["jason"],
    "status": ["todo", "in-progress"]
  },
  "view": "board",
  "groupBy": "project"
}
```

### Example API Response (List Tasks with Filter Counts)

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "1-ws-1-t1",
        "name": "Design system setup",
        "status": "in-progress",
        "projectId": "1",
        "projectName": "Fintech Mobile App Redesign",
        "workstreamId": "1-ws-1",
        "workstreamName": "Initial discovery & alignment",
        "startDate": "2024-01-23T00:00:00Z",
        "priority": "high",
        "tag": "Design",
        "assignee": {
          "id": "jason-duong",
          "name": "Jason Duong",
          "avatarUrl": "https://..."
        }
      }
    ]
  },
  "meta": {
    "filterCounts": {
      "status": { "todo": 12, "in-progress": 5, "done": 23 },
      "members": { "jason": 10, "unassigned": 2 },
      "tags": { "Design": 4, "Backend": 8 }
    }
  }
}
```

### Example API Response (Single Task)

```json
{
  "success": true,
  "data": {
    "id": "1-ws-1-t1",
    "name": "Design system setup",
    "status": "in-progress",
    "projectId": "1",
    "projectName": "Fintech Mobile App Redesign",
    "workstreamId": "1-ws-1",
    "workstreamName": "Initial discovery & alignment",
    "startDate": "2024-01-23T00:00:00Z",
    "priority": "high",
    "tag": "Design",
    "description": "Establish the token and spacing system.",
    "assignee": {
      "id": "jason-duong",
      "name": "Jason Duong",
      "avatarUrl": "https://..."
    }
  }
}
```

---

## 3. Backend API Design

**Base URL**: `/api/v1/tasks`

### GET `/api/v1/tasks/my-tasks`

Fetches a user's tasks across all projects, aggregated for the frontend UI.

- **Query Parameters**:
  - `status` (string[]): Filter by status (e.g., `"todo,in-progress"`).
  - `assigneeIds` (string[]): Filter by assignees.
  - `tags` (string[]): Filter by tags.
  - `startDateFrom` / `startDateTo` (ISO dates): For calendar/week views limit.
  - `projectId` (string): For filtering to a specific project.
- **Returns**: Paginated list or grouped list. `meta` object must contain `filterCounts` calculated based on the _base_ query data (before some filters are applied, so chips can render correct totals).

### POST `/api/v1/tasks`

Create a quick task.

- **Body Payload**: `name`, `projectId`, `workstreamId` (optional), `startDate` (optional), `status` (optional).
- **Returns**: Task DTO.

### GET `/api/v1/tasks/:id`

Fetch single task definition.

### PATCH `/api/v1/tasks/:id`

Modify specific details (drag-and-drop status update, date changes, tag assignment).

- **Body Payload** (Partial):
  - `status`: Updates task state.
  - `startDate`: Handles drag-on-board.
  - `tag`: Inline tag assignment.

### DELETE `/api/v1/tasks/:id`

Remove task.

---

## 4. Database Schema Recommendation

**Given NestJS + Mongoose (MongoDB):**

```typescript
// schemas/task.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ default: "todo", enum: ["todo", "in-progress", "done"] })
  status: string;

  @Prop({ type: Types.ObjectId, ref: "Project", required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Workstream" })
  workstreamId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User" })
  assigneeId: Types.ObjectId;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({
    enum: ["no-priority", "low", "medium", "high", "urgent"],
    default: "no-priority",
  })
  priority: string;

  @Prop()
  tag: string;

  @Prop()
  description: string;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

// Indexes
TaskSchema.index({ assigneeId: 1, status: 1 });
TaskSchema.index({ projectId: 1 });
TaskSchema.index({ startDate: 1 });
```

**Notes**: Denormalization of `projectName` and `workstreamName` can be handled via MongoDB aggregation `$lookup` or caching them on the `Task` schema explicitly for fast reads.

---

## 5. Implementation Notes (NestJS skeleton)

```typescript
// tasks.controller.ts
@Controller("tasks")
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get("my-tasks")
  async getMyTasks(@CurrentUser() user: any, @Query() query: MyTasksQueryDto) {
    const data = await this.tasksService.getUserTasks(user.id, query);
    const filterCounts = await this.tasksService.getProjectFilterAggregation(
      user.id,
    );

    return {
      success: true,
      data: data.tasks, // Could group via map/reduce backend or send flat to UI
      meta: {
        filterCounts,
      },
    };
  }

  @Patch(":id")
  async updateTask(
    @Param("id") id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: any,
  ) {
    const task = await this.tasksService.update(id, dto, user.id);
    return { success: true, data: task };
  }
}

// tasks.service.ts
@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
  ) {}

  async getUserTasks(userId: string, query: MyTasksQueryDto) {
    // Uses $match and $lookup to join project names and return flattened ProjectTasks
    const pipeline = [
      { $match: { assigneeId: new Types.ObjectId(userId) } },
      // ... optional filters
      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "_id",
          as: "project",
        },
      },
      { $unwind: "$project" },
      {
        $project: {
          id: "$_id",
          name: 1,
          status: 1,
          startDate: 1,
          projectId: 1,
          projectName: "$project.name",
          assignee: true, // lookup assignee if needed
        },
      },
    ];

    const tasks = await this.taskModel.aggregate(pipeline);
    return { tasks };
  }

  async getProjectFilterAggregation(userId: string) {
    // Generates the `counts` object for tags, status, members map-reduced
  }
}
```

---

## 6. Tradeoffs & Improvements

- **Tradeoff (Data Grouping)**: The `MyTasksPage` React component currently groups tasks explicitly by `projectId` inside the UI (`setGroups`). The backend should supply flattened data, allowing the frontend components (like `visibleGroups = useMemo(...)`) to dynamically recreate the `ProjectTaskGroup[]` based on ViewOptions. This avoids underfetching (if we need independent task filtering) and offloads compute to the client.
- **Tradeoff (FilterCounts)**: Computing `filterCounts` on every request can be expensive in MongoDB if there are thousands of tasks. _Improvement_: Only recalculate counts when a filter query changes or rely on caching/Redis, or limit the count calculation to only active projects.
- **Optimistic UI Handling**: The UI makes local state modifications immediately (e.g., `toggleTask`, `changeTaskTag`). The API implementation handles `PATCH`, but the frontend `onTaskUpdated` should await the API promise or optimistically update local state robustly with rollback mechanisms so out-of-sync behavior is minimized.
- **Drag-And-Drop Limitation**: The UI limits drag-and-drop reordering to within the same group right now. If sorting by manual ordering is needed, the `Task` database schema might need a `position` or `order` integer field, updated via a batch endpoint (`PATCH /tasks/reorder`).
