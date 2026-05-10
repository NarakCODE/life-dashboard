"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CreateIssueInput,
  Issue,
  IssuePriority,
  IssueStatus,
  IssueType,
  UpdateIssueInput,
} from "@/lib/issues/issue-types";

interface IssueFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue?: Issue | null;
  isSubmitting?: boolean;
  onSubmit: (input: CreateIssueInput | UpdateIssueInput) => void;
}

const statuses: IssueStatus[] = [
  "backlog",
  "todo",
  "in-progress",
  "in-review",
  "done",
];

const priorities: IssuePriority[] = ["low", "medium", "high", "urgent"];

const types: IssueType[] = ["bug", "task", "feature", "improvement"];

export function IssueFormDialog({
  open,
  onOpenChange,
  issue,
  isSubmitting,
  onSubmit,
}: IssueFormDialogProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState<IssueStatus>("todo");
  const [priority, setPriority] = React.useState<IssuePriority>("medium");
  const [type, setType] = React.useState<IssueType>("task");
  const [projectId, setProjectId] = React.useState("");
  const [assigneeId, setAssigneeId] = React.useState("");
  const [labels, setLabels] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");

  React.useEffect(() => {
    if (!open) return;

    setTitle(issue?.title ?? "");
    setDescription(issue?.description ?? "");
    setStatus(issue?.status ?? "todo");
    setPriority(issue?.priority ?? "medium");
    setType(issue?.type ?? "task");
    setProjectId(issue?.projectId ?? "");
    setAssigneeId(issue?.assigneeId ?? "");
    setLabels(issue?.labels?.join(", ") ?? "");
    setDueDate(issue?.dueDate ? issue.dueDate.slice(0, 10) : "");
  }, [issue, open]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSubmit({
      title,
      description: description || null,
      status,
      priority,
      type,
      projectId: projectId || null,
      assigneeId: assigneeId || null,
      labels: labels
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{issue ? "Edit issue" : "New issue"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Issue title"
            required
          />

          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
          />

          <div className="grid gap-4 md:grid-cols-3">
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as IssueStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as IssuePriority)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={type}
              onValueChange={(value) => setType(value as IssueType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              placeholder="Project ID"
            />

            <Input
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
              placeholder="Assignee ID"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={labels}
              onChange={(event) => setLabels(event.target.value)}
              placeholder="Labels, comma separated"
            />

            <Input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {issue ? "Save changes" : "Create issue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
