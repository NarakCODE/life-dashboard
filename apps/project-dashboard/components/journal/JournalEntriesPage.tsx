"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import {
  BookText,
  Calendar,
  LineChart,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Tags,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageToolbarResponsive } from "@/components/page-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  MOOD_OPTIONS,
  MoodLevel,
  type CreateJournalEntryInput,
  type JournalEntry,
} from "@/lib/journal-entries/types";
import {
  useCreateJournalEntryMutation,
  useDeleteJournalEntryMutation,
  useJournalEntriesQuery,
  useMoodSummaryQuery,
  useUpdateJournalEntryMutation,
} from "@/lib/journal-entries/journal-entries-query";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";

type MoodFilterValue = "all" | `${MoodLevel}`;
type AnalyticsWindow = "7d" | "30d" | "90d" | "all";

interface JournalEntryFormState {
  entryDate: string;
  title: string;
  content: string;
  mood: MoodFilterValue;
  tags: string;
}

const analyticsWindowOptions: Array<{ id: AnalyticsWindow; label: string }> = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "all", label: "All time" },
];

const emptyJournalEntries: JournalEntry[] = [];

const moodFilterOptions = [
  { id: "all" as const, label: "All moods" },
  ...MOOD_OPTIONS.map((option) => ({
    id: String(option.value) as MoodFilterValue,
    label: option.label,
  })),
];

function formatDisplayDate(value: string) {
  try {
    return format(parseISO(value), "EEE, MMM d");
  } catch {
    return value;
  }
}

function formatDateInput(value?: string | null) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

function createDefaultFormState(): JournalEntryFormState {
  return {
    entryDate: new Date().toISOString().slice(0, 10),
    title: "",
    content: "",
    mood: "all",
    tags: "",
  };
}

function journalEntryToFormState(entry: JournalEntry): JournalEntryFormState {
  return {
    entryDate: formatDateInput(entry.entryDate),
    title: entry.title ?? "",
    content: entry.content,
    mood: entry.mood ? String(entry.mood) as MoodFilterValue : "all",
    tags: entry.tags.join(", "),
  };
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function formStateToInput(
  formState: JournalEntryFormState,
): CreateJournalEntryInput {
  const tags = parseTags(formState.tags);

  return {
    entryDate: new Date(formState.entryDate).toISOString(),
    title: formState.title.trim() || undefined,
    content: formState.content.trim(),
    mood:
      formState.mood === "all" ? undefined : Number(formState.mood) as MoodLevel,
    tags: tags.length > 0 ? tags : undefined,
  };
}

function getMoodOption(mood?: MoodLevel | null) {
  return MOOD_OPTIONS.find((option) => option.value === mood) ?? null;
}

function getMoodAverageCopy(value: number | null) {
  if (!value) return "No mood data yet"
  if (value >= MoodLevel.VERY_GOOD) return "Very positive stretch"
  if (value >= MoodLevel.GOOD) return "Mostly good days"
  if (value >= MoodLevel.NEUTRAL) return "Balanced stretch"
  if (value >= MoodLevel.BAD) return "Some tougher days"
  return "Rough stretch"
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  toneClassName = "",
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  toneClassName?: string;
}) {
  return (
    <Card className={cn("border-border/60", toneClassName)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-semibold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Icon className="size-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

function EntriesSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export function JournalEntriesPage() {
  const { workspaceId } = useWorkspaceScope();
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState<MoodFilterValue>("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [analyticsWindow, setAnalyticsWindow] = useState<AnalyticsWindow>("30d");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [formState, setFormState] = useState<JournalEntryFormState>(
    createDefaultFormState(),
  );

  const deferredSearch = useDeferredValue(search);
  const isQueryEnabled = Boolean(workspaceId);

  const query = useMemo(
    () => ({
      page: 1,
      limit: 100,
      sortBy: "entryDate" as const,
      sortOrder: "desc" as const,
      search: deferredSearch.trim() || undefined,
      tag: tagFilter === "all" ? undefined : tagFilter,
      mood:
        moodFilter === "all"
          ? undefined
          : (Number(moodFilter) as MoodLevel),
    }),
    [deferredSearch, moodFilter, tagFilter],
  );

  const analyticsQuery = useMemo(() => {
    const nextQuery: {
      dateFrom?: string
      dateTo?: string
      mood?: MoodLevel
      tag?: string
      search?: string
    } = {
      search: deferredSearch.trim() || undefined,
      tag: tagFilter === "all" ? undefined : tagFilter,
      mood:
        moodFilter === "all"
          ? undefined
          : (Number(moodFilter) as MoodLevel),
    }

    if (analyticsWindow !== "all") {
      const days = analyticsWindow === "7d" ? 7 : analyticsWindow === "30d" ? 30 : 90
      nextQuery.dateFrom = subDays(new Date(), days).toISOString()
      nextQuery.dateTo = new Date().toISOString()
    }

    return nextQuery
  }, [analyticsWindow, deferredSearch, moodFilter, tagFilter]);

  const {
    data: journalEntriesData,
    isPending: isEntriesPending,
    error: journalEntriesError,
  } = useJournalEntriesQuery(workspaceId ?? "", query, isQueryEnabled);
  const {
    data: moodSummary,
    isPending: isMoodSummaryPending,
  } = useMoodSummaryQuery(workspaceId ?? "", analyticsQuery, isQueryEnabled);

  const createJournalEntryMutation = useCreateJournalEntryMutation(workspaceId ?? "");
  const updateJournalEntryMutation = useUpdateJournalEntryMutation(workspaceId ?? "");
  const deleteJournalEntryMutation = useDeleteJournalEntryMutation(workspaceId ?? "");

  const entries = journalEntriesData?.data.items ?? emptyJournalEntries;
  const availableTags = useMemo(
    () =>
      Array.from(
        new Set([
          ...entries.flatMap((entry) => entry.tags),
          ...(tagFilter !== "all" ? [tagFilter] : []),
        ]),
      )
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [entries, tagFilter],
  );

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const entry of entries) {
      for (const tag of entry.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag))
      .slice(0, 8);
  }, [entries]);

  const dominantMood = moodSummary?.moodDistribution[0];
  const isEmpty = !isEntriesPending && entries.length === 0;
  const hasActiveFilters =
    search.trim().length > 0 || tagFilter !== "all" || moodFilter !== "all";

  function resetFilters() {
    setSearch("");
    setTagFilter("all");
    setMoodFilter("all");
  }

  function resetForm() {
    setFormState(createDefaultFormState());
    setEditingEntry(null);
  }

  function openCreateDialog() {
    resetForm();
    setIsDialogOpen(true);
  }

  function openEditDialog(entry: JournalEntry) {
    setEditingEntry(entry);
    setFormState(journalEntryToFormState(entry));
    setIsDialogOpen(true);
  }

  async function handleSaveEntry() {
    const input = formStateToInput(formState);

    if (!input.content.trim()) {
      toast.error("Journal content is required");
      return;
    }

    try {
      if (editingEntry) {
        await updateJournalEntryMutation.mutateAsync({
          entryId: editingEntry.id,
          input,
        });
        toast.success("Journal entry updated");
      } else {
        await createJournalEntryMutation.mutateAsync(input);
        toast.success("Journal entry created");
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save the journal entry");
    }
  }

  async function handleDeleteEntry() {
    if (!entryToDelete) return;

    try {
      await deleteJournalEntryMutation.mutateAsync(entryToDelete.id);
      toast.success("Journal entry deleted");
      setEntryToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete the journal entry");
    }
  }

  return (
    <div className="mx-2 my-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background">
      <PageHeader
        title="Journal"
        actions={
          <Button onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            New entry
          </Button>
        }
        toolbar={
          <PageToolbarResponsive
            left={
              <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search journal entries"
                    className="pl-9"
                  />
                </div>

                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="w-full md:w-44">
                    <SelectValue placeholder="All tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tags</SelectItem>
                    {availableTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            }
            right={
              <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                <Select
                  value={moodFilter}
                  onValueChange={(value) => setMoodFilter(value as MoodFilterValue)}
                >
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="All moods" />
                  </SelectTrigger>
                  <SelectContent>
                    {moodFilterOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={analyticsWindow}
                  onValueChange={(value) => setAnalyticsWindow(value as AnalyticsWindow)}
                >
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Analytics period" />
                  </SelectTrigger>
                  <SelectContent>
                    {analyticsWindowOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            }
          />
        }
        toolbarClassName="flex-col gap-2 md:flex-row md:items-center md:justify-between"
      />

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          {isMoodSummaryPending ? <AnalyticsSkeleton /> : null}

          {!isMoodSummaryPending ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard
                  title="Average Mood"
                  value={
                    moodSummary?.averageMood
                      ? `${moodSummary.averageMood.toFixed(1)} / 5`
                      : "No mood yet"
                  }
                  description={getMoodAverageCopy(moodSummary?.averageMood ?? null)}
                  icon={Sparkles}
                  toneClassName="border-sky-200/70 bg-sky-50/50"
                />
                <SummaryCard
                  title="Entries Logged"
                  value={String(moodSummary?.totalEntries ?? 0)}
                  description="Entries included in the current analytics window"
                  icon={BookText}
                  toneClassName="border-orange-200/70 bg-orange-50/50"
                />
                <SummaryCard
                  title="Dominant Mood"
                  value={dominantMood?.label ?? "Untracked"}
                  description={
                    dominantMood
                      ? `${dominantMood.percentage}% of entries with mood tracking`
                      : "Add mood to entries to see your pattern"
                  }
                  icon={LineChart}
                  toneClassName="border-emerald-200/70 bg-emerald-50/50"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="size-4 text-muted-foreground" />
                      Mood distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    {moodSummary?.moodDistribution.length ? (
                      moodSummary.moodDistribution.map((item) => {
                        const moodOption = getMoodOption(item.mood)

                        return (
                          <div key={item.mood} className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{moodOption?.emoji ?? "•"}</span>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-foreground">
                                    {item.label}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {item.count} entries
                                  </span>
                                </div>
                              </div>
                              <span className="text-sm font-medium text-muted-foreground">
                                {item.percentage}%
                              </span>
                            </div>
                            <Progress value={item.percentage} />
                          </div>
                        )
                      })
                    ) : (
                      <EmptyState
                        title="No mood analytics yet"
                        description="Add a mood to your daily entries to unlock distribution insights."
                        icon={Sparkles}
                        variant="muted-alt"
                        size="sm"
                      />
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="size-4 text-muted-foreground" />
                      Mood trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    {moodSummary?.trend.length ? (
                      <>
                        <div className="grid grid-cols-7 gap-2 lg:grid-cols-10">
                          {moodSummary.trend.slice(-10).map((point) => (
                            <div key={point.date} className="flex flex-col items-center gap-2">
                              <div className="flex h-28 items-end">
                                <div
                                  className="w-7 rounded-full bg-primary/15"
                                  style={{
                                    height: `${Math.max((point.avgMood / 5) * 100, 14)}%`,
                                  }}
                                >
                                  <div className="h-full w-full rounded-full bg-primary" />
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-[11px] font-medium text-foreground">
                                  {point.avgMood.toFixed(1)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {formatDisplayDate(`${point.date}T00:00:00.000Z`)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Average mood score by day across entries that include a mood.
                        </p>
                      </>
                    ) : (
                      <EmptyState
                        title="Trend data will appear here"
                        description="Track mood on multiple days to reveal your recent pattern."
                        icon={LineChart}
                        variant="muted-alt"
                        size="sm"
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Tags className="size-4 text-muted-foreground" />
                Tag organization
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {tagCounts.length ? (
                tagCounts.map((tag) => (
                  <button
                    key={tag.tag}
                    type="button"
                    onClick={() => setTagFilter(tag.tag)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                      tagFilter === tag.tag
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/70 bg-background text-foreground hover:bg-muted/60",
                    )}
                  >
                    <span>#{tag.tag}</span>
                    <span className="text-xs text-muted-foreground">{tag.count}</span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add tags like `gratitude`, `stress`, or `focus` to group your entries over time.
                </p>
              )}
            </CardContent>
          </Card>

          {journalEntriesError ? (
            <EmptyState
              title="Failed to load journal entries"
              description="There was an error loading your journal history. Try refreshing the page."
              icon={BookText}
              variant="muted-alt"
              size="sm"
            />
          ) : null}

          {isEntriesPending ? <EntriesSkeleton /> : null}

          {!isEntriesPending && isEmpty ? (
            <EmptyState
              title={hasActiveFilters ? "No entries match these filters" : "No journal entries yet"}
              description={
                hasActiveFilters
                  ? "Try clearing the current search or filters to see the rest of your journal history."
                  : "Capture how your day felt, what happened, and the tags that make it easier to revisit patterns later."
              }
              icon={BookText}
              action={
                hasActiveFilters ? (
                  <Button variant="outline" onClick={resetFilters}>
                    Reset filters
                  </Button>
                ) : (
                  <Button onClick={openCreateDialog}>
                    <Plus data-icon="inline-start" />
                    Write your first entry
                  </Button>
                )
              }
              variant="muted-alt"
            />
          ) : null}

          {!isEntriesPending && !isEmpty ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {entries.map((entry) => {
                const moodOption = getMoodOption(entry.mood)

                return (
                  <Card key={entry.id} className="border-border/60">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="rounded-full">
                              {formatDisplayDate(entry.entryDate)}
                            </Badge>
                            {moodOption ? (
                              <Badge className={cn("rounded-full border", moodOption.accentClassName)}>
                                {moodOption.emoji} {moodOption.label}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="rounded-full">
                                Mood untracked
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg">
                            {entry.title?.trim() || "Untitled reflection"}
                          </CardTitle>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            onClick={() => openEditDialog(entry)}
                          >
                            <Pencil />
                            <span className="sr-only">Edit entry</span>
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-8 text-destructive"
                            onClick={() => setEntryToDelete(entry)}
                          >
                            <Trash2 />
                            <span className="sr-only">Delete entry</span>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {entry.content}
                      </p>

                      {entry.tags.length ? (
                        <div className="flex flex-wrap gap-2">
                          {entry.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="rounded-full px-2.5 py-1"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      ) : null}

                      <p className="text-xs text-muted-foreground">
                        Updated {formatDisplayDate(entry.updatedAt)}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);

          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Edit journal entry" : "New journal entry"}
            </DialogTitle>
            <DialogDescription>
              Track the day, capture your mood, and add tags you can return to later.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="journal-entry-date">Entry date</Label>
                <Input
                  id="journal-entry-date"
                  type="date"
                  value={formState.entryDate}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      entryDate: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="journal-entry-title">Title</Label>
                <Input
                  id="journal-entry-title"
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="A calmer afternoon"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="journal-entry-content">Reflection</Label>
              <Textarea
                id="journal-entry-content"
                value={formState.content}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                placeholder="What happened today, how did it feel, and what would you want to remember later?"
                className="min-h-40"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Mood</Label>
              <div className="grid gap-2 sm:grid-cols-5">
                {MOOD_OPTIONS.map((option) => {
                  const isActive = formState.mood === String(option.value);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormState((current) => ({
                          ...current,
                          mood: isActive
                            ? "all"
                            : (String(option.value) as MoodFilterValue),
                        }))
                      }
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center transition-colors",
                        isActive
                          ? option.accentClassName
                          : "border-border/70 bg-background hover:bg-muted/50",
                      )}
                    >
                      <span className="text-2xl">{option.emoji}</span>
                      <span className="text-xs font-medium">{option.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="journal-entry-tags">Tags</Label>
              <Input
                id="journal-entry-tags"
                value={formState.tags}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    tags: event.target.value,
                  }))
                }
                placeholder="gratitude, stress, focus"
              />
              <p className="text-xs text-muted-foreground">
                Separate tags with commas to organize recurring themes.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSaveEntry()}
              disabled={
                createJournalEntryMutation.isPending ||
                updateJournalEntryMutation.isPending
              }
            >
              {editingEntry ? "Save changes" : "Create entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(entryToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setEntryToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete journal entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the entry and its mood/tag history from the workspace view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteEntry()}
              disabled={deleteJournalEntryMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
