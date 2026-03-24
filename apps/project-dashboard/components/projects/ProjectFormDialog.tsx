"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "@phosphor-icons/react/dist/ssr";
import { QuickCreateModalLayout } from "@/components/QuickCreateModalLayout";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  ProjectInput,
  ProjectPriority,
  ProjectStatus,
  ProjectSummary,
} from "@/lib/projects/projects-client";

type ProjectFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  project?: ProjectSummary | null;
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ProjectInput) => Promise<void> | void;
};

const STATUS_OPTIONS: Array<{ value: ProjectStatus; label: string }> = [
  { value: "backlog", label: "Backlog" },
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS: Array<{ value: ProjectPriority; label: string }> = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function ProjectFormDialog({
  open,
  mode,
  project,
  isPending = false,
  onOpenChange,
  onSubmit,
}: ProjectFormDialogProps) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [priority, setPriority] = useState<ProjectPriority>("medium");
  const [typeLabel, setTypeLabel] = useState("");
  const [durationLabel, setDurationLabel] = useState("");
  const [workstreamsText, setWorkstreamsText] = useState("");

  useEffect(() => {
    if (!open) return;

    setName(project?.name ?? "");
    setStatus(project?.status ?? "active");
    setPriority(project?.priority ?? "medium");
    setTypeLabel(project?.typeLabel ?? "");
    setDurationLabel(project?.durationLabel ?? "");
    setWorkstreamsText(
      project?.workstreams.map((workstream) => workstream.name).join("\\n") ??
        "",
    );
  }, [open, project]);

  const isValid = name.trim().length > 0;

  const submitLabel = mode === "create" ? "Create project" : "Save changes";

  const title = mode === "create" ? "New Project" : "Edit Project";
  const description = useMemo(
    () =>
      mode === "create"
        ? "Create a project in the current workspace and optionally add starter workstreams."
        : "Update the project metadata and workstreams used across task creation and grouping.",
    [mode],
  );

  const handleSubmit = async () => {
    if (!isValid) return;

    const workstreams = workstreamsText
      .split("\\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item, index) => ({
        name: item,
        order: index,
      }));

    await onSubmit({
      name: name.trim(),
      status,
      priority,
      typeLabel: typeLabel.trim() || undefined,
      durationLabel: durationLabel.trim() || undefined,
      workstreams,
    });
  };

  const handleClose = () => {
    if (isPending) return;
    onOpenChange(false);
  };

  return (
    <QuickCreateModalLayout
      open={open}
      onClose={handleClose}
      onSubmitShortcut={handleSubmit}
      className="max-w-160"
      contentClassName="p-0 gap-0"
    >
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8 rounded-full shrink-0"
            onClick={handleClose}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Project title"
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as ProjectStatus)}
                disabled={isPending}
              >
                <SelectTrigger id="project-status">
                  <SelectValue placeholder="Choose status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="project-priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as ProjectPriority)}
                disabled={isPending}
              >
                <SelectTrigger id="project-priority">
                  <SelectValue placeholder="Choose priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-type">Type label</Label>
              <Input
                id="project-type"
                value={typeLabel}
                onChange={(event) => setTypeLabel(event.target.value)}
                placeholder="MVP, Sprint, Audit..."
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="project-duration">Duration label</Label>
              <Input
                id="project-duration"
                value={durationLabel}
                onChange={(event) => setDurationLabel(event.target.value)}
                placeholder="2 weeks"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="project-workstreams">Workstreams</Label>
            <Textarea
              id="project-workstreams"
              value={workstreamsText}
              onChange={(event) => setWorkstreamsText(event.target.value)}
              placeholder={"One workstream per line\nDesign\nFrontend\nBackend"}
              disabled={isPending}
              rows={5}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 pt-0 mt-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isPending}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </QuickCreateModalLayout>
  );
}
