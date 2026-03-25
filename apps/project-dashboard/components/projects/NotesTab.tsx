"use client";

import { useMemo, useState } from "react";
import { PlusIcon, Spinner } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";

import type { ProjectNote } from "@/lib/data/project-details";
import { Button } from "@/components/ui/button";
import { NoteCard } from "@/components/projects/NoteCard";
import { NotesTable } from "@/components/projects/NotesTable";
import { NoteCreateSheet } from "@/components/projects/note-create-sheet";
import { NoteDetailsSheet } from "@/components/projects/note-details-sheet";
import { UploadAudioModal } from "@/components/projects/UploadAudioModal";
import {
  useNotesByProjectQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} from "@/lib/notes/notes-query";
import type { NotesQuery, CreateNoteInput } from "@/lib/notes/types";

type NotesTabProps = {
  workspaceId: string;
  projectId: string;
  isActive?: boolean;
};

export function NotesTab({
  workspaceId,
  projectId,
  isActive = false,
}: NotesTabProps) {
  // Query params for fetching notes
  const queryParams: NotesQuery = useMemo(
    () => ({
      projectId,
      page: 1,
      limit: 100,
      sortBy: "createdAt",
      sortOrder: "desc",
    }),
    [projectId],
  );

  // Fetch notes from BFF API - only when tab is active
  const {
    data: notesData,
    isLoading,
    error,
  } = useNotesByProjectQuery(workspaceId, projectId, queryParams, isActive);

  // Mutations
  const createNoteMutation = useCreateNoteMutation(workspaceId);
  const updateNoteMutation = useUpdateNoteMutation(workspaceId);
  const deleteNoteMutation = useDeleteNoteMutation(workspaceId);

  const notes = notesData?.data.notes ?? [];
  const recentNotes = notes.slice(0, 8);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ProjectNote | null>(null);
  const [editingNote, setEditingNote] = useState<ProjectNote | null>(null);

  const handleAddNote = () => {
    setEditingNote(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateNote = async (title: string, content: string) => {
    try {
      const input: CreateNoteInput = {
        title,
        projectId,
        content,
        noteType: "general",
      };
      await createNoteMutation.mutateAsync(input);
      toast.success("Note created successfully");
      setIsCreateModalOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create note";
      toast.error(message);
    }
  };

  const handleUploadAudio = () => {
    setIsUploadModalOpen(true);
  };

  const handleFileSelect = (fileName: string) => {
    // Close both modals
    setIsUploadModalOpen(false);
    setIsCreateModalOpen(false);

    // Simulate processing the uploaded file into a note
    toast(`Processing "${fileName}" into a note...`);

    // TODO: Implement actual audio upload and processing
    setTimeout(() => {
      toast.success(`Note created from "${fileName}"`);
    }, 5000);
  };

  const handleNoteClick = (note: ProjectNote) => {
    setSelectedNote(note);
    setIsPreviewModalOpen(true);
  };

  const handleEditNote = (note: ProjectNote) => {
    setEditingNote(note);
    setIsCreateModalOpen(true);
  };

  const handleUpdateNote = async (
    noteId: string,
    title: string,
    content: string,
  ) => {
    try {
      await updateNoteMutation.mutateAsync({
        noteId,
        input: { title, content },
      });
      toast.success("Note updated successfully");
      setIsCreateModalOpen(false);
      setEditingNote(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update note";
      toast.error(message);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNoteMutation.mutateAsync(noteId);
      toast.success("Note deleted successfully");
      if (selectedNote?.id === noteId) {
        setIsPreviewModalOpen(false);
        setSelectedNote(null);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete note";
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-center px-4 py-16">
          <Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">Failed to load notes.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-accent-foreground">
            Recent notes
          </h2>
          <Button variant="ghost" size="sm" onClick={handleAddNote}>
            <PlusIcon className="h-4 w-4" />
            Add notes
          </Button>
        </div>

        {notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
            <p>No notes yet.</p>
            <Button size="sm" className="mt-4" onClick={handleAddNote}>
              Create your first note
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recentNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={() => handleEditNote(note)}
                  onDelete={handleDeleteNote}
                  onClick={() => handleNoteClick(note)}
                />
              ))}
            </div>

            <section>
              <h2 className="mb-4 text-sm font-semibold text-accent-foreground">
                All notes
              </h2>
              <NotesTable
                notes={notes}
                onAddNote={handleAddNote}
                onEditNote={(noteId) => {
                  const note = notes.find((n) => n.id === noteId);
                  if (note) handleEditNote(note);
                }}
                onDeleteNote={handleDeleteNote}
                onNoteClick={handleNoteClick}
              />
            </section>
          </div>
        )}
      </section>

      <NoteCreateSheet
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) setEditingNote(null);
        }}
        currentUser={{ id: "user", name: "User" }}
        editingNote={editingNote}
        onCreateNote={handleCreateNote}
        onUpdateNote={handleUpdateNote}
        onUploadAudio={handleUploadAudio}
        isPending={createNoteMutation.isPending || updateNoteMutation.isPending}
      />

      <UploadAudioModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        onFileSelect={handleFileSelect}
      />

      <NoteDetailsSheet
        open={isPreviewModalOpen}
        onOpenChange={setIsPreviewModalOpen}
        note={selectedNote}
        onDelete={handleDeleteNote}
        onUpdate={handleUpdateNote}
        isPending={updateNoteMutation.isPending || deleteNoteMutation.isPending}
      />
    </div>
  );
}
