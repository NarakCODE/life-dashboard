"use client";

import { useState, useMemo } from "react";
import {
  usePerformanceDashboard,
  usePerformanceFilters,
} from "@/lib/performance/performance-query";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";
import { PerformanceContent as PerformanceContentUI } from "./performance-content-ui";
import type {
  PerformanceDashboardResponse,
  PerformanceFilters,
} from "@/lib/performance/types";

interface PerformanceContentWrapperProps {
  // Future props for customization
}

export function PerformanceContent({}: PerformanceContentWrapperProps) {
  const workspaceScope = useWorkspaceScope();
  const workspaceId = workspaceScope.workspaceId;

  const [rangeId, setRangeId] = useState<"7d" | "30d" | "90d" | "custom">(
    "30d",
  );
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [selectedMember, setSelectedMember] = useState("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  // Build query parameters for API (matching backend PerformanceQueryDto)
  const performanceQuery = useMemo(() => {
    const rangeStart = dateRange.start || getDefaultStartDate(rangeId);
    const rangeEnd = dateRange.end || getDefaultEndDate();

    return {
      startDate: rangeStart,
      endDate: rangeEnd,
      projectId: selectedProjectId,
      member: selectedMember,
    };
  }, [rangeId, dateRange, selectedProjectId, selectedMember]);

  // Fetch performance data from API
  const {
    data: performanceData,
    isLoading,
    error,
  } = usePerformanceDashboard(workspaceId, performanceQuery, !!workspaceId);

  // Fetch available filters
  const { data: filtersData } = usePerformanceFilters(workspaceId);

  // Handle range change
  const handleRangeChange = (newRangeId: "7d" | "30d" | "90d" | "custom") => {
    setRangeId(newRangeId);
    if (newRangeId !== "custom") {
      const start = getDefaultStartDate(newRangeId);
      const end = getDefaultEndDate();
      setDateRange({ start, end });
    }
  };

  // Handle filter changes
  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleMemberChange = (member: string) => {
    setSelectedMember(member);
  };

  if (isLoading && !performanceData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold">
            Loading performance data...
          </div>
          <p className="text-sm text-muted-foreground">
            Fetching metrics from your workspace
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-destructive">
            Failed to load data
          </div>
          <p className="text-sm text-muted-foreground">
            Please try again later
          </p>
        </div>
      </div>
    );
  }

  return (
    <PerformanceContentUI
      performanceData={performanceData || null}
      filtersData={filtersData || null}
      rangeId={rangeId}
      selectedProjectId={selectedProjectId}
      selectedMember={selectedMember}
      dateRange={dateRange}
      onRangeChange={handleRangeChange}
      onProjectChange={handleProjectChange}
      onMemberChange={handleMemberChange}
      isLoading={isLoading}
      error={error}
    />
  );
}

function getDefaultStartDate(rangeId: string): string {
  const today = new Date();
  const days =
    rangeId === "7d" ? 6 : rangeId === "30d" ? 29 : rangeId === "90d" ? 89 : 29;
  const start = new Date(today);
  start.setDate(start.getDate() - days);
  return start.toISOString().split("T")[0];
}

function getDefaultEndDate(): string {
  return new Date().toISOString().split("T")[0];
}
