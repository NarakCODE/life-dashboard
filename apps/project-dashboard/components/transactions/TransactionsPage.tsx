"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Calendar,
  Tag,
  Search,
  ArrowUpDown,
  Trash2,
  Pencil,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";
import {
  useTransactionsQuery,
  useTransactionSummaryQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} from "@/lib/transactions/transactions-query";
import {
  Transaction,
  TransactionType,
  TransactionCategory,
  CreateTransactionInput,
  TRANSACTION_TYPE_OPTIONS,
  TRANSACTION_CATEGORY_OPTIONS,
} from "@/lib/transactions/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

const TYPE_FILTER_OPTIONS = [
  { id: "all", label: "All types" },
  { id: TransactionType.INCOME, label: "Income" },
  { id: TransactionType.EXPENSE, label: "Expense" },
] as const;

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

function getCategoryLabel(category: TransactionCategory) {
  return (
    TRANSACTION_CATEGORY_OPTIONS.find((opt) => opt.id === category)?.label ||
    category
  );
}

function getCategoryIcon(category: TransactionCategory) {
  return (
    TRANSACTION_CATEGORY_OPTIONS.find((opt) => opt.id === category)?.icon ||
    "📦"
  );
}

interface TransactionFormState {
  amount: string;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  date: string;
  currency: string;
}

function createDefaultFormState(): TransactionFormState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    amount: "",
    type: TransactionType.EXPENSE,
    category: TransactionCategory.OTHER,
    description: "",
    date: today,
    currency: "USD",
  };
}

function transactionToFormState(
  transaction: Transaction,
): TransactionFormState {
  return {
    amount: String(transaction.amount),
    type: transaction.type,
    category: transaction.category,
    description: transaction.description || "",
    date: transaction.date.slice(0, 10),
    currency: transaction.currency,
  };
}

function formStateToInput(
  formState: TransactionFormState,
): CreateTransactionInput {
  return {
    amount: Math.max(0, Number(formState.amount) || 0),
    type: formState.type,
    category: formState.category,
    description: formState.description.trim() || undefined,
    date: new Date(formState.date).toISOString(),
    currency: formState.currency.toUpperCase() || "USD",
  };
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "income" | "expense" | "net";
}) {
  const toneStyles = {
    default: "",
    income: "border-emerald-200/70 bg-emerald-50/40",
    expense: "border-rose-200/70 bg-rose-50/40",
    net: "border-blue-200/70 bg-blue-50/40",
  };

  const iconStyles = {
    default: "text-muted-foreground",
    income: "text-emerald-600",
    expense: "text-rose-600",
    net: "text-blue-600",
  };

  return (
    <Card className={cn("border-border/60", toneStyles[tone])}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-semibold text-foreground">{value}</p>
          </div>
          <Icon className={cn("h-8 w-8", iconStyles[tone])} />
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryBreakdownCard({
  title,
  items,
  total,
  currency,
}: {
  title: string;
  items: Array<{ category: string; totalAmount: number; count: number }>;
  total: number;
  currency: string;
}) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available</p>
          ) : (
            items.slice(0, 5).map((item) => {
              const percentage =
                total > 0 ? (item.totalAmount / total) * 100 : 0;
              return (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>
                        {getCategoryIcon(item.category as TransactionCategory)}
                      </span>
                      <span className="capitalize">
                        {getCategoryLabel(item.category as TransactionCategory)}
                      </span>
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.totalAmount, currency)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.count} transaction{item.count !== 1 ? "s" : ""}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionFormDialog({
  open,
  onClose,
  transaction,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction;
  onSubmit: (input: CreateTransactionInput) => Promise<void>;
  isSubmitting: boolean;
}) {
  const isEditing = Boolean(transaction);
  const [formState, setFormState] = useState<TransactionFormState>(
    transaction
      ? transactionToFormState(transaction)
      : createDefaultFormState(),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.amount || Number(formState.amount) <= 0) return;
    await onSubmit(formStateToInput(formState));
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-125">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit transaction" : "Add transaction"}
            </DialogTitle>
            <DialogDescription>
              Record a new income or expense transaction to track your finances.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formState.type}
                  onValueChange={(value: TransactionType) =>
                    setFormState((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formState.date}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formState.amount}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  maxLength={3}
                  placeholder="USD"
                  value={formState.currency}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      currency: e.target.value.toUpperCase(),
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formState.category}
                onValueChange={(value: TransactionCategory) =>
                  setFormState((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <span className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Grocery shopping"
                value={formState.description}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    description: e.target.value,
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
              disabled={
                isSubmitting ||
                !formState.amount ||
                Number(formState.amount) <= 0
              }
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Add transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TransactionCard({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}) {
  const isIncome = transaction.type === TransactionType.INCOME;
  const formattedDate = format(parseISO(transaction.date), "MMM d, yyyy");

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-lg",
                isIncome ? "bg-emerald-100" : "bg-rose-100",
              )}
            >
              {getCategoryIcon(transaction.category)}
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                {transaction.description ||
                  getCategoryLabel(transaction.category)}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="muted" className="capitalize">
                  {getCategoryLabel(transaction.category)}
                </Badge>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <p
              className={cn(
                "text-lg font-semibold",
                isIncome ? "text-emerald-600" : "text-rose-600",
              )}
            >
              {isIncome ? "+" : "-"}
              {formatCurrency(transaction.amount, transaction.currency)}
            </p>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(transaction)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(transaction)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/60">
            <CardContent className="p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function TransactionsPage() {
  const auth = useAuth();
  const { workspaceId } = useWorkspaceScope();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | TransactionCategory
  >("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<
    Transaction | undefined
  >();
  const [deletingTransaction, setDeletingTransaction] = useState<
    Transaction | undefined
  >();

  const query = useMemo(
    () => ({
      page: 1,
      limit: 50,
      sortBy: "date",
      sortOrder: "desc" as const,
      ...(search.trim() && { search: search.trim() }),
      ...(typeFilter !== "all" && { type: typeFilter }),
      ...(categoryFilter !== "all" && { category: categoryFilter }),
    }),
    [categoryFilter, search, typeFilter],
  );

  const isQueryEnabled =
    auth.hasHydrated && auth.isAuthenticated && Boolean(workspaceId);

  const {
    data: transactionsData,
    isPending: isTransactionsPending,
    error: transactionsError,
  } = useTransactionsQuery(workspaceId ?? "", query, isQueryEnabled);

  const { data: summaryData, isPending: isSummaryPending } =
    useTransactionSummaryQuery(workspaceId ?? "", query, isQueryEnabled);

  const createTransactionMutation = useCreateTransactionMutation(
    workspaceId ?? "",
    query,
  );
  const updateTransactionMutation = useUpdateTransactionMutation(
    workspaceId ?? "",
    query,
  );
  const deleteTransactionMutation = useDeleteTransactionMutation(
    workspaceId ?? "",
    query,
  );

  const transactions = transactionsData?.data.items ?? [];
  const isEmpty = !isTransactionsPending && transactions.length === 0;

  const handleCreateTransaction = async (input: CreateTransactionInput) => {
    try {
      await createTransactionMutation.mutateAsync(input);
      toast.success("Transaction added successfully");
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add transaction",
      );
    }
  };

  const handleUpdateTransaction = async (input: CreateTransactionInput) => {
    if (!editingTransaction) return;
    try {
      await updateTransactionMutation.mutateAsync({
        transactionId: editingTransaction.id,
        input,
      });
      toast.success("Transaction updated successfully");
      setEditingTransaction(undefined);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update transaction",
      );
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return;
    try {
      await deleteTransactionMutation.mutateAsync(deletingTransaction.id);
      toast.success("Transaction deleted");
      setDeletingTransaction(undefined);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete transaction",
      );
    }
  };

  const primaryCurrency =
    transactions[0]?.currency || summaryData?.byType[0]?.type || "USD";

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-background mx-2 my-2 border border-border rounded-lg min-w-0">
      <PageHeader
        title="Transactions"
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add transaction
          </Button>
        }
        toolbar={
          <PageToolbar
            left={
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search transactions"
                    className="w-full sm:w-64 pl-9"
                  />
                </div>

                <Select
                  value={typeFilter}
                  onValueChange={(value: "all" | TransactionType) =>
                    setTypeFilter(value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={categoryFilter}
                  onValueChange={(value: "all" | TransactionCategory) =>
                    setCategoryFilter(value)
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {TRANSACTION_CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <span className="flex items-center gap-2">
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                        </span>
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
        {isTransactionsPending && <TransactionsSkeleton />}

        {!isTransactionsPending && (
          <div className="grid gap-4">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                title="Total Income"
                value={formatCurrency(
                  summaryData?.totalIncome ?? 0,
                  primaryCurrency,
                )}
                icon={TrendingUp}
                tone="income"
              />
              <SummaryCard
                title="Total Expenses"
                value={formatCurrency(
                  summaryData?.totalExpense ?? 0,
                  primaryCurrency,
                )}
                icon={TrendingDown}
                tone="expense"
              />
              <SummaryCard
                title="Net Balance"
                value={formatCurrency(
                  summaryData?.netAmount ?? 0,
                  primaryCurrency,
                )}
                icon={Wallet}
                tone="net"
              />
              <SummaryCard
                title="Transactions"
                value={String(summaryData?.transactionCount ?? 0)}
                icon={CreditCard}
              />
            </div>

            {transactionsError && (
              <EmptyState
                title="Failed to load transactions"
                description="There was an error loading your transactions. Please try again."
                variant="border"
              />
            )}

            {isEmpty ? (
              <EmptyState
                title="No transactions yet"
                description="Start tracking your income and expenses by adding your first transaction."
                icon={CreditCard}
                action={
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add transaction
                  </Button>
                }
                variant="border"
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                {/* Transaction List */}
                <div className="lg:col-span-2 space-y-3">
                  {transactions.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={setEditingTransaction}
                      onDelete={setDeletingTransaction}
                    />
                  ))}
                </div>

                {/* Category Breakdown */}
                <div className="space-y-4">
                  <CategoryBreakdownCard
                    title="Expenses by Category"
                    items={
                      summaryData?.byCategory.filter(
                        (item) => item.category !== "income",
                      ) ?? []
                    }
                    total={summaryData?.totalExpense ?? 0}
                    currency={primaryCurrency}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <TransactionFormDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateTransaction}
        isSubmitting={createTransactionMutation.isPending}
      />

      <TransactionFormDialog
        open={Boolean(editingTransaction)}
        onClose={() => setEditingTransaction(undefined)}
        transaction={editingTransaction}
        onSubmit={handleUpdateTransaction}
        isSubmitting={updateTransactionMutation.isPending}
      />

      <AlertDialog
        open={Boolean(deletingTransaction)}
        onOpenChange={(open) => !open && setDeletingTransaction(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the transaction &quot;
              {deletingTransaction?.description ||
                getCategoryLabel(
                  deletingTransaction?.category || TransactionCategory.OTHER,
                )}
              &quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTransactionMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTransactionMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteTransaction();
              }}
            >
              {deleteTransactionMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
