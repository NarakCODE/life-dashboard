"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  DotsThree,
  PencilSimple,
  Export,
  CaretDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  CircleNotch,
  Trash,
} from "@phosphor-icons/react/dist/ssr";
import { format } from "date-fns";

import type {
  ProjectNote,
  TranscriptSegment,
} from "@/lib/data/project-details";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/ui/typography";

const WAVEFORM_BAR_HEIGHTS = Array.from({ length: 60 }, (_, i) => {
  const base = [25, 60, 40, 80, 55, 70, 35, 90];
  return base[i % base.length];
});

type NoteDetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: ProjectNote | null;
  onDelete?: (noteId: string) => void;
  onUpdate?: (noteId: string, title: string, content: string) => void;
};

import { NoteEditor } from "./note-editor";

export function NoteDetailsSheet({
  open,
  onOpenChange,
  note,
  onDelete,
  onUpdate,
}: NoteDetailsSheetProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [keyPointsOpen, setKeyPointsOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");

  // Update local state when note changes
  useEffect(() => {
    if (note) {
      setEditedTitle(note.title);
      setEditedContent(note.content || "");
    }
  }, [note]);

  if (!note) return null;

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(note.id, editedTitle, editedContent);
    }
    setIsEditing(false);
  };

  const isAudioNote = note.noteType === "audio" && note.audioData;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[900px] p-0 gap-0 overflow-hidden"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Note Details</SheetTitle>
        </SheetHeader>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3 flex-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onOpenChange(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-2 group">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 w-full"
                      autoFocus
                    />
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold">{note.title}</h2>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setIsEditing(true)}
                      >
                        <PencilSimple className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {note.createdAt
                    ? format(new Date(note.createdAt), "MMMM d, yyyy")
                    : "—"}{" "}
                  ·{" "}
                  {note.createdAt
                    ? format(new Date(note.createdAt), "h:mm a")
                    : "—"}{" "}
                  · Translate
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <DotsThree className="h-4 w-4" weight="bold" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <PencilSimple className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => note && onDelete?.(note.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm">
                    <Export className="h-4 w-4 mr-2" />
                    Share notes
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
            <div
              className={cn(
                "flex-1 flex flex-col overflow-hidden",
                isAudioNote ? "sm:border-r border-border" : "",
              )}
            >
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isAudioNote && note.audioData ? (
                  <>
                    <CollapsibleSection
                      title="AI Summary"
                      icon={<CircleNotch className="h-4 w-4" />}
                      open={summaryOpen}
                      onOpenChange={setSummaryOpen}
                    >
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {note.audioData.aiSummary}
                      </p>
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Key Points"
                      icon={<CircleNotch className="h-4 w-4" />}
                      open={keyPointsOpen}
                      onOpenChange={setKeyPointsOpen}
                    >
                      <ul className="space-y-2">
                        {note.audioData.keyPoints.map((point, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            • {point}
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="All Insights"
                      icon={<CircleNotch className="h-4 w-4" />}
                      open={insightsOpen}
                      onOpenChange={setInsightsOpen}
                    >
                      <ul className="space-y-2">
                        {note.audioData.insights.map((insight, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            • {insight}
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                  </>
                ) : (
                  <div className="flex h-full min-h-100 flex-col pb-6">
                    {isEditing ? (
                      <NoteEditor
                        initialContent={note.content || ""}
                        className="flex-1 min-h-100"
                        onChange={setEditedContent}
                      />
                    ) : (
                      <div 
                        className="cursor-pointer hover:bg-muted/5 rounded-lg p-2 transition-colors -m-2"
                        onClick={() => setIsEditing(true)}
                      >
                        <Markdown
                          content={
                            note.content ||
                            "<p>No content available for this note.</p>"
                          }
                          size="sm"
                          className="text-muted-foreground"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isAudioNote && note.audioData && (
              <div className="w-full sm:w-[350px] flex flex-col bg-muted/30 border-t sm:border-t-0 border-border">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold">Transcript</h3>
                </div>

                <div className="m-4 p-4 rounded-lg border border-border bg-background">
                  <div className="text-center mb-4">
                    <span className="text-sm font-medium">
                      {note.audioData.duration}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Button variant="ghost" size="icon-sm">
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="default"
                      size="icon"
                      className="rounded-full"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" weight="fill" />
                      ) : (
                        <Play className="h-4 w-4" weight="fill" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon-sm">
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="h-12 flex items-center justify-center gap-[2px]">
                    {WAVEFORM_BAR_HEIGHTS.map((height, i) => (
                      <div
                        key={i}
                        className="w-1 bg-muted-foreground/20 rounded-full"
                        style={{
                          height: `${height}%`,
                          minHeight: "4px",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4">
                  {note.audioData.transcript.map((segment) => (
                    <TranscriptRow
                      key={segment.id}
                      segment={segment}
                      isActive={activeSegment === segment.id}
                      onClick={() => setActiveSegment(segment.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

type CollapsibleSectionProps = {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

function CollapsibleSection({
  title,
  icon,
  open,
  onOpenChange,
  children,
}: CollapsibleSectionProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
          </div>
          <CaretDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

type TranscriptRowProps = {
  segment: TranscriptSegment;
  isActive: boolean;
  onClick: () => void;
};

function TranscriptRow({ segment, isActive, onClick }: TranscriptRowProps) {
  return (
    <button
      className={cn(
        "w-full text-left p-3 border-b border-border/50 hover:bg-muted/50 transition-colors",
        isActive && "bg-primary/10",
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground",
            )}
          >
            {segment.speaker}
          </span>
          <span className="text-xs text-muted-foreground">
            {segment.timestamp}
          </span>
        </div>
      </div>
      <p className="mt-1 text-sm text-foreground leading-relaxed">
        {segment.text}
      </p>
    </button>
  );
}
