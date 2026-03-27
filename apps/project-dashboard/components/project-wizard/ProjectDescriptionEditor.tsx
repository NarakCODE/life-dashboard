"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import "@/styles/tiptap.css";
import {
  ArrowsOutSimple,
  Plus,
  StarFour,
  StopCircle,
  X,
} from "@phosphor-icons/react/dist/ssr";

type TemplateType =
  | "goal"
  | "scope"
  | "inScope"
  | "outScope"
  | "outcomes"
  | "feature";

interface ProjectDescriptionEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onExpandChange?: (isExpanded: boolean) => void;
  onFocusChange?: (isFocused: boolean) => void;
  placeholder?: string;
  className?: string;
  showTemplates?: boolean;
}

// ---------------------------------------------------------------------------
// Streaming helper — reads KIMI SSE and yields text deltas
// ---------------------------------------------------------------------------

async function* streamKimiResponse(
  prompt: string,
  existingContent: string,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const res = await fetch("/api/ai/write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, existingContent }),
    signal,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (!trimmed.startsWith("data: ")) continue;

      try {
        const json = JSON.parse(trimmed.slice(6));
        const delta: string = json?.choices?.[0]?.delta?.content ?? "";
        if (delta) yield delta;
      } catch {
        // skip malformed SSE line
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProjectDescriptionEditor({
  value,
  onChange,
  onExpandChange,
  onFocusChange,
  placeholder,
  className,
  showTemplates = true,
}: ProjectDescriptionEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // AI write state
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const aiInputRef = useRef<HTMLTextAreaElement>(null);

  const [existingSections, setExistingSections] = useState({
    goal: false,
    scope: false,
    outScope: false,
    outcomes: false,
    feature: false,
  });

  useEffect(() => {
    onFocusChange?.(isFocused);
  }, [isFocused, onFocusChange]);

  useEffect(() => {
    onExpandChange?.(isExpanded);
  }, [isExpanded, onExpandChange]);

  const defaultPlaceholder =
    placeholder ?? "Briefly describe the goal of this project/sprint...";

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: ({ node }: { node: any }) => {
          if (node.type.name === "heading") return "What's the title?";
          return defaultPlaceholder;
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    editorProps: {
      attributes: {
        class:
          "tiptap-editor h-full w-full outline-none prose prose-sm max-w-none text-foreground",
      },
    },
    content: value,
    immediatelyRender: false,
    onFocus: () => setIsFocused(true),
    onUpdate: ({ editor }: { editor: any }) => {
      const text = editor.getText();
      setExistingSections({
        goal: text.includes("Goal:"),
        scope: text.includes("Scope:"),
        outScope: text.includes("Out of Scope:"),
        outcomes: text.includes("Expected Outcomes:"),
        feature: text.includes("Key feature:"),
      });
      onChange?.(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value == null) return;
    const currentHtml = editor.getHTML();
    if (currentHtml === value) return;
    editor.commands.setContent(value);
  }, [value, editor]);

  // Handle click outside to reset focus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    if (isFocused) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFocused]);

  // Focus AI input when the panel opens
  useEffect(() => {
    if (showAiPanel) {
      setTimeout(() => aiInputRef.current?.focus(), 50);
    }
  }, [showAiPanel]);

  // Cleanup abort on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // AI write handler
  // ---------------------------------------------------------------------------

  const handleWriteWithAI = useCallback(async () => {
    if (!editor || !aiPrompt.trim() || isStreaming) return;

    setAiError(null);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    // Save existing content as context; then clear editor for streaming output
    const existingContent = editor.getText();

    try {
      // Place cursor at end and begin inserting streamed HTML chunks
      editor.commands.setContent("");
      let accumulated = "";

      for await (const delta of streamKimiResponse(
        aiPrompt,
        existingContent,
        controller.signal,
      )) {
        accumulated += delta;
        // Update editor with accumulated content so far
        editor.commands.setContent(accumulated);
        // Move cursor to end
        editor.commands.setTextSelection(editor.state.doc.content.size);
      }

      // Notify parent of final content
      onChange?.(editor.getHTML());
      setShowAiPanel(false);
      setAiPrompt("");
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        // User cancelled — keep whatever was streamed
      } else {
        setAiError((err as Error)?.message ?? "An unexpected error occurred.");
        // Restore the original content if nothing was written
        if (editor.getText() === "") {
          editor.commands.setContent(value ?? "");
        }
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [editor, aiPrompt, isStreaming, onChange, value]);

  const handleStopStreaming = () => {
    abortRef.current?.abort();
  };

  const handleAiKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleWriteWithAI();
    }
    if (e.key === "Escape") {
      setShowAiPanel(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Template inserts
  // ---------------------------------------------------------------------------

  const handleInsertTemplate = (type: TemplateType) => {
    if (!editor) return;

    switch (type) {
      case "goal":
        editor
          .chain()
          .focus()
          .insertContent(
            "<p><strong>Goal:</strong></p><p>Write the primary goal here...</p>",
          )
          .run();
        break;
      case "scope":
        editor
          .chain()
          .focus()
          .insertContent([
            {
              type: "paragraph",
              content: [{ type: "text", marks: [{ type: "bold" }], text: "Scope:" }],
            },
            {
              type: "taskList",
              content: [
                {
                  type: "taskItem",
                  attrs: { checked: false },
                  content: [
                    { type: "paragraph", content: [{ type: "text", text: "In scope item 1" }] },
                  ],
                },
                {
                  type: "taskItem",
                  attrs: { checked: false },
                  content: [
                    { type: "paragraph", content: [{ type: "text", text: "In scope item 2" }] },
                  ],
                },
              ],
            },
          ])
          .run();
        break;
      case "inScope":
        editor
          .chain()
          .focus()
          .insertContent([
            {
              type: "paragraph",
              content: [{ type: "text", marks: [{ type: "bold" }], text: "Scope:" }],
            },
            {
              type: "taskList",
              content: [
                {
                  type: "taskItem",
                  attrs: { checked: false },
                  content: [
                    { type: "paragraph", content: [{ type: "text", text: "In scope item" }] },
                  ],
                },
              ],
            },
          ])
          .run();
        break;
      case "outScope":
        editor
          .chain()
          .focus()
          .insertContent([
            {
              type: "paragraph",
              content: [{ type: "text", marks: [{ type: "bold" }], text: "Out of Scope:" }],
            },
            {
              type: "taskList",
              content: [
                {
                  type: "taskItem",
                  attrs: { checked: false },
                  content: [{ type: "paragraph", content: [] }],
                },
              ],
            },
          ])
          .run();
        break;
      case "outcomes":
        editor
          .chain()
          .focus()
          .insertContent(
            "<p><strong>Expected Outcomes:</strong></p><ol><li><p></p></li></ol>",
          )
          .run();
        break;
      case "feature":
        editor
          .chain()
          .focus()
          .insertContent(
            "<p><strong>Key feature:</strong></p><ul><li><p></p></li></ul>",
          )
          .run();
        break;
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full rounded-lg group transition-all duration-300 ease-in-out flex flex-col overflow-hidden",
        isExpanded
          ? "flex-1 min-h-0"
          : isFocused
            ? "h-70 shrink-0"
            : "h-30 shrink-0",
        className,
      )}
    >
      {(isFocused || isExpanded) && (
        <div className="absolute border border-primary border-solid inset-0 pointer-events-none rounded-lg z-20" />
      )}

      <div
        className={cn(
          "size-full flex flex-col relative transition-colors",
          isFocused || isExpanded
            ? "p-3.5 gap-1 bg-background"
            : "bg-muted/10 hover:bg-muted/20 rounded-lg cursor-text",
        )}
        onClick={() => {
          if (!isFocused) {
            setIsFocused(true);
            editor?.commands.focus();
          }
        }}
      >
        {/* Editor area */}
        <div
          className={cn(
            "flex grow relative w-full overflow-y-auto",
            isFocused || isExpanded ? "items-start" : "h-full items-center",
          )}
        >
          <div className="w-full h-full">
            <EditorContent editor={editor} className="h-full" />
          </div>

          {(isFocused || isExpanded) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((prev) => !prev);
              }}
              className="absolute top-0 right-0 p-2 opacity-50 hover:opacity-100 transition-opacity z-30"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <ArrowsOutSimple className="size-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Bottom toolbar */}
        {(isFocused || isExpanded) && (
          <div className="w-full overflow-hidden shrink-0 animate-in fade-in zoom-in-95 duration-200">
            <div className="h-px w-full bg-border my-2" />

            {/* AI write panel */}
            {showAiPanel && (
              <div
                className="mb-2 rounded-lg border border-primary/30 bg-primary/5 p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <StarFour
                      weight="fill"
                      className="size-3.5 text-primary shrink-0"
                    />
                    <span className="text-xs font-semibold text-foreground">
                      Write with AI
                    </span>
                  </div>
                  {!isStreaming && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAiPanel(false);
                        setAiError(null);
                      }}
                      className="opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                <textarea
                  ref={aiInputRef}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={handleAiKeyDown}
                  placeholder="Describe what you want to write... e.g. &ldquo;Write a goal and scope for a mobile app redesign sprint&rdquo;"
                  disabled={isStreaming}
                  rows={2}
                  className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                />

                {aiError && (
                  <p className="text-xs text-destructive leading-snug">{aiError}</p>
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {isStreaming ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block size-1.5 rounded-full bg-primary animate-pulse" />
                        Generating...
                      </span>
                    ) : (
                      <>
                        <kbd className="rounded border bg-muted px-1 py-0.5">⌘</kbd>
                        {" + "}
                        <kbd className="rounded border bg-muted px-1 py-0.5">↵</kbd>
                        {" to generate"}
                      </>
                    )}
                  </span>

                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={handleStopStreaming}
                      className="flex items-center gap-1 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
                    >
                      <StopCircle className="size-3.5" />
                      Stop
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleWriteWithAI}
                      disabled={!aiPrompt.trim()}
                      className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <StarFour weight="fill" className="size-3" />
                      Generate
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Template buttons row */}
            <div className="flex flex-wrap gap-2 items-center w-full">
              {showTemplates && (
                <>
                  {!existingSections.goal && (
                    <button
                      type="button"
                      onClick={() => handleInsertTemplate("goal")}
                      className="flex gap-1.5 items-center opacity-60 hover:opacity-100 hover:bg-muted/50 px-2 py-1 rounded transition-all"
                    >
                      <Plus className="size-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground text-xs">
                        Goal
                      </span>
                    </button>
                  )}

                  {!existingSections.scope && (
                    <button
                      type="button"
                      onClick={() => handleInsertTemplate("scope")}
                      className="flex gap-1.5 items-center opacity-60 hover:opacity-100 hover:bg-muted/50 px-2 py-1 rounded transition-all"
                    >
                      <Plus className="size-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground text-xs">
                        Scope
                      </span>
                    </button>
                  )}

                  {!existingSections.scope && (
                    <button
                      type="button"
                      onClick={() => handleInsertTemplate("inScope")}
                      className="flex gap-1.5 items-center opacity-60 hover:opacity-100 hover:bg-muted/50 px-2 py-1 rounded transition-all"
                    >
                      <Plus className="size-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground text-xs">
                        In scope
                      </span>
                    </button>
                  )}

                  {!existingSections.outcomes && (
                    <button
                      type="button"
                      onClick={() => handleInsertTemplate("outcomes")}
                      className="flex gap-1.5 items-center opacity-60 hover:opacity-100 hover:bg-muted/50 px-2 py-1 rounded transition-all"
                    >
                      <Plus className="size-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground text-xs">
                        Outcomes
                      </span>
                    </button>
                  )}

                  {!existingSections.outScope && (
                    <button
                      type="button"
                      onClick={() => handleInsertTemplate("outScope")}
                      className="flex gap-1.5 items-center opacity-60 hover:opacity-100 hover:bg-muted/50 px-2 py-1 rounded transition-all"
                    >
                      <Plus className="size-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground text-xs">
                        Out of scope
                      </span>
                    </button>
                  )}

                  {!existingSections.feature && (
                    <button
                      type="button"
                      onClick={() => handleInsertTemplate("feature")}
                      className="flex gap-1.5 items-center opacity-60 hover:opacity-100 hover:bg-muted/50 px-2 py-1 rounded transition-all"
                    >
                      <Plus className="size-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground text-xs">
                        Key feature
                      </span>
                    </button>
                  )}
                </>
              )}

              <div className="flex-1" />

              {/* Write with AI toggle button */}
              <div className="flex flex-col items-center justify-center ml-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAiPanel((prev) => !prev);
                    setAiError(null);
                  }}
                  className={cn(
                    "flex gap-1.5 h-7 items-center px-3 py-0.5 rounded-full transition-colors cursor-pointer",
                    showAiPanel
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted-foreground/8 hover:bg-muted-foreground/20",
                  )}
                >
                  <div className="size-3.5">
                    <StarFour
                      weight="fill"
                      className={cn(
                        "size-3.5",
                        showAiPanel ? "text-primary-foreground" : "text-primary",
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "font-medium text-xs tracking-wide",
                      showAiPanel ? "text-primary-foreground" : "text-foreground",
                    )}
                  >
                    Write with AI
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
