"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  ListTodo,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getDashboardStats, type DashboardStats } from "@/lib/data/dashboard";

interface SectionCardsProps {
  initialData?: DashboardStats;
}

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  tooltip: string;
  tone?: "neutral" | "positive" | "warning" | "danger";
}

function calculateCompletionRate(stats: DashboardStats): number {
  if (stats.totalTasks === 0) return 0;
  return Math.round((stats.countsByStatus.done / stats.totalTasks) * 100);
}

function getTrendIcon(value: number, inverse = false) {
  if (value === 0) return <Minus className="size-4" />;
  const isPositive = inverse ? value < 0 : value > 0;
  return isPositive ? (
    <TrendingUp className="size-4" />
  ) : (
    <TrendingDown className="size-4" />
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
  tooltip,
  tone = "neutral",
}: MetricCardProps) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600"
      : tone === "warning"
        ? "text-amber-600"
        : tone === "danger"
          ? "text-rose-600"
          : "text-muted-foreground";

  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                aria-label={`Info about ${title}`}
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </div>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full bg-muted/40",
            toneClass,
          )}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-semibold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function SectionCards({ initialData }: SectionCardsProps) {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    initialData,
  });

  if (!stats) return null;

  const completionRate = calculateCompletionRate(stats);
  const completionDelta = completionRate - 50;
  const completionTone: MetricCardProps["tone"] =
    completionDelta > 0
      ? "positive"
      : completionDelta < 0
        ? "warning"
        : "neutral";

  return (
    <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2 xl:grid-cols-4 lg:px-6">
      <MetricCard
        title="Total Tasks"
        value={stats.totalTasks.toLocaleString()}
        description={`${stats.countsByStatus.todo} to do, ${stats.countsByStatus.in_progress} in progress, ${stats.countsByStatus.done} completed.`}
        icon={<ListTodo className="h-4 w-4" />}
        tooltip="A summary of all tracked tasks across todo, in-progress, completed, and archived states."
      />

      <MetricCard
        title="Completion Rate"
        value={`${completionRate}%`}
        description={
          stats.totalTasks > 0
            ? `${stats.completedSummary.total} tasks completed. ${getCompletionSummaryLabel(completionDelta)} ${getTrendLabel(completionDelta)}`
            : "No tasks yet, so the completion rate is currently zero."
        }
        icon={
          completionDelta === 0 ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            getTrendIcon(completionDelta)
          )
        }
        tooltip="Calculated from completed tasks divided by total tasks. The tone shifts based on whether the rate is above or below 50%."
        tone={completionTone}
      />

      <MetricCard
        title="Overdue Tasks"
        value={String(stats.overdueCount)}
        description={
          stats.overdueCount > 0
            ? `Requires attention now. ${stats.upcomingCount} more tasks are coming up soon.`
            : `No overdue tasks right now. ${stats.upcomingCount} tasks are scheduled next.`
        }
        icon={
          stats.overdueCount > 0 ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )
        }
        tooltip="Tasks past their due date. Zero is ideal; any positive count means work is already late."
        tone={stats.overdueCount > 0 ? "danger" : "positive"}
      />

      <MetricCard
        title="Upcoming"
        value={String(stats.upcomingCount)}
        description={
          stats.completedSummary.latest
            ? `Latest completion: ${new Date(stats.completedSummary.latest).toLocaleDateString()}.`
            : "No recent completions yet."
        }
        icon={<CalendarDays className="h-4 w-4" />}
        tooltip="Tasks due soon, paired with the most recent completion date to show current delivery momentum."
        tone="warning"
      />
    </div>
  );
}

function getTrendLabel(value: number) {
  if (value === 0) return "on target.";
  return value > 0 ? "above the baseline." : "below the baseline.";
}

function getCompletionSummaryLabel(value: number) {
  if (value === 0) return "Completion is";
  return value > 0 ? "Progress is tracking" : "Progress is trending";
}
