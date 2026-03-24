"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Flame,
  Calendar,
  MoreHorizontal,
  Archive,
  Trash,
  Edit,
  CheckCircle2,
  Circle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, PageToolbar, PageLayout } from "@/components/page-layout";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";
import {
  useHabitsQuery,
  useCreateHabitMutation,
  useUpdateHabitMutation,
  useArchiveHabitMutation,
  useDeleteHabitMutation,
} from "@/lib/habits/habits-query";
import { Habit, HabitFrequency, CreateHabitInput } from "@/lib/habits/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FREQUENCY_OPTIONS = [
  { id: HabitFrequency.DAILY, label: "Daily" },
  { id: HabitFrequency.WEEKLY, label: "Weekly" },
  { id: HabitFrequency.MONTHLY, label: "Monthly" },
  { id: HabitFrequency.CUSTOM, label: "Custom" },
];

const COLOR_OPTIONS = [
  { id: "#22c55e", label: "Green" },
  { id: "#3b82f6", label: "Blue" },
  { id: "#f59e0b", label: "Amber" },
  { id: "#ef4444", label: "Red" },
  { id: "#8b5cf6", label: "Purple" },
  { id: "#ec4899", label: "Pink" },
  { id: "#6b7280", label: "Gray" },
];

const WEEK_DAYS = [
  { id: 0, label: "Sun" },
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
];

function formatFrequency(frequency: HabitFrequency, customDays?: number[]) {
  switch (frequency) {
    case HabitFrequency.DAILY:
      return "Daily";
    case HabitFrequency.WEEKLY:
      return "Weekly";
    case HabitFrequency.MONTHLY:
      return "Monthly";
    case HabitFrequency.CUSTOM:
      if (customDays && customDays.length > 0) {
        return `Custom (${customDays
          .map((d) => WEEK_DAYS[d]?.label ?? "")
          .filter(Boolean)
          .join(", ")})`;
      }
      return "Custom";
    default:
      return frequency;
  }
}

interface HabitFormData {
  name: string;
  description: string;
  frequency: HabitFrequency;
  customDays: number[];
  targetCount: number;
  color: string;
  startDate: string;
  endDate: string;
}

function getDefaultFormData(): HabitFormData {
  const isoString = new Date().toISOString();
  const datePart = isoString.split("T")[0] ?? "";
  return {
    name: "",
    description: "",
    frequency: HabitFrequency.DAILY,
    customDays: [],
    targetCount: 1,
    color: "#22c55e",
    startDate: datePart,
    endDate: "",
  };
}

function habitToFormData(habit: Habit): HabitFormData {
  return {
    name: habit.name,
    description: habit.description || "",
    frequency: habit.frequency,
    customDays: habit.customDays || [],
    targetCount: habit.targetCount,
    color: habit.color,
    startDate: habit.startDate ? (habit.startDate.split("T")[0] ?? "") : "",
    endDate: habit.endDate ? (habit.endDate.split("T")[0] ?? "") : "",
  };
}

function formDataToCreateInput(data: HabitFormData): CreateHabitInput {
  const input: CreateHabitInput = {
    name: data.name,
    description: data.description || undefined,
    frequency: data.frequency,
    targetCount: data.targetCount,
    color: data.color,
    startDate: data.startDate
      ? new Date(data.startDate).toISOString()
      : undefined,
    endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
  };

  if (data.frequency === HabitFrequency.CUSTOM && data.customDays.length > 0) {
    input.customDays = data.customDays;
  }

  return input;
}

interface HabitFormDialogProps {
  open: boolean;
  onClose: () => void;
  habit?: Habit;
  onSubmit: (data: HabitFormData) => void;
  isSubmitting?: boolean;
}

function HabitFormDialog({
  open,
  onClose,
  habit,
  onSubmit,
  isSubmitting,
}: HabitFormDialogProps) {
  const isEditing = Boolean(habit);
  const [formData, setFormData] = useState<HabitFormData>(
    habit ? habitToFormData(habit) : getDefaultFormData(),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit(formData);
  };

  const toggleCustomDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      customDays: prev.customDays.includes(day)
        ? prev.customDays.filter((d) => d !== day)
        : [...prev.customDays, day].sort(),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-125">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Habit" : "Create New Habit"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update your habit details below."
                : "Set up a new habit to track your progress."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Morning Exercise"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="e.g., 30 minutes of cardio"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value: HabitFrequency) =>
                    setFormData((prev) => ({ ...prev, frequency: value }))
                  }
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="targetCount">Target Count</Label>
                <Input
                  id="targetCount"
                  type="number"
                  min={1}
                  value={formData.targetCount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      targetCount: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
            </div>

            {formData.frequency === HabitFrequency.CUSTOM && (
              <div className="grid gap-2">
                <Label>Custom Days</Label>
                <div className="flex gap-1">
                  {WEEK_DAYS.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleCustomDay(day.id)}
                      className={cn(
                        "flex-1 py-2 text-xs font-medium rounded-md transition-colors",
                        formData.customDays.includes(day.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80",
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, color: color.id }))
                    }
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      formData.color === color.id
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-105",
                    )}
                    style={{ backgroundColor: color.id }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface HabitCardProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  onArchive: (habitId: string) => void;
  onDelete: (habit: Habit) => void;
}

function HabitCard({ habit, onEdit, onArchive, onDelete }: HabitCardProps) {
  const isArchived = habit.status === "archived";

  return (
    <Card
      className={cn(
        "group transition-all hover:shadow-md",
        isArchived && "opacity-60 grayscale",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
            style={{ backgroundColor: habit.color }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium text-foreground truncate">
                  {habit.name}
                </h3>
                {habit.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {habit.description}
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(habit)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onArchive(habit.id)}>
                    <Archive className="mr-2 h-4 w-4" />
                    {isArchived ? "Unarchive" : "Archive"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(habit)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant="muted" className="text-xs">
                <Calendar className="mr-1 h-3 w-3" />
                {formatFrequency(habit.frequency, habit.customDays)}
              </Badge>

              {habit.targetCount > 1 && (
                <Badge variant="muted" className="text-xs">
                  {habit.targetCount}x /{" "}
                  {habit.frequency === HabitFrequency.DAILY
                    ? "day"
                    : habit.frequency}
                </Badge>
              )}

              {habit.currentStreak > 0 && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    habit.currentStreak >= 7 &&
                      "border-orange-500 text-orange-600",
                  )}
                >
                  <Flame className="mr-1 h-3 w-3" />
                  {habit.currentStreak} streak
                </Badge>
              )}

              {isArchived && (
                <Badge variant="secondary" className="text-xs">
                  Archived
                </Badge>
              )}
            </div>

            {habit.longestStreak > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Best streak: {habit.longestStreak} days
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  habitName: string;
  isDeleting?: boolean;
}

function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  habitName,
  isDeleting,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Habit</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{habitName}&quot;? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function HabitsPage() {
  const auth = useAuth();
  const { workspaceId } = useWorkspaceScope();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(
    undefined,
  );
  const [deletingHabit, setDeletingHabit] = useState<Habit | undefined>(
    undefined,
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "archived"
  >("active");

  const query = useMemo(
    () => ({
      page: 1,
      limit: 100,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
      ...(statusFilter !== "all" && { status: statusFilter }),
    }),
    [statusFilter],
  );

  const isQueryEnabled =
    auth.hasHydrated && auth.isAuthenticated && Boolean(workspaceId);

  const {
    data: habitsData,
    isPending,
    error,
  } = useHabitsQuery(workspaceId ?? "", query, isQueryEnabled);

  const createHabitMutation = useCreateHabitMutation(workspaceId ?? "", query);
  const updateHabitMutation = useUpdateHabitMutation(workspaceId ?? "", query);
  const archiveHabitMutation = useArchiveHabitMutation(
    workspaceId ?? "",
    query,
  );
  const deleteHabitMutation = useDeleteHabitMutation(workspaceId ?? "", query);

  const habits = habitsData?.data.items ?? [];
  const isEmpty = !isPending && habits.length === 0;

  const handleCreateHabit = async (formData: HabitFormData) => {
    try {
      await createHabitMutation.mutateAsync(formDataToCreateInput(formData));
      toast.success("Habit created successfully");
      setIsCreateDialogOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create habit";
      toast.error(message);
    }
  };

  const handleUpdateHabit = async (formData: HabitFormData) => {
    if (!editingHabit) return;
    try {
      await updateHabitMutation.mutateAsync({
        habitId: editingHabit.id,
        input: formDataToCreateInput(formData),
      });
      toast.success("Habit updated successfully");
      setEditingHabit(undefined);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update habit";
      toast.error(message);
    }
  };

  const handleArchiveHabit = async (habitId: string) => {
    try {
      await archiveHabitMutation.mutateAsync(habitId);
      toast.success("Habit archived");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to archive habit";
      toast.error(message);
    }
  };

  const handleDeleteHabit = async () => {
    if (!deletingHabit) return;
    try {
      await deleteHabitMutation.mutateAsync(deletingHabit.id);
      toast.success("Habit deleted");
      setDeletingHabit(undefined);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete habit";
      toast.error(message);
    }
  };

  const openEditDialog = (habit: Habit) => {
    setEditingHabit(habit);
  };

  const openDeleteDialog = (habit: Habit) => {
    setDeletingHabit(habit);
  };

  const isMutating =
    createHabitMutation.isPending ||
    updateHabitMutation.isPending ||
    archiveHabitMutation.isPending ||
    deleteHabitMutation.isPending;

  return (
    <PageLayout>
      <PageHeader
        title="Habits"
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Habit
          </Button>
        }
        toolbar={
          <PageToolbar
            left={
              <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
                <Button
                  size="sm"
                  variant={statusFilter === "active" ? "secondary" : "ghost"}
                  className="h-7 text-xs"
                  onClick={() => setStatusFilter("active")}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Active
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === "archived" ? "secondary" : "ghost"}
                  className="h-7 text-xs"
                  onClick={() => setStatusFilter("archived")}
                >
                  <Archive className="mr-1.5 h-3.5 w-3.5" />
                  Archived
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === "all" ? "secondary" : "ghost"}
                  className="h-7 text-xs"
                  onClick={() => setStatusFilter("all")}
                >
                  <Circle className="mr-1.5 h-3.5 w-3.5" />
                  All
                </Button>
              </div>
            }
          />
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        {isPending && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-24" />
              </Card>
            ))}
          </div>
        )}

        {error && (
          <EmptyState
            title="Failed to load habits"
            description="There was an error loading your habits. Please try again."
            variant="border"
          />
        )}

        {isEmpty && (
          <EmptyState
            title={
              statusFilter === "archived"
                ? "No archived habits"
                : "No habits yet"
            }
            description={
              statusFilter === "archived"
                ? "You haven't archived any habits yet."
                : "Create your first habit to start tracking your progress."
            }
            icon={Calendar}
            action={
              statusFilter !== "archived" && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Habit
                </Button>
              )
            }
            variant="border"
          />
        )}

        {!isPending && !isEmpty && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onEdit={openEditDialog}
                onArchive={handleArchiveHabit}
                onDelete={openDeleteDialog}
              />
            ))}
          </div>
        )}
      </div>

      <HabitFormDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateHabit}
        isSubmitting={createHabitMutation.isPending}
      />

      <HabitFormDialog
        open={Boolean(editingHabit)}
        onClose={() => setEditingHabit(undefined)}
        habit={editingHabit}
        onSubmit={handleUpdateHabit}
        isSubmitting={updateHabitMutation.isPending}
      />

      <DeleteConfirmDialog
        open={Boolean(deletingHabit)}
        onClose={() => setDeletingHabit(undefined)}
        onConfirm={handleDeleteHabit}
        habitName={deletingHabit?.name ?? ""}
        isDeleting={deleteHabitMutation.isPending}
      />
    </PageLayout>
  );
}
