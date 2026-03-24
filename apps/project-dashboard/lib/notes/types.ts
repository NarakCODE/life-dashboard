import type { ProjectNote } from "@/lib/data/project-details";

export interface NotePagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotesResponseData {
  notes: ProjectNote[];
  pagination: NotePagination;
}

export interface NotesResponse {
  data: NotesResponseData;
}

export interface NotesQuery {
  projectId?: string;
  noteType?: "general" | "meeting" | "audio";
  status?: "completed" | "processing";
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateNoteInput {
  title: string;
  projectId: string;
  content?: string;
  noteType?: "general" | "meeting" | "audio";
  status?: "completed" | "processing";
  audioUrl?: string;
  audioDuration?: string;
}

export interface UpdateNoteInput {
  title?: string;
  projectId?: string;
  content?: string;
  noteType?: "general" | "meeting" | "audio";
  status?: "completed" | "processing";
  audioUrl?: string;
  audioDuration?: string;
}
