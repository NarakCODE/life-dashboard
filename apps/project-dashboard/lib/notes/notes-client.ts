import { apiRequest, apiRequestEnvelope } from "@/lib/api/api-client";
import type {
  CreateNoteInput,
  NotesQuery,
  NotesResponse,
  UpdateNoteInput,
} from "@/lib/notes/types";
import type { ProjectNote } from "@/lib/data/project-details";

function buildQueryString(query: NotesQuery) {
  const params = new URLSearchParams();

  const entries = Object.entries(query) as Array<
    [keyof NotesQuery, NotesQuery[keyof NotesQuery]]
  >;

  for (const [key, value] of entries) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export async function getNotesByProject(
  workspaceId: string,
  projectId: string,
  query: Omit<NotesQuery, "projectId">,
): Promise<NotesResponse> {
  const payload = await apiRequestEnvelope<NotesResponse["data"]>({
    path: `/notes/by-project/${projectId}${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  });

  return {
    data: payload.data,
  };
}

export async function getAllNotes(
  workspaceId: string,
  query: NotesQuery,
): Promise<NotesResponse> {
  const payload = await apiRequestEnvelope<NotesResponse["data"]>({
    path: `/notes${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  });

  return {
    data: payload.data,
  };
}

export async function getNote(
  workspaceId: string,
  noteId: string,
): Promise<ProjectNote> {
  return apiRequest<ProjectNote>({
    path: `/notes/${noteId}`,
    auth: "required",
    workspaceId,
  });
}

export async function createNote(
  workspaceId: string,
  input: CreateNoteInput,
): Promise<ProjectNote> {
  return apiRequest<ProjectNote>({
    path: "/notes",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  });
}

export async function updateNote(
  workspaceId: string,
  noteId: string,
  input: UpdateNoteInput,
): Promise<ProjectNote> {
  return apiRequest<ProjectNote>({
    path: `/notes/${noteId}`,
    method: "PATCH",
    body: input,
    auth: "required",
    workspaceId,
  });
}

export async function deleteNote(workspaceId: string, noteId: string) {
  return apiRequest({
    path: `/notes/${noteId}`,
    method: "DELETE",
    auth: "required",
    workspaceId,
  });
}
