"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Info,
  MoreHorizontal,
  PencilLine,
  PiggyBank,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, PageToolbar, PageToolbarResponsive, PageLayout } from "@/components/page-layout";
import { EmptyState } from "@/components/ui/empty-state";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import {
  useBudgetSummaryQuery,
  useBudgetsQuery,
  useCreateBudgetMutation,
  useDeleteBudgetMutation,
  useUpdateBudgetMutation,
} from "@/lib/budgets/budgets-query";
import {
  BudgetPeriod,
  type Budget,
  type CreateBudgetInput,
  type UpdateBudgetInput,
} from "@/lib/budgets/types";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PERIOD_OPTIONS = [
  { id: "all", label: "All periods" },
  { id: BudgetPeriod.WEEKLY, label: "Weekly" },
  { id: BudgetPeriod.MONTHLY, label: "Monthly" },
  { id: BudgetPeriod.QUARTERLY, label: "Quarterly" },
  { id: BudgetPeriod.YEARLY, label: "Yearly" },
  { id: BudgetPeriod.CUSTOM, label: "Custom" },
] as const;

const STATUS_OPTIONS = [
  { id: "all", label: "All budgets" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
] as const;

interface BudgetFormState {
  name: string;
  amount: string;
  category: string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  currency: string;
  isActive: boolean;
}

function createDefaultBudgetFormState(): BudgetFormState {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  return {
    name: "",
    amount: "1000",
    category: "",
    period: BudgetPeriod.MONTHLY,
    startDate,
    endDate,
    currency: "USD",
    isActive: true,
  };
}

function budgetToFormState(budget: Budget): BudgetFormState {
  return {
    name: budget.name,
    amount: String(budget.amount),
    category: budget.category ?? "",
    period: budget.period,
    startDate: budget.startDate?.slice(0, 10) ?? "",
    endDate: budget.endDate?.slice(0, 10) ?? "",
    currency: budget.currency,
    isActive: budget.isActive,
  };
}

function toBudgetInput(formState: BudgetFormState): CreateBudgetInput {
  return {
    name: formState.name.trim(),
    amount: Math.max(0, Number(formState.amount) || 0),
    category: formState.category.trim() || undefined,
    period: formState.period,
    startDate: formState.startDate
      ? `${formState.startDate}T00:00:00.000Z`
      : undefined,
    endDate: formState.endDate
      ? `${formState.endDate}T23:59:59.999Z`
      : undefined,
    currency: formState.currency.trim().toUpperCase() || "USD",
  };
}

function toBudgetUpdateInput(formState: BudgetFormState): UpdateBudgetInput {
  return {
    ...toBudgetInput(formState),
    isActive: formState.isActive,
  };
}

function formatCurrency(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

function formatBudgetDateRange(budget: Budget) {
  if (!budget.startDate && !budget.endDate) return "No date window";

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (budget.startDate && budget.endDate) {
    return `${formatter.format(new Date(budget.startDate))} - ${formatter.format(
      new Date(budget.endDate),
    )}`;
  }

  if (budget.startDate) {
    return `From ${formatter.format(new Date(budget.startDate))}`;
  }

  return `Until ${formatter.format(new Date(budget.endDate as string))}`;
}

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  tooltip: string;
  tone?: "default" | "danger" | "success" | "warning";
}

function SummaryCard({ title, value, description, icon, tooltip, tone = "default" }: SummaryCardProps) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600"
      : tone === "danger"
        ? "text-rose-600"
        : tone === "warning"
          ? "text-amber-600"
          : "text-muted-foreground";

  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
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
            <TooltipContent side="top" className="max-w-[200px] text-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className={cn("h-8 w-8 rounded-full bg-muted/40 flex items-center justify-center", toneClass)}>
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

interface ChartDataItem {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  remaining: number;
  isOverBudget: boolean;
  percentUsed: number;
}

interface SpendingSummaryChartProps {
  data: ChartDataItem[];
  currency: string;
  isLoading: boolean;
}

function SpendingSummaryChart({ data, currency, isLoading }: SpendingSummaryChartProps) {
  const formatCurrency = (value: number) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `${currency} ${value.toFixed(0)}`;
    }
  };

  const chartData = useMemo(() => {
    const maxBudgeted = Math.max(...data.map((d) => d.budgeted), 1);
    return data.map((item) => ({
      ...item,
      budgetedHeight: Math.round((item.budgeted / maxBudgeted) * 100),
      spentHeight: Math.round((item.spent / maxBudgeted) * 100),
    }));
  }, [data]);

  if (isLoading) {
    return (
      <Card className="border-border/60 bg-card/70">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-base font-semibold">Spending Summary</CardTitle>
            <p className="text-xs text-muted-foreground">Budgeted vs actual spending</p>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border-border/60 bg-card/70">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-base font-semibold">Spending Summary</CardTitle>
            <p className="text-xs text-muted-foreground">Budgeted vs actual spending</p>
          </div>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
            No budget data available to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold">Spending Summary</CardTitle>
          <p className="text-xs text-muted-foreground">Budgeted vs actual spending</p>
        </div>
        <div className="text-xs text-muted-foreground">
          {data.length} budgets
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col flex-1">
          <div
            className="grid gap-4 items-end flex-1 min-h-[180px]"
            style={{ gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))` }}
          >
            {chartData.map((item) => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <div className="flex h-full w-full items-end justify-center gap-1 rounded-md p-1 transition-colors hover:bg-muted/50">
                    {/* Budgeted bar */}
                    <div
                      className="w-full max-w-[24px] rounded-t-md bg-primary/30"
                      style={{ height: `${Math.max(8, item.budgetedHeight)}%` }}
                    />
                    {/* Spent bar */}
                    <div
                      className={cn(
                        "w-full max-w-[24px] rounded-t-md",
                        item.isOverBudget ? "bg-rose-500/70" : "bg-emerald-500/70"
                      )}
                      style={{ height: `${Math.max(8, item.spentHeight)}%` }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <div className="space-y-1">
                    <p className="font-medium">{item.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Budgeted:</span>
                      <span>{formatCurrency(item.budgeted)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Spent:</span>
                      <span className={item.isOverBudget ? "text-rose-500" : "text-emerald-500"}>
                        {formatCurrency(item.spent)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Used:</span>
                      <span>{item.percentUsed.toFixed(0)}%</span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <div
            className="grid gap-4 mt-3"
            style={{ gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))` }}
          >
            {chartData.map((item) => (
              <div key={`label-${item.id}`} className="flex flex-col items-center gap-1 px-1">
                <span className="text-[10px] text-muted-foreground text-center leading-tight truncate w-full">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary/40" />
            Budgeted
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Spent (within budget)
          </span>
          {data.some((d) => d.isOverBudget) && (
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              Spent (over budget)
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-border/60 bg-card/70">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 bg-card/70">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-border/60">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-2 w-full" />
              <div className="grid gap-3 sm:grid-cols-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BudgetFormDialog({
  open,
  onClose,
  onSubmit,
  initialBudget,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateBudgetInput | UpdateBudgetInput) => Promise<void>;
  initialBudget?: Budget;
  isSubmitting: boolean;
}) {
  const [formState, setFormState] = useState<BudgetFormState>(
    createDefaultBudgetFormState(),
  );

  useEffect(() => {
    if (!open) return;
    setFormState(
      initialBudget
        ? budgetToFormState(initialBudget)
        : createDefaultBudgetFormState(),
    );
  }, [initialBudget, open]);

  const isEditing = Boolean(initialBudget);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.name.trim()) return;

    await onSubmit(
      isEditing ? toBudgetUpdateInput(formState) : toBudgetInput(formState),
    );
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit budget" : "Create budget"}
            </DialogTitle>
            <DialogDescription>
              Define a spending ceiling, timeframe, and category so you can
              track burn versus plan in one place.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="budget-name">Budget name</Label>
              <Input
                id="budget-name"
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Monthly operations"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget-amount">Amount</Label>
              <Input
                id="budget-amount"
                type="number"
                min="0"
                step="0.01"
                value={formState.amount}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget-currency">Currency</Label>
              <Input
                id="budget-currency"
                maxLength={3}
                value={formState.currency}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    currency: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="USD"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget-category">Category</Label>
              <Input
                id="budget-category"
                value={formState.category}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                placeholder="Operations"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget-period">Period</Label>
              <Select
                value={formState.period}
                onValueChange={(value: BudgetPeriod) =>
                  setFormState((current) => ({
                    ...current,
                    period: value,
                  }))
                }
              >
                <SelectTrigger id="budget-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.filter((option) => option.id !== "all").map(
                    (option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget-start-date">Start date</Label>
              <Input
                id="budget-start-date"
                type="date"
                value={formState.startDate}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget-end-date">End date</Label>
              <Input
                id="budget-end-date"
                type="date"
                value={formState.endDate}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
              />
            </div>

            {isEditing ? (
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="budget-status">Status</Label>
                <Select
                  value={formState.isActive ? "active" : "inactive"}
                  onValueChange={(value) =>
                    setFormState((current) => ({
                      ...current,
                      isActive: value === "active",
                    }))
                  }
                >
                  <SelectTrigger id="budget-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
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
              disabled={isSubmitting || !formState.name.trim()}
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Create budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteBudgetDialog({
  open,
  onClose,
  onConfirm,
  budgetName,
  isDeleting,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  budgetName: string;
  isDeleting: boolean;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete budget</AlertDialogTitle>
          <AlertDialogDescription>
            Delete &quot;{budgetName}&quot; permanently. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
            onClick={(event) => {
              event.preventDefault();
              void onConfirm();
            }}
          >
            {isDeleting ? "Deleting..." : "Delete budget"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function BudgetsPage() {
  const auth = useAuth();
  const { workspaceId } = useWorkspaceScope();
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState<"all" | BudgetPeriod>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("active");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>();
  const [deletingBudget, setDeletingBudget] = useState<Budget | undefined>();

  const budgetsQuery = useMemo(
    () => ({
      page: 1,
      limit: 100,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(periodFilter !== "all" ? { period: periodFilter } : {}),
      ...(categoryFilter !== "all" ? { category: categoryFilter } : {}),
      ...(statusFilter === "active" ? { isActive: true } : {}),
      ...(statusFilter === "inactive" ? { isActive: false } : {}),
    }),
    [categoryFilter, periodFilter, search, statusFilter],
  );

  const summaryQuery = useMemo(
    () => ({
      ...(periodFilter !== "all" ? { period: periodFilter } : {}),
      ...(categoryFilter !== "all" ? { category: categoryFilter } : {}),
    }),
    [categoryFilter, periodFilter],
  );

  const isQueryEnabled =
    auth.hasHydrated && auth.isAuthenticated && Boolean(workspaceId);

  const {
    data: budgetsData,
    isPending: isBudgetsPending,
    error: budgetsError,
  } = useBudgetsQuery(workspaceId ?? "", budgetsQuery, isQueryEnabled);
  const { data: budgetSummaryData, isPending: isSummaryPending } =
    useBudgetSummaryQuery(workspaceId ?? "", summaryQuery, isQueryEnabled);

  const createBudgetMutation = useCreateBudgetMutation(
    workspaceId ?? "",
    budgetsQuery,
  );
  const updateBudgetMutation = useUpdateBudgetMutation(
    workspaceId ?? "",
    budgetsQuery,
  );
  const deleteBudgetMutation = useDeleteBudgetMutation(
    workspaceId ?? "",
    budgetsQuery,
  );

  const budgets = useMemo(() => budgetsData?.data.items ?? [], [budgetsData]);
  const summaryItems = useMemo(
    () => budgetSummaryData ?? [],
    [budgetSummaryData],
  );

  const summaryById = useMemo(
    () => new Map(summaryItems.map((budget) => [budget.id, budget] as const)),
    [summaryItems],
  );

  const visibleBudgetRows = useMemo(
    () =>
      budgets.map((budget) => ({
        budget,
        summary: summaryById.get(budget.id),
      })),
    [budgets, summaryById],
  );

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();

    budgets.forEach((budget) => {
      if (budget.category) categories.add(budget.category);
    });

    summaryItems.forEach((budget) => {
      if (budget.category) categories.add(budget.category);
    });

    return Array.from(categories).sort((left, right) =>
      left.localeCompare(right),
    );
  }, [budgets, summaryItems]);

  const metrics = useMemo(() => {
    const planned = visibleBudgetRows.reduce(
      (total, row) => total + row.budget.amount,
      0,
    );
    const spent = visibleBudgetRows.reduce(
      (total, row) => total + (row.summary?.actualSpending ?? 0),
      0,
    );
    const remaining = visibleBudgetRows.reduce(
      (total, row) =>
        total + (row.summary?.remainingAmount ?? row.budget.amount),
      0,
    );
    const overBudgetCount = visibleBudgetRows.filter(
      (row) => row.summary?.isOverBudget,
    ).length;
    const currencySet = new Set(
      visibleBudgetRows.map((row) => row.budget.currency),
    );
    const primaryCurrency =
      currencySet.size === 1
        ? (visibleBudgetRows[0]?.budget.currency ?? "USD")
        : "USD";

    return {
      planned,
      spent,
      remaining,
      overBudgetCount,
      primaryCurrency,
      hasMixedCurrencies: currencySet.size > 1,
    };
  }, [visibleBudgetRows]);

  // Prepare chart data - group by budget name with spending data
  const chartData = useMemo<ChartDataItem[]>(() => {
    return visibleBudgetRows.map(({ budget, summary }) => ({
      id: budget.id,
      name: budget.name.length > 18 ? `${budget.name.slice(0, 18)}...` : budget.name,
      budgeted: budget.amount,
      spent: summary?.actualSpending ?? 0,
      remaining: summary?.remainingAmount ?? budget.amount,
      isOverBudget: summary?.isOverBudget ?? false,
      percentUsed: summary?.percentUsed ?? 0,
    }));
  }, [visibleBudgetRows]);

  const isEmpty = !isBudgetsPending && budgets.length === 0;
  const handleCreateBudget = async (
    input: CreateBudgetInput | UpdateBudgetInput,
  ) => {
    try {
      await createBudgetMutation.mutateAsync(input as CreateBudgetInput);
      toast.success("Budget created successfully");
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create budget",
      );
    }
  };

  const handleUpdateBudget = async (
    input: CreateBudgetInput | UpdateBudgetInput,
  ) => {
    if (!editingBudget) return;

    try {
      await updateBudgetMutation.mutateAsync({
        budgetId: editingBudget.id,
        input,
      });
      toast.success("Budget updated successfully");
      setEditingBudget(undefined);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update budget",
      );
    }
  };

  const handleDeleteBudget = async () => {
    if (!deletingBudget) return;

    try {
      await deleteBudgetMutation.mutateAsync(deletingBudget.id);
      toast.success("Budget deleted");
      setDeletingBudget(undefined);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete budget",
      );
    }
  };

  const handleToggleBudgetStatus = async (budget: Budget) => {
    try {
      await updateBudgetMutation.mutateAsync({
        budgetId: budget.id,
        input: { isActive: !budget.isActive },
      });
      toast.success(
        budget.isActive ? "Budget marked inactive" : "Budget reactivated",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update budget status",
      );
    }
  };

  return (
    <PageLayout>
      <PageHeader
        title="Budgets"
        actions={
          <Button

            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New budget
          </Button>
        }
        toolbar={
          <PageToolbarResponsive
            left={
              <div className="flex w-full flex-col gap-2 lg:flex-row lg:flex-wrap">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search budgets"
                  className="w-full lg:w-64"
                />

                <Select
                  value={statusFilter}
                  onValueChange={(value: "all" | "active" | "inactive") =>
                    setStatusFilter(value)
                  }
                >
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={periodFilter}
                  onValueChange={(value: "all" | BudgetPeriod) =>
                    setPeriodFilter(value)
                  }
                >
                  <SelectTrigger className="w-full lg:w-44">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-full lg:w-44">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {availableCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            }
          />
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        {isBudgetsPending ? <BudgetsSkeleton /> : null}

        {!isBudgetsPending ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Planned"
              value={formatCurrency(metrics.planned, metrics.primaryCurrency)}
              description={
                metrics.hasMixedCurrencies
                  ? "Across mixed currencies"
                  : "Visible budgets total"
              }
              tooltip="Total budgeted amount across all visible budgets in the current filter."
              icon={<Wallet className="h-4 w-4" />}
            />
            <SummaryCard
              title="Spent"
              value={formatCurrency(metrics.spent, metrics.primaryCurrency)}
              description={
                isSummaryPending
                  ? "Refreshing spending snapshot"
                  : "Matched against expense transactions"
              }
              tooltip="Total actual spending matched against budgets from expense transactions."
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <SummaryCard
              title="Remaining"
              value={formatCurrency(metrics.remaining, metrics.primaryCurrency)}
              description="Budget headroom across visible rows"
              tooltip="Remaining budget available across all visible budgets."
              icon={<PiggyBank className="h-4 w-4" />}
              tone={metrics.remaining < 0 ? "danger" : "success"}
            />
            <SummaryCard
              title="Watchlist"
              value={String(metrics.overBudgetCount)}
              description="Budgets already over plan"
              tooltip="Number of budgets where actual spending exceeds the planned amount."
              icon={<AlertTriangle className="h-4 w-4" />}
              tone={metrics.overBudgetCount > 0 ? "danger" : "default"}
            />
          </div>
        ) : null}

        {/* Spending Summary Chart */}
        {!isBudgetsPending && !isEmpty ? (
          <div className="grid gap-4">
            <SpendingSummaryChart
              data={chartData}
              currency={metrics.primaryCurrency}
              isLoading={isSummaryPending}
            />
          </div>
        ) : null}

        <div className="flex flex-col">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            Budgets
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Your latest budget updates and completions will appear here.
          </p>
        </div>

        {budgetsError ? (
          <EmptyState
            title="Failed to load budgets"
            description={
              budgetsError instanceof Error
                ? budgetsError.message
                : "There was an error loading budgets. Please try again."
            }
            icon={Wallet}
            variant="border"
          />
        ) : null}

        {isEmpty ? (
          <EmptyState
            title="No budgets yet"
            description="Create your first budget to compare planned spend against real expenses."
            icon={PiggyBank}
            action={
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create budget
              </Button>
            }
            variant="border"
          />
        ) : null}

        {!isBudgetsPending && !isEmpty && !budgetsError ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleBudgetRows.map(({ budget, summary }) => {
              const actualSpending = summary?.actualSpending ?? 0;
              const remainingAmount = summary?.remainingAmount ?? budget.amount;
              const percentUsed = summary?.percentUsed ?? 0;
              const isOverBudget = summary?.isOverBudget ?? false;

              return (
                <Card
                  key={budget.id}
                  className={cn(
                    "",
                    isOverBudget && "border-rose-200/80 bg-rose-50/40",
                    !budget.isActive && "opacity-75",
                  )}
                >
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100/80 text-emerald-700">
                              <Wallet className="h-3.5 w-3.5" />
                            </div>
                            <h3 className="truncate text-lg font-semibold text-foreground">
                              {budget.name}
                            </h3>
                          </div>
                          <Badge
                            variant={budget.isActive ? "default" : "secondary"}
                          >
                            {budget.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {isOverBudget ? (
                            <Badge
                              variant="outline"
                              className="border-rose-300 text-rose-700"
                            >
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Over budget
                            </Badge>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <Badge variant="muted">{budget.period}</Badge>
                          {budget.category ? (
                            <Badge variant="muted">{budget.category}</Badge>
                          ) : null}
                          <Badge variant="muted">
                            <CalendarDays className="mr-1 h-3 w-3" />
                            {formatBudgetDateRange(budget)}
                          </Badge>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingBudget(budget)}
                          >
                            <PencilLine className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              void handleToggleBudgetStatus(budget)
                            }
                          >
                            <Wallet className="mr-2 h-4 w-4" />
                            {budget.isActive ? "Mark inactive" : "Reactivate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingBudget(budget)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Budgeted
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                          {formatCurrency(budget.amount, budget.currency)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Spent
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                          {formatCurrency(actualSpending, budget.currency)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Remaining
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-lg font-semibold",
                            remainingAmount < 0
                              ? "text-rose-700"
                              : "text-foreground",
                          )}
                        >
                          {formatCurrency(remainingAmount, budget.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Utilization
                        </span>
                        <span
                          className={cn(
                            "font-medium",
                            isOverBudget ? "text-rose-700" : "text-foreground",
                          )}
                        >
                          {percentUsed.toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(percentUsed, 100)}
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : null}
      </div>

      <BudgetFormDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateBudget}
        isSubmitting={createBudgetMutation.isPending}
      />

      <BudgetFormDialog
        open={Boolean(editingBudget)}
        onClose={() => setEditingBudget(undefined)}
        onSubmit={handleUpdateBudget}
        initialBudget={editingBudget}
        isSubmitting={updateBudgetMutation.isPending}
      />

      <DeleteBudgetDialog
        open={Boolean(deletingBudget)}
        onClose={() => setDeletingBudget(undefined)}
        onConfirm={handleDeleteBudget}
        budgetName={deletingBudget?.name ?? ""}
        isDeleting={deleteBudgetMutation.isPending}
      />
    </PageLayout>
  );
}
