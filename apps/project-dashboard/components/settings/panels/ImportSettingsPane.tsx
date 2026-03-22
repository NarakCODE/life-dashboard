"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle,
  Circle,
  CircleNotch,
  FileText,
  Info,
  TrashSimple,
  UploadSimple,
} from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function ImportSettingsPane() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const steps = [
    { id: 1, label: "Upload" },
    { id: 2, label: "Select header" },
    { id: 3, label: "Map columns" },
    { id: 4, label: "Import" },
  ] as const;
  const [activeStep, setActiveStep] = useState<(typeof steps)[number]["id"]>(1);
  const [headerRow, setHeaderRow] = useState(1);
  const [importStatus, setImportStatus] = useState<"idle" | "running" | "done">(
    "idle",
  );
  const [importProgress, setImportProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);

  const columns = [
    { name: "ID", required: false },
    { name: "Title", required: true },
    { name: "Board", required: false },
    { name: "Status", required: false },
    { name: "Description", required: false },
    { name: "Parent ID", required: false },
    { name: "Assignee emails", required: false },
    { name: "Tags", required: false },
    { name: "Priority", required: false },
  ] as const;

  const previewRows = [
    { id: 1, cells: ["Task Name", "Status", "Owner", "Due Date", "Priority"] },
    {
      id: 2,
      cells: [
        "Finalize onboarding flow",
        "In progress",
        "Liam",
        "2026-02-10",
        "High",
      ],
    },
    {
      id: 3,
      cells: [
        "Scope pricing page refresh",
        "Not started",
        "Ari",
        "2026-02-18",
        "Medium",
      ],
    },
    {
      id: 4,
      cells: [
        "Launch client feedback survey",
        "Blocked",
        "Maya",
        "2026-02-25",
        "High",
      ],
    },
    {
      id: 5,
      cells: ["Update Q1 roadmap", "In review", "Noah", "2026-03-01", "Low"],
    },
  ] as const;

  const sourceColumns = [
    {
      id: "Task Name",
      samples: ["Finalize onboarding flow", "Update Q1 roadmap"],
    },
    { id: "Status", samples: ["In progress", "Blocked"] },
    { id: "Owner", samples: ["Liam", "Maya"] },
    { id: "Due Date", samples: ["2026-02-10", "2026-03-01"] },
    { id: "Priority", samples: ["High", "Medium"] },
  ] as const;

  const mappingFields = [
    { id: "title", label: "Title", required: true, suggested: "Task Name" },
    { id: "status", label: "Status", required: false, suggested: "Status" },
    { id: "assignee", label: "Assignee", required: false, suggested: "Owner" },
    {
      id: "dueDate",
      label: "Due date",
      required: false,
      suggested: "Due Date",
    },
    {
      id: "priority",
      label: "Priority",
      required: false,
      suggested: "Priority",
    },
    {
      id: "description",
      label: "Description",
      required: false,
      suggested: "__skip",
    },
    { id: "tags", label: "Tags", required: false, suggested: "__skip" },
  ] as const;

  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    mappingFields.reduce(
      (acc, field) => {
        acc[field.id] = field.suggested ?? "__skip";
        return acc;
      },
      {} as Record<string, string>,
    ),
  );

  const requiredFields = mappingFields.filter((field) => field.required);
  const mappedRequiredCount = requiredFields.filter(
    (field) => columnMapping[field.id] !== "__skip",
  ).length;
  const missingRequired = requiredFields.filter(
    (field) => columnMapping[field.id] === "__skip",
  );
  const totalRows = 2430;
  const errorRows = 17;
  const skippedRows = 6;
  const processedRows = Math.min(
    totalRows,
    Math.round((importProgress / 100) * totalRows),
  );
  const completedRows = totalRows - errorRows - skippedRows;
  const importStages = [
    { id: "validate", label: "Validating headers", threshold: 10 },
    { id: "map", label: "Mapping columns", threshold: 35 },
    { id: "create", label: "Creating tasks", threshold: 75 },
    { id: "finalize", label: "Finalizing import", threshold: 100 },
  ] as const;

  const resetImportFlow = () => {
    setActiveStep(1);
    setHeaderRow(1);
    setUploadedFile(null);
    setImportStatus("idle");
    setImportProgress(0);
    setColumnMapping(
      mappingFields.reduce(
        (acc, field) => {
          acc[field.id] = field.suggested ?? "__skip";
          return acc;
        },
        {} as Record<string, string>,
      ),
    );
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const unit = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const index = Math.min(
      sizes.length - 1,
      Math.floor(Math.log(bytes) / Math.log(unit)),
    );
    const value = bytes / Math.pow(unit, index);
    return `${value.toFixed(index === 0 ? 0 : 1)} ${sizes[index]}`;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.split(".").pop()?.toUpperCase() ?? "FILE";
    setUploadedFile({
      name: file.name,
      size: formatBytes(file.size),
      type: extension,
    });
  };

  useEffect(() => {
    if (activeStep !== 4) {
      setImportStatus("idle");
      setImportProgress(0);
    }
  }, [activeStep]);

  useEffect(() => {
    if (activeStep === 4 && importStatus === "idle") {
      setImportProgress(0);
      setImportStatus("running");
    }
  }, [activeStep, importStatus]);

  useEffect(() => {
    if (activeStep !== 4 || importStatus !== "running") {
      return;
    }

    const interval = setInterval(() => {
      setImportProgress((previous) => {
        const increment = Math.floor(Math.random() * 8) + 6;
        const next = Math.min(100, previous + increment);
        if (next >= 100) {
          setImportStatus("done");
        }
        return next;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [activeStep, importStatus]);

  return (
    <div className="space-y-8">
      <div>
        <DialogTitle className="text-xl">Import</DialogTitle>
        <DialogDescription className="mt-1">
          Bring your existing data in just a few steps. Upload your file, map
          your properties, and import tasks seamlessly.
        </DialogDescription>
      </div>

      <Separator />

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {steps.map((step, index) => {
            const isActive = step.id === activeStep;
            const isComplete = step.id < activeStep;
            const isLast = index === steps.length - 1;
            const StepIcon = isComplete ? CheckCircle : Circle;

            return (
              <div
                key={step.id}
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <button
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1",
                    isActive
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : isComplete
                        ? "border-primary/40 bg-primary/5 text-primary/80"
                        : "border-border text-muted-foreground",
                  )}
                >
                  <StepIcon
                    className="h-4 w-4"
                    weight={isComplete ? "fill" : "regular"}
                  />
                  <span className="text-xs font-semibold">{step.id}.</span>
                  <span>{step.label}</span>
                </button>
                {!isLast && <span className="text-sm">›</span>}
              </div>
            );
          })}
        </div>

        {activeStep === 1 && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
            <div className="flex h-full flex-col gap-4">
              {!uploadedFile && (
                <label className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-center transition hover:border-primary/50 hover:bg-primary/5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                  <UploadSimple className="h-6 w-6 text-primary" />
                  <p className="text-sm font-medium text-foreground">
                    Browse or drag your file here
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    CSV or XLSX up to 10MB
                  </p>
                </label>
              )}

              {uploadedFile && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/70 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {uploadedFile.size} · Completed
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setUploadedFile(null)}
                    aria-label="Remove file"
                  >
                    <TrashSimple className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/70">
              <div className="grid grid-cols-[minmax(0,1fr)_100px] border-b border-border/60 px-4 py-3 text-xs font-semibold text-muted-foreground">
                <span>Expected column</span>
                <span className="text-right">Required</span>
              </div>
              <div className="divide-y divide-border/70">
                {columns.map((column) => (
                  <div
                    key={column.name}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <div className="flex items-center gap-2 text-foreground">
                      <span>{column.name}</span>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-muted-foreground">
                      {column.required ? (
                        <CheckCircle
                          className="h-4 w-4 text-primary"
                          weight="fill"
                        />
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
            <div className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Pick the header row
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Choose the row that contains your column names.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Header row</span>
                  <Select
                    value={String(headerRow)}
                    onValueChange={(value) => setHeaderRow(Number(value))}
                  >
                    <SelectTrigger className="h-8 w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {previewRows.map((row) => (
                        <SelectItem key={row.id} value={String(row.id)}>
                          Row {row.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-border/70">
                <div className="overflow-x-auto">
                  <div className="min-w-[640px]">
                    <div className="grid grid-cols-[60px_repeat(5,minmax(120px,1fr))] gap-0 border-b border-border/60 bg-muted/50 px-2 py-2 text-[11px] font-semibold text-muted-foreground">
                      <span className="pl-2">Row</span>
                      <span>Col A</span>
                      <span>Col B</span>
                      <span>Col C</span>
                      <span>Col D</span>
                      <span>Col E</span>
                    </div>
                    <div className="divide-y divide-border/70">
                      {previewRows.map((row) => {
                        const isSelected = headerRow === row.id;
                        return (
                          <button
                            key={row.id}
                            type="button"
                            onClick={() => setHeaderRow(row.id)}
                            className={cn(
                              "grid w-full grid-cols-[60px_repeat(5,minmax(120px,1fr))] items-center px-2 py-3 text-left text-sm",
                              isSelected
                                ? "bg-primary/10 text-foreground"
                                : "bg-transparent text-muted-foreground hover:bg-muted/30",
                            )}
                          >
                            <span className="flex items-center gap-2 pl-2 text-xs font-semibold">
                              {isSelected ? (
                                <CheckCircle
                                  className="h-4 w-4 text-primary"
                                  weight="fill"
                                />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                              )}
                              {row.id}
                            </span>
                            {row.cells.map((cell, index) => (
                              <span
                                key={index}
                                className={cn(isSelected && "text-foreground")}
                              >
                                {cell}
                              </span>
                            ))}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-card/70 p-5">
                <p className="text-sm font-semibold text-foreground">
                  File insights
                </p>
                <div className="mt-4 space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Detected columns</span>
                    <span className="text-foreground">5 columns</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Rows scanned</span>
                    <span className="text-foreground">2,430 rows</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Delimiter</span>
                    <span className="text-foreground">Comma</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Encoding</span>
                    <span className="text-foreground">UTF-8</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
                <p className="text-sm font-semibold text-foreground">
                  How we use this
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  We will use row {headerRow} as the field names, then start
                  importing from the next row.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary" weight="fill" />
                  First data row will be row {headerRow + 1}.
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
            <div className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Map your columns
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Match source columns to Dart fields. Required fields must be
                    mapped.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() =>
                    setColumnMapping((previous) => {
                      const next = { ...previous };
                      mappingFields.forEach((field) => {
                        next[field.id] = field.suggested ?? "__skip";
                      });
                      return next;
                    })
                  }
                >
                  Auto-map
                </Button>
              </div>

              <div className="overflow-hidden rounded-xl border border-border/70">
                <div className="grid grid-cols-[minmax(0,1fr)_220px] border-b border-border/60 bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground">
                  <span>Expected field</span>
                  <span>Map to column</span>
                </div>
                <div className="divide-y divide-border/70">
                  {mappingFields.map((field) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-[minmax(0,1fr)_220px] items-center px-4 py-3"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-foreground">{field.label}</span>
                        {field.required && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            Required
                          </span>
                        )}
                      </div>
                      <Select
                        value={columnMapping[field.id]}
                        onValueChange={(value) =>
                          setColumnMapping((previous) => ({
                            ...previous,
                            [field.id]: value,
                          }))
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__skip">Do not import</SelectItem>
                          {sourceColumns.map((column) => (
                            <SelectItem key={column.id} value={column.id}>
                              {column.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-card/70 p-5">
                <p className="text-sm font-semibold text-foreground">
                  Source columns
                </p>
                <div className="mt-4 space-y-3 text-xs text-muted-foreground">
                  {sourceColumns.map((column) => (
                    <div
                      key={column.id}
                      className="rounded-lg border border-border/60 bg-muted/20 p-3"
                    >
                      <div className="flex items-center justify-between text-sm text-foreground">
                        <span>{column.id}</span>
                        <span className="text-[10px] text-muted-foreground">
                          Sample values
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        {column.samples.join(" · ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
                <p className="text-sm font-semibold text-foreground">
                  Mapping status
                </p>
                <div className="mt-3 text-xs text-muted-foreground">
                  Required fields mapped: {mappedRequiredCount}/
                  {requiredFields.length}
                </div>
                {missingRequired.length > 0 ? (
                  <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                    {missingRequired.map((field) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <Circle className="h-4 w-4 text-muted-foreground" />
                        <span>{field.label} is not mapped</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle
                      className="h-4 w-4 text-primary"
                      weight="fill"
                    />
                    All required fields are mapped.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeStep === 4 && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
            <div className="space-y-5 rounded-2xl border border-border/70 bg-card/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {importStatus === "done"
                      ? "Import complete"
                      : "Importing tasks"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {importStatus === "done"
                      ? "Review the summary and open your imported tasks."
                      : "We are validating and creating tasks from your file."}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {importStatus === "running" ? (
                    <>
                      <CircleNotch className="h-4 w-4 animate-spin text-primary" />
                      Importing
                    </>
                  ) : (
                    <>
                      <CheckCircle
                        className="h-4 w-4 text-primary"
                        weight="fill"
                      />
                      Finished
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Progress value={importProgress} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {importStatus === "done"
                      ? `Processed ${totalRows} rows`
                      : `Processing ${processedRows} / ${totalRows} rows`}
                  </span>
                  <span className="text-foreground">{importProgress}%</span>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs font-semibold text-muted-foreground">
                  Import activity
                </p>
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  {importStages.map((stage, index) => {
                    const isComplete = importProgress >= stage.threshold;
                    const previousStage = index > 0 ? importStages[index - 1] : null;
                    const previousStageThreshold = previousStage?.threshold ?? -1;
                    const isActive =
                      importProgress < stage.threshold &&
                      (index === 0 ||
                        importProgress >= previousStageThreshold);
                    return (
                      <div key={stage.id} className="flex items-center gap-2">
                        {isComplete ? (
                          <CheckCircle
                            className="h-4 w-4 text-primary"
                            weight="fill"
                          />
                        ) : isActive ? (
                          <CircleNotch className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={cn(isComplete && "text-foreground")}>
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-card/70 p-5">
                <p className="text-sm font-semibold text-foreground">
                  Import summary
                </p>
                <div className="mt-4 space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Total rows</span>
                    <span className="text-foreground">{totalRows}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Imported tasks</span>
                    <span className="text-foreground">
                      {importStatus === "done"
                        ? completedRows
                        : Math.max(0, processedRows - 5)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Skipped rows</span>
                    <span className="text-foreground">{skippedRows}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Errors</span>
                    <span className="text-foreground">{errorRows}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
                <p className="text-sm font-semibold text-foreground">
                  Next actions
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {importStatus === "done"
                    ? "Open the created tasks or download an error report."
                    : "You can leave this open while the import completes."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" size="sm" className="h-9 px-4">
                    View tasks
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 px-4"
                  >
                    Download error report
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {activeStep < 4 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 px-3"
              onClick={resetImportFlow}
            >
              Cancel import
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-4"
              onClick={() =>
                setActiveStep(
                  (step) =>
                    Math.max(1, step - 1) as (typeof steps)[number]["id"],
                )
              }
              disabled={activeStep === 1}
            >
              Back
            </Button>
            {activeStep < steps.length - 1 && (
              <Button
                type="button"
                size="sm"
                className="h-9 px-4"
                onClick={() =>
                  setActiveStep(
                    (step) =>
                      Math.min(
                        steps.length,
                        step + 1,
                      ) as (typeof steps)[number]["id"],
                  )
                }
              >
                Next
              </Button>
            )}
            {activeStep === steps.length - 1 && (
              <Button
                type="button"
                size="sm"
                className="h-9 px-4"
                onClick={() => {
                  setActiveStep(4);
                  setImportProgress(0);
                  setImportStatus("running");
                }}
              >
                Start import
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
