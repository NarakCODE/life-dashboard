import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createNote,
  deleteNote,
  getAllNotes,
  getNote,
  getNotesByProject,
  updateNote,
} from "@/lib/notes/notes-client";
import type {
  CreateNoteInput,
  NotesQuery,
  UpdateNoteInput,
} from "@/lib/notes/types";

export const noteKeys = {
  all: (workspaceId: string) => ["workspace", workspaceId, "notes"] as const,
  byProject: (workspaceId: string, projectId: string, query: NotesQuery) =>
    [...noteKeys.all(workspaceId), "project", projectId, query] as const,
  allNotes: (workspaceId: string, query: NotesQuery) =>
    [...noteKeys.all(workspaceId), "all", query] as const,
  detail: (workspaceId: string, noteId: string) =>
    [...noteKeys.all(workspaceId), "detail", noteId] as const,
};

export function useNotesByProjectQuery(
  workspaceId: string,
  projectId: string,
  query: Omit<NotesQuery, "projectId">,
  enabled = true,
) {
  return useQuery({
    queryKey: noteKeys.byProject(workspaceId, projectId, { ...query, projectId }),
    queryFn: () => getNotesByProject(workspaceId, projectId, query),
    enabled: enabled && Boolean(workspaceId) && Boolean(projectId),
  });
}

export function useAllNotesQuery(
  workspaceId: string,
  query: NotesQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: noteKeys.allNotes(workspaceId, query),
    queryFn: () => getAllNotes(workspaceId, query),
    enabled: enabled && Boolean(workspaceId),
  });
}

export function useNoteQuery(
  workspaceId: string,
  noteId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: noteKeys.detail(workspaceId, noteId),
    queryFn: () => getNote(workspaceId, noteId),
    enabled: enabled && Boolean(workspaceId) && Boolean(noteId),
  });
}

export function useCreateNoteMutation(
  workspaceId: string,
  queryToInvalidate?: NotesQuery,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNoteInput) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable");
      }
      return createNote(workspaceId, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: noteKeys.all(workspaceId),
      });
    },
  });
}

export function useUpdateNoteMutation(
  workspaceId: string,
  queryToInvalidate?: NotesQuery,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      noteId,
      input,
    }: {
      noteId: string;
      input: UpdateNoteInput;
    }) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable");
      }
      return updateNote(workspaceId, noteId, input);
    },
    onSuccess: async (_data, { noteId }) => {
      await queryClient.invalidateQueries({
        queryKey: noteKeys.all(workspaceId),
      });
      await queryClient.invalidateQueries({
        queryKey: noteKeys.detail(workspaceId, noteId),
      });
    },
  });
}

export function useDeleteNoteMutation(
  workspaceId: string,
  queryToInvalidate?: NotesQuery,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: string) => {
      if (!workspaceId) {
        throw new Error("Workspace context is unavailable");
      }
      return deleteNote(workspaceId, noteId);
    },
    onSuccess: async (_data, noteId) => {
      await queryClient.invalidateQueries({
        queryKey: noteKeys.all(workspaceId),
      });
      queryClient.removeQueries({
        queryKey: noteKeys.detail(workspaceId, noteId),
      });
    },
  });
}
