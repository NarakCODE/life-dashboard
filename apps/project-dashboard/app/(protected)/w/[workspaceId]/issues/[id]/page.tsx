"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useIssueAuthContext } from "@/lib/issues/use-issue-auth-context";
import {
  useDeleteIssueMutation,
  useIssueQuery,
} from "@/lib/issues/issue-query";
import {
  IssuePriorityBadge,
  IssueStatusBadge,
  IssueTypeBadge,
} from "../_components/issue-badges";

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const context = useIssueAuthContext();

  const issueQuery = useIssueQuery(context, params.id);
  const deleteIssueMutation = useDeleteIssueMutation(context);

  const issue = issueQuery.data;

  function handleDelete() {
    if (!issue) return;

    const confirmed = window.confirm(`Delete "${issue.title}"?`);

    if (!confirmed) return;

    deleteIssueMutation.mutate(issue.id, {
      onSuccess: () => {
        router.push("/dashboard/issues");
      },
    });
  }

  if (issueQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (issueQuery.isError) {
    return (
      <p className="text-sm text-destructive">{issueQuery.error.message}</p>
    );
  }

  if (!issue) {
    return <p className="text-sm text-muted-foreground">Issue not found.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/issues">
            <ArrowLeft />
            Back to issues
          </Link>
        </Button>

        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleteIssueMutation.isPending}
        >
          <Trash />
          Delete
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{issue.title}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <IssueTypeBadge type={issue.type} />
            <IssueStatusBadge status={issue.status} />
            <IssuePriorityBadge priority={issue.priority} />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium">Description</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {issue.description || "No description provided."}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Project ID" value={issue.projectId ?? "—"} />
            <DetailItem label="Assignee ID" value={issue.assigneeId ?? "—"} />
            <DetailItem
              label="Due date"
              value={
                issue.dueDate
                  ? new Date(issue.dueDate).toLocaleDateString()
                  : "—"
              }
            />
            <DetailItem
              label="Updated"
              value={new Date(issue.updatedAt).toLocaleString()}
            />
          </div>

          <div>
            <p className="text-sm font-medium">Labels</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {issue.labels?.length ? issue.labels.join(", ") : "No labels"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{value}</p>
    </div>
  );
}
