export type IssueStatus =
  | "backlog"
  | "todo"
  | "in-progress"
  | "in-review"
  | "done";

export type IssuePriority = "low" | "medium" | "high" | "urgent";

export type IssueType = "bug" | "task" | "feature" | "improvement";

export interface Issue {
  id: string;
  title: string;
  description?: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
  projectId?: string | null;
  assigneeId?: string | null;
  labels: string[];
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueInput {
  title: string;
  description?: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
  projectId?: string | null;
  assigneeId?: string | null;
  labels?: string[];
  dueDate?: string | null;
}

export type UpdateIssueInput = Partial<CreateIssueInput>;

export interface IssueQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: IssueStatus[];
  priority?: IssuePriority;
  type?: IssueType;
  projectId?: string;
  assigneeIds?: string[];
  labels?: string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedIssuesResponse {
  data: Issue[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiContext {
  accessToken: string | null;
  workspaceId: string | null;
}
