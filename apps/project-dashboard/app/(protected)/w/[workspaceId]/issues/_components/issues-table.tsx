"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Issue } from "@/lib/issues/issue-types";
import {
  IssuePriorityBadge,
  IssueStatusBadge,
  IssueTypeBadge,
} from "./issue-badges";

interface IssuesTableProps {
  issues: Issue[];
  onEdit: (issue: Issue) => void;
  onDelete: (issue: Issue) => void;
}

export function IssuesTable({ issues, onEdit, onDelete }: IssuesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Issue</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Labels</TableHead>
          <TableHead>Due date</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {issues.map((issue) => (
          <TableRow key={issue.id}>
            <TableCell>
              <Link
                href={`/dashboard/issues/${issue.id}`}
                className="font-medium hover:underline"
              >
                {issue.title}
              </Link>
              <div className="text-xs text-muted-foreground">{issue.id}</div>
            </TableCell>
            <TableCell>
              <IssueTypeBadge type={issue.type} />
            </TableCell>
            <TableCell>
              <IssueStatusBadge status={issue.status} />
            </TableCell>
            <TableCell>
              <IssuePriorityBadge priority={issue.priority} />
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {issue.labels?.length ? (
                  issue.labels.map((label) => (
                    <Badge key={label} variant="outline">
                      {label}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No labels
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              {issue.dueDate
                ? new Date(issue.dueDate).toLocaleDateString()
                : "—"}
            </TableCell>
            <TableCell>
              {new Date(issue.updatedAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(issue)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(issue)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
