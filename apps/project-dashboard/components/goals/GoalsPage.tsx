"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Target,
  Calendar,
  MoreHorizontal,
  Trash,
  Edit,
  CheckCircle2,
  Circle,
  TrendingUp,
  Archive,
  ListChecks,
  Repeat,
  Zap,
  Link2,
  ListTodo,
  Loader2,
  AlertCircle,
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
import { PageHeader, PageToolbar } from "@/components/page-layout";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";
import {
  useGoalsQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useDeleteGoalMutation,
  useLogProgressMutation,
  useLinkHabitsMutation,
  useLinkTasksMutation,
  useUnlinkHabitMutation,
  useUnlinkTaskMutation,
} from "@/lib/goals/goals-query";
import { Goal, GoalStatus, GoalType, CreateGoalInput } from "@/lib/goals/types";
import { useAllTasksQuery } from "@/lib/tasks/tasks-query";
import type { ProjectTask } from "@/lib/data/project-details";
import { useHabitsQuery } from "@/lib/habits/habits-query";
import type { Habit } from "@/lib/habits/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const GOAL_TYPE_OPTIONS = [
  { id: GoalType.MANUAL, label: "Manual", icon: Target },
  { id: GoalType.TASK_BASED, label: "Task-based", icon: ListChecks },
  { id: GoalType.HABIT_BASED, label: "Habit-based", icon: Repeat },
  { id: GoalType.MIXED, label: "Mixed", icon: Zap },
];

const GOAL_STATUS_OPTIONS = [
  { id: GoalStatus.ACTIVE, label: "Active" },
  { id: GoalStatus.COMPLETED, label: "Completed" },
  { id: GoalStatus.ARCHIVED, label: "Archived" },
];

function getGoalTypeIcon(type: GoalType) {
  switch (type) {
    case GoalType.TASK_BASED:
      return ListChecks;
    case GoalType.HABIT_BASED:
      return Repeat;
    case GoalType.MIXED:
      return Zap;
    case GoalType.MANUAL:
    default:
      return Target;
  }
}

function getGoalTypeLabel(type: GoalType) {
  return (
    GOAL_TYPE_OPTIONS.find((opt) => opt.id === type)?.label ||
    type.charAt(0).toUpperCase() + type.slice(1)
  );
}

function formatDate(dateString?: string) {
  if (!dateString) return null;
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch {
    return null;
  }
}

function formatTaskMeta(task: ProjectTask) {
  return [task.projectName, task.workstreamName].filter(Boolean).join(" / ");
}

function formatTaskStatus(status?: string) {
  if (!status) return "No status";

  return status
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatHabitFrequency(frequency?: string) {
  if (!frequency) return "No frequency";

  return frequency.charAt(0).toUpperCase() + frequency.slice(1);
}

interface GoalFormData {
  title: string;
  description: string;
  targetValue: number;
  unit: string;
  type: GoalType;
  dueDate: string;
  status: GoalStatus;
}

function getDefaultFormData(): GoalFormData {
  const oneMonthLater = new Date();
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
  const dueDatePart = oneMonthLater.toISOString().split("T")[0] ?? "";

  return {
    title: "",
    description: "",
    targetValue: 100,
    unit: "",
    type: GoalType.MANUAL,
    dueDate: dueDatePart,
    status: GoalStatus.ACTIVE,
  };
}

function goalToFormData(goal: Goal): GoalFormData {
  return {
    title: goal.title,
    description: goal.description || "",
    targetValue: goal.targetValue,
    unit: goal.unit || "",
    type: goal.type,
    dueDate: goal.dueDate ? (goal.dueDate.split("T")[0] ?? "") : "",
    status: goal.status,
  };
}

function formDataToCreateInput(data: GoalFormData): CreateGoalInput {
  const input: CreateGoalInput = {
    title: data.title,
    description: data.description || undefined,
    targetValue: data.targetValue,
    unit: data.unit || undefined,
    type: data.type,
    status: data.status,
  };

  if (data.dueDate) {
    input.dueDate = new Date(data.dueDate).toISOString();
  }

  return input;
}

// Goal Form Dialog Component
interface GoalFormDialogProps {
  open: boolean;
  onClose: () => void;
  goal?: Goal;
  onSubmit: (data: GoalFormData) => void;
  isSubmitting?: boolean;
}

function GoalFormDialog({
  open,
  onClose,
  goal,
  onSubmit,
  isSubmitting,
}: GoalFormDialogProps) {
  const isEditing = Boolean(goal);
  const [formData, setFormData] = useState<GoalFormData>(
    goal ? goalToFormData(goal) : getDefaultFormData(),
  );

  useEffect(() => {
    setFormData(goal ? goalToFormData(goal) : getDefaultFormData());
  }, [goal, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-125">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Goal" : "Create New Goal"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update your goal details below."
                : "Set up a new goal to track your progress."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Read 10 books this year"
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
                placeholder="e.g., Focus on personal development and fiction"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="targetValue">Target Value *</Label>
                <Input
                  id="targetValue"
                  type="number"
                  min={1}
                  value={formData.targetValue}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      targetValue: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="unit">Unit (optional)</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, unit: e.target.value }))
                  }
                  placeholder="e.g., books, km, hours"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Goal Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: GoalType) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: GoalStatus) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date (optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dueDate: e.target.value,
                  }))
                }
              />
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
              disabled={isSubmitting || !formData.title.trim()}
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Log Progress Dialog Component
interface LogProgressDialogProps {
  open: boolean;
  onClose: () => void;
  goal: Goal | undefined;
  onSubmit: (value: number, note?: string) => void;
  isSubmitting?: boolean;
}

function LogProgressDialog({
  open,
  onClose,
  goal,
  onSubmit,
  isSubmitting,
}: LogProgressDialogProps) {
  const [value, setValue] = useState<number>(1);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open || !goal) {
      setValue(1);
      setNote("");
      return;
    }

    const suggestedValue = goal.unit === "hours" ? 0.5 : 1;
    setValue(suggestedValue);
    setNote("");
  }, [goal, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value <= 0 || !goal) return;
    onSubmit(value, note || undefined);
    setValue(1);
    setNote("");
  };

  if (!goal) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Log Progress</DialogTitle>
            <DialogDescription>
              Add progress for &quot;{goal.title}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="progress-value">
                Value ({goal.unit || "units"})
              </Label>
              <Input
                id="progress-value"
                type="number"
                min={0.1}
                step={goal.unit === "hours" ? 0.5 : 1}
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="progress-note">Note (optional)</Label>
              <Textarea
                id="progress-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Completed chapter 5"
                rows={2}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              Current: {goal.currentValue} / {goal.targetValue}{" "}
              {goal.unit || ""}
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
            <Button type="submit" disabled={isSubmitting || value <= 0}>
              {isSubmitting ? "Logging..." : "Log Progress"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Delete Confirmation Dialog Component
interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  goalTitle: string;
  isDeleting?: boolean;
}

function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  goalTitle,
  isDeleting,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Goal</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{goalTitle}&quot;? This action
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

interface GoalLinksDialogProps {
  open: boolean;
  onClose: () => void;
  goal: Goal | undefined;
  tasks: ProjectTask[];
  habits: Habit[];
  isTasksPending: boolean;
  isHabitsPending: boolean;
  isSubmitting: boolean;
  onSubmit: (payload: { taskIds: string[]; habitIds: string[] }) => void;
}

function GoalLinksDialog({
  open,
  onClose,
  goal,
  tasks,
  habits,
  isTasksPending,
  isHabitsPending,
  isSubmitting,
  onSubmit,
}: GoalLinksDialogProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);

  useEffect(() => {
    if (!goal || !open) {
      setSelectedTaskIds([]);
      setSelectedHabitIds([]);
      return;
    }

    setSelectedTaskIds(goal.linkedTasks ?? []);
    setSelectedHabitIds(goal.linkedHabits ?? []);
  }, [goal, open]);

  if (!goal) return null;

  const canLinkTasks = goal.type !== GoalType.HABIT_BASED;
  const canLinkHabits = goal.type !== GoalType.TASK_BASED;

  const toggleTask = (taskId: string, checked: boolean) => {
    setSelectedTaskIds((current) =>
      checked ? [...current, taskId] : current.filter((id) => id !== taskId),
    );
  };

  const toggleHabit = (habitId: string, checked: boolean) => {
    setSelectedHabitIds((current) =>
      checked ? [...current, habitId] : current.filter((id) => id !== habitId),
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      taskIds: selectedTaskIds,
      habitIds: selectedHabitIds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-[720px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Manage Goal Links</DialogTitle>
            <DialogDescription>
              Connect tasks and habits to &quot;{goal.title}&quot; to keep
              progress in sync with real work.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="muted">
                <ListTodo className="mr-1 h-3 w-3" />
                {selectedTaskIds.length} task
                {selectedTaskIds.length === 1 ? "" : "s"}
              </Badge>
              <Badge variant="muted">
                <Repeat className="mr-1 h-3 w-3" />
                {selectedHabitIds.length} habit
                {selectedHabitIds.length === 1 ? "" : "s"}
              </Badge>
              <Badge variant="muted">
                <Target className="mr-1 h-3 w-3" />
                {getGoalTypeLabel(goal.type)}
              </Badge>
            </div>

            <Tabs defaultValue="tasks">
              <TabsList>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="habits">Habits</TabsTrigger>
              </TabsList>

              <TabsContent value="tasks" className="mt-4">
                {!canLinkTasks ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Habit-based goals cannot link tasks. Change the goal type to
                    `mixed` or `manual` first.
                  </div>
                ) : isTasksPending ? (
                  <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading tasks...
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    No tasks available in this workspace yet.
                  </div>
                ) : (
                  <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {tasks.map((task) => {
                      const checked = selectedTaskIds.includes(task.id);
                      return (
                        <label
                          key={task.id}
                          className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              toggleTask(task.id, value === true)
                            }
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium text-foreground">
                                {task.name}
                              </span>
                              <Badge variant="outline" className="text-[11px]">
                                {formatTaskStatus(task.status)}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatTaskMeta(task)}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="habits" className="mt-4">
                {!canLinkHabits ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Task-based goals cannot link habits. Change the goal type to
                    `mixed` or `manual` first.
                  </div>
                ) : isHabitsPending ? (
                  <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading habits...
                  </div>
                ) : habits.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    No habits available in this workspace yet.
                  </div>
                ) : (
                  <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {habits.map((habit) => {
                      const checked = selectedHabitIds.includes(habit.id);
                      return (
                        <label
                          key={habit.id}
                          className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              toggleHabit(habit.id, value === true)
                            }
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium text-foreground">
                                {habit.name}
                              </span>
                              <Badge variant="outline" className="text-[11px]">
                                {formatHabitFrequency(habit.frequency)}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {habit.description || "No description"}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Links"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Goal Card Component
interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onLogProgress: (goal: Goal) => void;
  onManageLinks: (goal: Goal) => void;
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onLogProgress,
  onManageLinks,
}: GoalCardProps) {
  const TypeIcon = getGoalTypeIcon(goal.type);
  const formattedDueDate = formatDate(goal.dueDate);
  const isCompleted = goal.status === GoalStatus.COMPLETED;
  const isArchived = goal.status === GoalStatus.ARCHIVED;
  const linkedTaskCount = goal.linkedTasks?.length ?? 0;
  const linkedHabitCount = goal.linkedHabits?.length ?? 0;
  const isOverdue =
    goal.status !== GoalStatus.COMPLETED &&
    goal.status !== GoalStatus.ARCHIVED &&
    Boolean(goal.dueDate) &&
    new Date(goal.dueDate as string).getTime() < Date.now();

  return (
    <Card
      className={cn(
        "group transition-all hover:shadow-md",
        (isCompleted || isArchived) && "opacity-60 grayscale",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex-shrink-0">
            <TypeIcon className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium text-foreground truncate">
                  {goal.title}
                </h3>
                {goal.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {goal.description}
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
                  <DropdownMenuItem onClick={() => onEdit(goal)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  {(goal.type === GoalType.MANUAL ||
                    goal.type === GoalType.MIXED) && (
                    <DropdownMenuItem onClick={() => onLogProgress(goal)}>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Log Progress
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onManageLinks(goal)}>
                    <Link2 className="mr-2 h-4 w-4" />
                    Manage Links
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(goal)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  {goal.currentValue} / {goal.targetValue} {goal.unit || ""}
                </span>
                <span
                  className={cn(
                    "font-medium",
                    goal.progressPercent >= 100
                      ? "text-green-600"
                      : "text-muted-foreground",
                  )}
                >
                  {goal.progressPercent}%
                </span>
              </div>
              <Progress value={goal.progressPercent} className="h-2" />
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant="muted" className="text-xs">
                <TypeIcon className="mr-1 h-3 w-3" />
                {getGoalTypeLabel(goal.type)}
              </Badge>

              {formattedDueDate && (
                <Badge variant="muted" className="text-xs">
                  <Calendar className="mr-1 h-3 w-3" />
                  Due {formattedDueDate}
                </Badge>
              )}

              {(linkedTaskCount > 0 || linkedHabitCount > 0) && (
                <Badge variant="muted" className="text-xs">
                  <Link2 className="mr-1 h-3 w-3" />
                  {linkedTaskCount} task
                  {linkedTaskCount === 1 ? "" : "s"} / {linkedHabitCount} habit
                  {linkedHabitCount === 1 ? "" : "s"}
                </Badge>
              )}

              {isCompleted && (
                <Badge
                  variant="outline"
                  className="text-xs border-green-500 text-green-600"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Completed
                </Badge>
              )}

              {isOverdue && (
                <Badge
                  variant="outline"
                  className="text-xs border-amber-500 text-amber-700"
                >
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Overdue
                </Badge>
              )}

              {isArchived && (
                <Badge variant="secondary" className="text-xs">
                  <Archive className="mr-1 h-3 w-3" />
                  Archived
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Goals Page Component
export function GoalsPage() {
  const auth = useAuth();
  const { workspaceId } = useWorkspaceScope();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  const [deletingGoal, setDeletingGoal] = useState<Goal | undefined>(undefined);
  const [loggingGoal, setLoggingGoal] = useState<Goal | undefined>(undefined);
  const [linkingGoal, setLinkingGoal] = useState<Goal | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<"all" | GoalStatus>(
    GoalStatus.ACTIVE,
  );
  const [typeFilter, setTypeFilter] = useState<"all" | GoalType>("all");

  const query = useMemo(
    () => ({
      page: 1,
      limit: 100,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(typeFilter !== "all" && { type: typeFilter }),
    }),
    [statusFilter, typeFilter],
  );

  const isQueryEnabled =
    auth.hasHydrated && auth.isAuthenticated && Boolean(workspaceId);

  const {
    data: goalsData,
    isPending,
    error,
  } = useGoalsQuery(workspaceId ?? "", query, isQueryEnabled);

  const createGoalMutation = useCreateGoalMutation(workspaceId ?? "", query);
  const updateGoalMutation = useUpdateGoalMutation(workspaceId ?? "", query);
  const deleteGoalMutation = useDeleteGoalMutation(workspaceId ?? "", query);
  const logProgressMutation = useLogProgressMutation(workspaceId ?? "", query);
  const linkTasksMutation = useLinkTasksMutation(workspaceId ?? "", query);
  const unlinkTaskMutation = useUnlinkTaskMutation(workspaceId ?? "", query);
  const linkHabitsMutation = useLinkHabitsMutation(workspaceId ?? "", query);
  const unlinkHabitMutation = useUnlinkHabitMutation(workspaceId ?? "", query);

  const tasksQuery = useMemo(
    () => ({
      page: 1,
      limit: 100,
      sortBy: "dueDate",
      sortOrder: "asc" as const,
      view: "list" as const,
      groupBy: "none" as const,
    }),
    [],
  );
  const habitsQuery = useMemo(
    () => ({
      page: 1,
      limit: 100,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
      status: "active" as const,
    }),
    [],
  );

  const goals = useMemo(() => goalsData?.data.items ?? [], [goalsData]);
  const isEmpty = !isPending && goals.length === 0;
  const { data: tasksData, isPending: isTasksPending } = useAllTasksQuery(
    workspaceId ?? "",
    tasksQuery,
    isQueryEnabled,
  );
  const { data: habitsData, isPending: isHabitsPending } = useHabitsQuery(
    workspaceId ?? "",
    habitsQuery,
    isQueryEnabled,
  );

  const tasks = tasksData?.data.tasks ?? [];
  const habits = habitsData?.data.items ?? [];

  const summary = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter(
      (goal) => goal.status === GoalStatus.COMPLETED,
    ).length;
    const overdue = goals.filter((goal) => {
      if (!goal.dueDate) return false;
      if (goal.status === GoalStatus.COMPLETED) return false;
      if (goal.status === GoalStatus.ARCHIVED) return false;
      return new Date(goal.dueDate).getTime() < Date.now();
    }).length;
    const linkedItems = goals.reduce(
      (count, goal) =>
        count +
        (goal.linkedTasks?.length ?? 0) +
        (goal.linkedHabits?.length ?? 0),
      0,
    );

    return { total, completed, overdue, linkedItems };
  }, [goals]);

  const handleCreateGoal = async (formData: GoalFormData) => {
    try {
      await createGoalMutation.mutateAsync(formDataToCreateInput(formData));
      toast.success("Goal created successfully");
      setIsCreateDialogOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create goal";
      toast.error(message);
    }
  };

  const handleUpdateGoal = async (formData: GoalFormData) => {
    if (!editingGoal) return;
    try {
      await updateGoalMutation.mutateAsync({
        goalId: editingGoal.id,
        input: formDataToCreateInput(formData),
      });
      toast.success("Goal updated successfully");
      setEditingGoal(undefined);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update goal";
      toast.error(message);
    }
  };

  const handleDeleteGoal = async () => {
    if (!deletingGoal) return;
    try {
      await deleteGoalMutation.mutateAsync(deletingGoal.id);
      toast.success("Goal deleted");
      setDeletingGoal(undefined);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete goal";
      toast.error(message);
    }
  };

  const handleLogProgress = async (value: number, note?: string) => {
    if (!loggingGoal) return;
    try {
      await logProgressMutation.mutateAsync({
        goalId: loggingGoal.id,
        input: { value, note },
      });
      toast.success("Progress logged");
      setLoggingGoal(undefined);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to log progress";
      toast.error(message);
    }
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
  };

  const openDeleteDialog = (goal: Goal) => {
    setDeletingGoal(goal);
  };

  const openLogProgressDialog = (goal: Goal) => {
    setLoggingGoal(goal);
  };

  const openManageLinksDialog = (goal: Goal) => {
    setLinkingGoal(goal);
  };

  const handleSaveLinks = async (payload: {
    taskIds: string[];
    habitIds: string[];
  }) => {
    if (!linkingGoal) return;

    const currentTaskIds = linkingGoal.linkedTasks ?? [];
    const currentHabitIds = linkingGoal.linkedHabits ?? [];
    const taskIdsToLink = payload.taskIds.filter(
      (taskId) => !currentTaskIds.includes(taskId),
    );
    const taskIdsToUnlink = currentTaskIds.filter(
      (taskId) => !payload.taskIds.includes(taskId),
    );
    const habitIdsToLink = payload.habitIds.filter(
      (habitId) => !currentHabitIds.includes(habitId),
    );
    const habitIdsToUnlink = currentHabitIds.filter(
      (habitId) => !payload.habitIds.includes(habitId),
    );

    try {
      if (taskIdsToLink.length > 0) {
        await linkTasksMutation.mutateAsync({
          goalId: linkingGoal.id,
          input: { taskIds: taskIdsToLink },
        });
      }

      await Promise.all(
        taskIdsToUnlink.map((taskId) =>
          unlinkTaskMutation.mutateAsync({
            goalId: linkingGoal.id,
            taskId,
          }),
        ),
      );

      if (habitIdsToLink.length > 0) {
        await linkHabitsMutation.mutateAsync({
          goalId: linkingGoal.id,
          input: { habitIds: habitIdsToLink },
        });
      }

      await Promise.all(
        habitIdsToUnlink.map((habitId) =>
          unlinkHabitMutation.mutateAsync({
            goalId: linkingGoal.id,
            habitId,
          }),
        ),
      );

      toast.success("Goal links updated");
      setLinkingGoal(undefined);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update links";
      toast.error(message);
    }
  };

  const isMutating =
    createGoalMutation.isPending ||
    updateGoalMutation.isPending ||
    deleteGoalMutation.isPending ||
    logProgressMutation.isPending ||
    linkTasksMutation.isPending ||
    unlinkTaskMutation.isPending ||
    linkHabitsMutation.isPending ||
    unlinkHabitMutation.isPending;

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-background mx-2 my-2 border border-border rounded-lg min-w-0">
      <PageHeader
        title="Goals"
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Goal
          </Button>
        }
        toolbar={
          <PageToolbar
            left={
              <div className="flex items-center gap-3">
                {/* Status Filter */}
                <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
                  <Button
                    size="sm"
                    variant={
                      statusFilter === GoalStatus.ACTIVE ? "secondary" : "ghost"
                    }
                    className="h-7 text-xs"
                    onClick={() => setStatusFilter(GoalStatus.ACTIVE)}
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Active
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      statusFilter === GoalStatus.COMPLETED
                        ? "secondary"
                        : "ghost"
                    }
                    className="h-7 text-xs"
                    onClick={() => setStatusFilter(GoalStatus.COMPLETED)}
                  >
                    <Target className="mr-1.5 h-3.5 w-3.5" />
                    Completed
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      statusFilter === GoalStatus.ARCHIVED
                        ? "secondary"
                        : "ghost"
                    }
                    className="h-7 text-xs"
                    onClick={() => setStatusFilter(GoalStatus.ARCHIVED)}
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

                {/* Type Filter */}
                <Select
                  value={typeFilter}
                  onValueChange={(value: "all" | GoalType) =>
                    setTypeFilter(value)
                  }
                >
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {GOAL_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            }
          />
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        {!isPending && goals.length > 0 && (
          <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">
                  Visible Goals
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  {summary.total}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Completed</div>
                <div className="mt-2 text-2xl font-semibold">
                  {summary.completed}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Overdue</div>
                <div className="mt-2 text-2xl font-semibold">
                  {summary.overdue}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">
                  Linked Items
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  {summary.linkedItems}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isPending && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-32" />
              </Card>
            ))}
          </div>
        )}

        {error && (
          <EmptyState
            title="Failed to load goals"
            description={
              error instanceof Error
                ? error.message
                : "There was an error loading your goals. Please try again."
            }
            variant="border"
          />
        )}

        {isEmpty && (
          <EmptyState
            title={
              statusFilter === GoalStatus.ARCHIVED
                ? "No archived goals"
                : statusFilter === GoalStatus.COMPLETED
                  ? "No completed goals"
                  : "No goals yet"
            }
            description={
              statusFilter === GoalStatus.ARCHIVED
                ? "You haven't archived any goals yet."
                : statusFilter === GoalStatus.COMPLETED
                  ? "Complete some goals to see them here."
                  : "Create your first goal to start tracking your progress."
            }
            icon={Target}
            action={
              statusFilter === GoalStatus.ACTIVE && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Goal
                </Button>
              )
            }
            variant="border"
          />
        )}

        {!isPending && !isEmpty && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
                onLogProgress={openLogProgressDialog}
                onManageLinks={openManageLinksDialog}
              />
            ))}
          </div>
        )}
      </div>

      <GoalFormDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateGoal}
        isSubmitting={createGoalMutation.isPending}
      />

      <GoalFormDialog
        open={Boolean(editingGoal)}
        onClose={() => setEditingGoal(undefined)}
        goal={editingGoal}
        onSubmit={handleUpdateGoal}
        isSubmitting={updateGoalMutation.isPending}
      />

      <LogProgressDialog
        open={Boolean(loggingGoal)}
        onClose={() => setLoggingGoal(undefined)}
        goal={loggingGoal}
        onSubmit={handleLogProgress}
        isSubmitting={logProgressMutation.isPending}
      />

      <DeleteConfirmDialog
        open={Boolean(deletingGoal)}
        onClose={() => setDeletingGoal(undefined)}
        onConfirm={handleDeleteGoal}
        goalTitle={deletingGoal?.title ?? ""}
        isDeleting={deleteGoalMutation.isPending}
      />

      <GoalLinksDialog
        open={Boolean(linkingGoal)}
        onClose={() => setLinkingGoal(undefined)}
        goal={linkingGoal}
        tasks={tasks}
        habits={habits}
        isTasksPending={isTasksPending}
        isHabitsPending={isHabitsPending}
        isSubmitting={isMutating}
        onSubmit={handleSaveLinks}
      />
    </div>
  );
}
