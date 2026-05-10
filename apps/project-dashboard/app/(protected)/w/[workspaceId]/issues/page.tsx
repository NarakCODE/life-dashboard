"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIssueAuthContext } from "@/lib/issues/use-issue-auth-context";
import {
  useCreateIssueMutation,
  useDeleteIssueMutation,
  useIssuesQuery,
  useMyIssuesQuery,
  useUpdateIssueMutation,
} from "@/lib/issues/issue-query";
import type {
  CreateIssueInput,
  Issue,
  IssueQueryParams,
  UpdateIssueInput,
} from "@/lib/issues/issue-types";
import { IssueFormDialog } from "./_components/issue-form-dialog";
import { IssuesTable } from "./_components/issues-table";

type IssueTab = "all" | "my" | "open" | "backlog" | "completed";

export default function IssuesPage() {
  const context = useIssueAuthContext();

  const [tab, setTab] = React.useState<IssueTab>("all");
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingIssue, setEditingIssue] = React.useState<Issue | null>(null);

  const queryParams = React.useMemo<IssueQueryParams>(() => {
    const params: IssueQueryParams = {
      page: 1,
      limit: 20,
      search: search || undefined,
      sortBy: "updatedAt",
      sortOrder: "desc",
    };

    if (tab === "open") {
      params.status = ["backlog", "todo", "in-progress", "in-review"];
    }

    if (tab === "backlog") {
      params.status = ["backlog"];
    }

    if (tab === "completed") {
      params.status = ["done"];
    }

    return params;
  }, [search, tab]);

  const allIssuesQuery = useIssuesQuery(context, queryParams);
  const myIssuesQuery = useMyIssuesQuery(context, queryParams);

  const activeQuery = tab === "my" ? myIssuesQuery : allIssuesQuery;

  const createIssueMutation = useCreateIssueMutation(context);
  const updateIssueMutation = useUpdateIssueMutation(context);
  const deleteIssueMutation = useDeleteIssueMutation(context);

  const issues = activeQuery.data?.data ?? [];

  function handleCreateClick() {
    setEditingIssue(null);
    setDialogOpen(true);
  }

  function handleSubmit(input: CreateIssueInput | UpdateIssueInput) {
    if (editingIssue) {
      updateIssueMutation.mutate(
        {
          issueId: editingIssue.id,
          input,
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingIssue(null);
          },
        },
      );

      return;
    }

    createIssueMutation.mutate(input as CreateIssueInput, {
      onSuccess: () => {
        setDialogOpen(false);
      },
    });
  }

  function handleDelete(issue: Issue) {
    const confirmed = window.confirm(`Delete "${issue.title}"?`);

    if (!confirmed) return;

    deleteIssueMutation.mutate(issue.id);
  }

  const isSubmitting =
    createIssueMutation.isPending || updateIssueMutation.isPending;

  const isMissingContext = !context.accessToken || !context.workspaceId;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issues</h1>
          <p className="text-muted-foreground">
            Track bugs, tasks, blockers, and improvements across your workspace.
          </p>
        </div>

        <Button onClick={handleCreateClick} disabled={isMissingContext}>
          <Plus />
          New issue
        </Button>
      </div>

      {isMissingContext ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              Missing access token or workspace ID. Please login and select a
              workspace first.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="gap-4">
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as IssueTab)}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="my">My Issues</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="backlog">Backlog</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search issues..."
          />
        </CardHeader>

        <CardContent>
          {activeQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : activeQuery.isError ? (
            <div className="py-8 text-sm text-destructive">
              {activeQuery.error.message}
            </div>
          ) : issues.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-medium">No issues found</p>
              <p className="text-sm text-muted-foreground">
                Create your first issue to start tracking work.
              </p>
            </div>
          ) : (
            <IssuesTable
              issues={issues}
              onEdit={(issue) => {
                setEditingIssue(issue);
                setDialogOpen(true);
              }}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      <IssueFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        issue={editingIssue}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
