import { apiRequest, apiRequestEnvelope } from "@/lib/api/api-client";
import type {
  CreateNoteInput,
  NotesQuery,
  NotesResponse,
  UpdateNoteInput,
} from "@/lib/notes/types";
import type { ProjectNote } from "@/lib/data/project-details";

/**
 * Backend NoteResponseDto structure
 */
interface BackendNote {
  id: string;
  workspaceId: string;
  title: string;
  content?: string;
  noteType: "general" | "meeting" | "audio";
  status: "completed" | "processing";
  projectId: string;
  projectName?: string;
  audioUrl?: string;
  audioDuration?: string;
  author?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Transform backend NoteResponseDto to frontend ProjectNote format
 */
function transformBackendNote(note: BackendNote): ProjectNote {
  return {
    ...note,
    author: note.author
      ? {
          ...note.author,
          role: undefined, // Backend doesn't provide role
        }
      : undefined,
    audioData: undefined, // Backend doesn't provide audioData, will be loaded separately if needed
    createdAt: new Date(note.createdAt),
    updatedAt: new Date(note.updatedAt),
  } as ProjectNote;
}

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
  const payload = await apiRequestEnvelope<{
    notes: BackendNote[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>({
    path: `/notes/by-project/${projectId}${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  });

  return {
    data: {
      notes: payload.data.notes.map(transformBackendNote),
      pagination: payload.data.pagination,
    },
  };
}

export async function getAllNotes(
  workspaceId: string,
  query: NotesQuery,
): Promise<NotesResponse> {
  const payload = await apiRequestEnvelope<{
    notes: BackendNote[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>({
    path: `/notes${buildQueryString(query)}`,
    auth: "required",
    workspaceId,
  });

  return {
    data: {
      notes: payload.data.notes.map(transformBackendNote),
      pagination: payload.data.pagination,
    },
  };
}

export async function getNote(
  workspaceId: string,
  noteId: string,
): Promise<ProjectNote> {
  const note = await apiRequest<BackendNote>({
    path: `/notes/${noteId}`,
    auth: "required",
    workspaceId,
  });
  return transformBackendNote(note);
}

export async function createNote(
  workspaceId: string,
  input: CreateNoteInput,
): Promise<ProjectNote> {
  const note = await apiRequest<BackendNote>({
    path: "/notes",
    method: "POST",
    body: input,
    auth: "required",
    workspaceId,
  });
  return transformBackendNote(note);
}

export async function updateNote(
  workspaceId: string,
  noteId: string,
  input: UpdateNoteInput,
): Promise<ProjectNote> {
  const note = await apiRequest<BackendNote>({
    path: `/notes/${noteId}`,
    method: "PATCH",
    body: input,
    auth: "required",
    workspaceId,
  });
  return transformBackendNote(note);
}

export async function deleteNote(workspaceId: string, noteId: string) {
  return apiRequest({
    path: `/notes/${noteId}`,
    method: "DELETE",
    auth: "required",
    workspaceId,
  });
}
