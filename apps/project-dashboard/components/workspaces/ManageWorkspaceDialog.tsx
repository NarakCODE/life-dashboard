"use client"

import { useEffect, useState } from "react"
import { Building2, Loader2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useWorkspaceQuery, useCreateWorkspaceMutation, useUpdateWorkspaceMutation, useDeleteWorkspaceMutation } from "@/lib/workspaces/workspace-query"
import type { Workspace } from "@/lib/workspaces/workspace-types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// ============================================================================
// Types
// ============================================================================

interface ManageWorkspaceDialogProps {
  /** Controls dialog visibility */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Workspace ID for edit mode. Omit for create mode. */
  workspaceId?: string
  /** Callback after successful creation */
  onCreateSuccess?: (workspace: Workspace) => void
  /** Callback after successful update */
  onUpdateSuccess?: (workspace: Workspace) => void
  /** Callback after successful deletion */
  onDeleteSuccess?: () => void
}

type DialogMode = "create" | "edit"

// ============================================================================
// Component
// ============================================================================

export function ManageWorkspaceDialog({
  open,
  onOpenChange,
  workspaceId,
  onCreateSuccess,
  onUpdateSuccess,
  onDeleteSuccess,
}: ManageWorkspaceDialogProps) {
  const mode: DialogMode = workspaceId ? "edit" : "create"
  
  // Form state
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState<string | null>(null)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  
  // Data fetching (only in edit mode)
  const { data: workspace, isPending: isLoadingWorkspace } = useWorkspaceQuery(
    workspaceId ?? "",
    { enabled: mode === "edit" && open && !!workspaceId }
  )
  
  // Mutations
  const createMutation = useCreateWorkspaceMutation()
  const updateMutation = useUpdateWorkspaceMutation()
  const deleteMutation = useDeleteWorkspaceMutation()
  
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isDeleting = deleteMutation.isPending
  
  // Initialize form when opening or workspace data loads
  useEffect(() => {
    if (!open) {
      // Reset form when closing
      setName("")
      setNameError(null)
      setShowDeleteAlert(false)
      return
    }
    
    if (mode === "edit" && workspace) {
      setName(workspace.name)
    } else if (mode === "create") {
      setName("")
    }
  }, [open, workspace, mode])
  
  // Validation
  const validate = (): boolean => {
    const trimmedName = name.trim()
    
    if (!trimmedName) {
      setNameError("Workspace name is required")
      return false
    }
    
    if (trimmedName.length > 100) {
      setNameError("Workspace name must be 100 characters or less")
      return false
    }
    
    setNameError(null)
    return true
  }
  
  const handleNameChange = (value: string) => {
    setName(value)
    if (nameError) setNameError(null)
  }
  
  const handleSubmit = async () => {
    if (!validate()) return
    
    try {
      if (mode === "create") {
        const newWorkspace = await createMutation.mutateAsync({
          name: name.trim(),
        })
        toast.success("Workspace created successfully")
        onCreateSuccess?.(newWorkspace)
        onOpenChange(false)
      } else if (mode === "edit" && workspaceId) {
        const updatedWorkspace = await updateMutation.mutateAsync({
          id: workspaceId,
          input: { name: name.trim() },
        })
        toast.success("Workspace updated successfully")
        onUpdateSuccess?.(updatedWorkspace)
        onOpenChange(false)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong"
      toast.error(mode === "create" ? "Failed to create workspace" : "Failed to update workspace", {
        description: message,
      })
    }
  }
  
  const handleDelete = async () => {
    if (!workspaceId) return
    
    try {
      await deleteMutation.mutateAsync(workspaceId)
      toast.success("Workspace deleted successfully")
      setShowDeleteAlert(false)
      onDeleteSuccess?.()
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong"
      toast.error("Failed to delete workspace", {
        description: message,
      })
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit()
    }
  }
  
  // Dialog content based on mode
  const dialogTitle = mode === "create" ? "Create workspace" : "Edit workspace"
  const dialogDescription = mode === "create"
    ? "Create a new workspace to organize your projects and collaborate with your team."
    : "Update your workspace details and manage its settings."
  const submitLabel = mode === "create" ? "Create workspace" : "Save changes"
  
  const canDelete = mode === "edit" && workspace?.type !== "solo"
  const isOwner = mode === "edit" && workspace?.ownerId === workspace?.members?.find(m => m.userId)?.userId
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="size-5" />
              </div>
              <div className="flex-1">
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogDescription>{dialogDescription}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Workspace Name Field */}
            <Field data-invalid={nameError ? true : undefined}>
              <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
              <Input
                id="workspace-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="My Workspace"
                disabled={isLoadingWorkspace || isSubmitting}
                aria-invalid={nameError ? true : undefined}
                autoFocus
              />
              <FieldDescription>
                This is the name that will be displayed to all workspace members.
              </FieldDescription>
              {nameError && <FieldError>{nameError}</FieldError>}
            </Field>
            
            {/* Workspace Info (Edit Mode Only) */}
            {mode === "edit" && workspace && (
              <>
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Workspace details</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type</span>
                      <div className="mt-1">
                        <Badge variant={workspace.type === "solo" ? "secondary" : "default"}>
                          {workspace.type === "solo" ? "Personal" : "Collaborative"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status</span>
                      <div className="mt-1">
                        <Badge variant={workspace.status === "active" ? "default" : "secondary"}>
                          {workspace.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Members</span>
                      <p className="mt-1 font-medium">{workspace.members?.length ?? 1}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created</span>
                      <p className="mt-1 font-medium">
                        {new Date(workspace.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {/* Loading State */}
            {mode === "edit" && isLoadingWorkspace && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          
          <DialogFooter className={cn("gap-2", mode === "edit" && "sm:justify-between")}>
            {mode === "edit" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setShowDeleteAlert(true)}
                disabled={isSubmitting || isDeleting || isLoadingWorkspace}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </Button>
            )}
            
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting || isLoadingWorkspace || !name.trim()}
              >
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {submitLabel}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;<span className="font-medium text-foreground">{workspace?.name}</span>&quot;? 
              This action cannot be undone and will permanently remove all data associated with this workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
