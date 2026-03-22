"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type {
  ProjectInput,
  ProjectPriority,
  ProjectStatus,
  ProjectSummary,
} from "@/lib/projects/projects-client"

type ProjectFormDialogProps = {
  open: boolean
  mode: "create" | "edit"
  project?: ProjectSummary | null
  isPending?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: ProjectInput) => Promise<void> | void
}

const STATUS_OPTIONS: Array<{ value: ProjectStatus; label: string }> = [
  { value: "backlog", label: "Backlog" },
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

const PRIORITY_OPTIONS: Array<{ value: ProjectPriority; label: string }> = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

export function ProjectFormDialog({
  open,
  mode,
  project,
  isPending = false,
  onOpenChange,
  onSubmit,
}: ProjectFormDialogProps) {
  const [name, setName] = useState("")
  const [status, setStatus] = useState<ProjectStatus>("active")
  const [priority, setPriority] = useState<ProjectPriority>("medium")
  const [typeLabel, setTypeLabel] = useState("")
  const [durationLabel, setDurationLabel] = useState("")
  const [workstreamsText, setWorkstreamsText] = useState("")

  useEffect(() => {
    if (!open) return

    setName(project?.name ?? "")
    setStatus(project?.status ?? "active")
    setPriority(project?.priority ?? "medium")
    setTypeLabel(project?.typeLabel ?? "")
    setDurationLabel(project?.durationLabel ?? "")
    setWorkstreamsText(
      project?.workstreams.map((workstream) => workstream.name).join("\n") ?? "",
    )
  }, [open, project])

  const isValid = name.trim().length > 0

  const submitLabel = mode === "create" ? "Create project" : "Save changes"

  const description = useMemo(
    () =>
      mode === "create"
        ? "Create a project in the current workspace and optionally add starter workstreams."
        : "Update the project metadata and workstreams used across task creation and grouping.",
    [mode],
  )

  const handleSubmit = async () => {
    if (!isValid) return

    const workstreams = workstreamsText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item, index) => ({
        name: item,
        order: index,
      }))

    await onSubmit({
      name: name.trim(),
      status,
      priority,
      typeLabel: typeLabel.trim() || undefined,
      durationLabel: durationLabel.trim() || undefined,
      workstreams,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Project" : "Edit Project"}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
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

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!isValid || isPending}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
