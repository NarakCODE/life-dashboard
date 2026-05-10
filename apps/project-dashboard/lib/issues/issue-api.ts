import type {
  ApiContext,
  CreateIssueInput,
  Issue,
  IssueQueryParams,
  PaginatedIssuesResponse,
  UpdateIssueInput,
} from "./issue-types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

function toQueryString(params?: IssueQueryParams) {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      if (value.length > 0) {
        searchParams.set(key, value.join(","));
      }
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

async function issueRequest<T>(
  path: string,
  context: ApiContext,
  options?: RequestInit,
): Promise<T> {
  if (!context.accessToken) {
    throw new Error("Missing access token.");
  }

  if (!context.workspaceId) {
    throw new Error("Missing workspace ID.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${context.accessToken}`,
      "x-workspace-id": context.workspaceId,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      errorText || `Request failed with status ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function normalizeIssuesResponse(
  response: PaginatedIssuesResponse | Issue[],
): PaginatedIssuesResponse {
  if (Array.isArray(response)) {
    return {
      data: response,
      meta: {
        total: response.length,
        page: 1,
        limit: response.length,
        totalPages: 1,
      },
    };
  }

  return response;
}

export async function getIssues(
  context: ApiContext,
  params?: IssueQueryParams,
) {
  const response = await issueRequest<PaginatedIssuesResponse | Issue[]>(
    `/issues${toQueryString(params)}`,
    context,
  );

  return normalizeIssuesResponse(response);
}

export async function getMyIssues(
  context: ApiContext,
  params?: IssueQueryParams,
) {
  const response = await issueRequest<PaginatedIssuesResponse | Issue[]>(
    `/issues/my-issues${toQueryString(params)}`,
    context,
  );

  return normalizeIssuesResponse(response);
}

export async function getIssueById(context: ApiContext, issueId: string) {
  return issueRequest<Issue>(`/issues/${issueId}`, context);
}

export async function createIssue(
  context: ApiContext,
  input: CreateIssueInput,
) {
  return issueRequest<Issue>("/issues", context, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateIssue(
  context: ApiContext,
  issueId: string,
  input: UpdateIssueInput,
) {
  return issueRequest<Issue>(`/issues/${issueId}`, context, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteIssue(context: ApiContext, issueId: string) {
  return issueRequest<void>(`/issues/${issueId}`, context, {
    method: "DELETE",
  });
}
