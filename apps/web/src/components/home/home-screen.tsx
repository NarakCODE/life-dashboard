'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { publicEnv } from '@/env/public';
import { useTaskOverviewQuery } from '@/features/dashboard/hooks/use-task-overview-query';

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export function HomeScreen(): React.JSX.Element {
  const { user, isLoading, error, logout } = useAuth();
  const taskOverviewQuery = useTaskOverviewQuery(Boolean(user));

  if (isLoading && !user) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 text-slate-600 shadow-sm">
          Loading session...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
            Frontend Foundation Ready
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950">
            Life Dashboard now has a typed env layer, TanStack Query, and modular API clients.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Set your API URL, sign in, and this page will load authenticated dashboard data
            through the shared QueryClient and feature API layer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Create account
            </Link>
          </div>
          <dl className="mt-10 grid gap-4 text-sm text-slate-600 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="font-medium text-slate-900">Public API base URL</dt>
              <dd className="mt-1 break-all">{publicEnv.NEXT_PUBLIC_API_BASE_URL}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="font-medium text-slate-900">App environment</dt>
              <dd className="mt-1">{publicEnv.NEXT_PUBLIC_APP_ENV}</dd>
            </div>
          </dl>
          {error ? (
            <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </p>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Query Example
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
              Welcome back, {user.displayName}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              This screen uses `useCurrentUserQuery`, `useTaskOverviewQuery`, and the shared
              Axios client with centralized auth and error handling.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void logout();
            }}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Sign out
          </button>
        </div>

        {isLoading || taskOverviewQuery.isLoading ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            Loading dashboard data...
          </div>
        ) : null}

        {taskOverviewQuery.error ? (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {taskOverviewQuery.error.message}
          </div>
        ) : null}

        {taskOverviewQuery.data ? (
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total Tasks" value={taskOverviewQuery.data.totalTasks} />
            <MetricCard label="Overdue" value={taskOverviewQuery.data.overdueCount} />
            <MetricCard label="Upcoming" value={taskOverviewQuery.data.upcomingCount} />
            <MetricCard
              label="Completed"
              value={taskOverviewQuery.data.completedSummary.total}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}
