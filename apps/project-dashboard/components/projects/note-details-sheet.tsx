"use client"

import { useEffect, useState } from "react"
import { EditorState, SerializedEditorState, $getRoot } from "lexical"
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
  Sparkle,
  Tag,
  Paperclip,
  Microphone,
} from "@phosphor-icons/react/dist/ssr"
import { format } from "date-fns"

import type { ProjectNote, TranscriptSegment, User } from "@/lib/data/project-details"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Editor } from "@/components/blocks/editor-00/editor"

const WAVEFORM_BAR_HEIGHTS = Array.from({ length: 60 }, (_, i) => {
  const base = [25, 60, 40, 80, 55, 70, 35, 90]
  return base[i % base.length]
})

type NoteDetailsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  note: ProjectNote | null
  currentUser?: User
  onDelete?: (noteId: string) => void
  onUpdate?: (noteId: string, title: string, content: string) => void
  isPending?: boolean
}

export function NoteDetailsSheet({
  open,
  onOpenChange,
  note,
  currentUser,
  onDelete,
  onUpdate,
  isPending,
}: NoteDetailsSheetProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeSegment, setActiveSegment] = useState<string | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(true)
  const [keyPointsOpen, setKeyPointsOpen] = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [plainContent, setPlainContent] = useState("")
  const [editorSerializedState, setEditorSerializedState] =
    useState<SerializedEditorState>(createSerializedEditorState(""))

  // Update local state when note changes
  useEffect(() => {
    if (note) {
      setEditedTitle(note.title)
      setPlainContent(note.content || "")
      setEditorSerializedState(createSerializedEditorState(note.content || ""))
    }
  }, [note])

  if (!note) return null

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(note.id, editedTitle, plainContent)
    }
    setIsEditing(false)
  }

  const handleClose = () => {
    onOpenChange(false)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      handleSave()
    }
  }

  const handleEditorChange = (editorState: EditorState) => {
    const text = editorState.read(() => $getRoot().getTextContent())
    setPlainContent(text)
  }

  const isAudioNote = note.noteType === "audio" && note.audioData

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[900px] p-0 gap-0 overflow-hidden flex flex-col [&>button]:hidden"
        onKeyDown={handleKeyDown}
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
                onClick={() => handleClose()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3 flex-1">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkle className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="text-base font-semibold bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 w-full"
                        autoFocus
                        placeholder="Note title..."
                      />
                    ) : (
                      <h2 className="text-base font-semibold truncate">
                        {note.title}
                      </h2>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {note.createdAt
                      ? format(new Date(note.createdAt), "MMMM d, yyyy '·' h:mm a")
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isEditing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={!editedTitle.trim()}>
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
                        disabled={isPending}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm">
                    <Export className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isAudioNote && note.audioData ? (
                <>
                  {/* Audio Player Section */}
                  <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-4">
                    <div className="flex items-center justify-center gap-4">
                      <Button variant="ghost" size="icon-sm">
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="icon"
                        className="rounded-full h-12 w-12"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5" weight="fill" />
                        ) : (
                          <Play className="h-5 w-5" weight="fill" />
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
                          className="w-1 bg-muted-foreground/20 rounded-full transition-all"
                          style={{
                            height: `${height}%`,
                            minHeight: "4px",
                          }}
                        />
                      ))}
                    </div>

                    <div className="text-center">
                      <span className="text-sm font-medium">
                        {note.audioData.duration}
                      </span>
                    </div>
                  </div>

                  {/* AI Summary */}
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

                  {/* Key Points */}
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

                  {/* All Insights */}
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

                  {/* Transcript */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Transcript</h3>
                    <div className="space-y-1">
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
                </>
              ) : (
                <>
                  {/* Title Display/Edit */}
                  {!isEditing && (
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold">{note.title}</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {note.createdAt
                            ? format(new Date(note.createdAt), "MMMM d, yyyy")
                            : "—"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Content Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Content</span>
                      {!isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                        >
                          <PencilSimple className="h-3.5 w-3.5 mr-1.5" />
                          Edit
                        </Button>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="border border-border rounded-lg overflow-hidden">
                        <Editor
                          editorSerializedState={editorSerializedState}
                          onChange={handleEditorChange}
                          onSerializedChange={setEditorSerializedState}
                          className="min-h-[400px]"
                        />
                      </div>
                    ) : (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-lg border border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setIsEditing(true)}
                      >
                        {note.content ? (
                          <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                            {note.content}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No content available. Click to add content.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Note Metadata */}
                  <div className="flex items-center gap-2 pt-4 border-t border-border">
                    {currentUser && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/50">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                          <AvatarFallback className="text-[10px]">
                            {currentUser.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{currentUser.name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {note.noteType === "audio" ? "Audio note" : "General note"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
                  <Microphone className="h-4 w-4" />
                </Button>
              </div>

              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={!editedTitle.trim() || isPending}>
                    Save Changes
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Export className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              )}
            </div>

            {/* Keyboard shortcut hint */}
            {isEditing && (
              <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex items-center justify-end gap-1">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Enter</kbd>
                <span>to save</span>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

type CollapsibleSectionProps = {
  title: string
  icon: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

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
            <span className="font-medium text-sm">{title}</span>
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
  )
}

type TranscriptRowProps = {
  segment: TranscriptSegment
  isActive: boolean
  onClick: () => void
}

function TranscriptRow({ segment, isActive, onClick }: TranscriptRowProps) {
  return (
    <button
      className={cn(
        "w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors",
        isActive && "bg-primary/10",
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-1">
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
        <span className="text-xs text-muted-foreground">{segment.timestamp}</span>
      </div>
      <p className="text-sm text-foreground leading-relaxed">{segment.text}</p>
    </button>
  )
}

function createSerializedEditorState(text: string): SerializedEditorState {
  const paragraphs = text
    .split("\n")
    .map((line) => createParagraph(line))
    .filter((paragraph) => paragraph.children.length > 0)

  return {
    root: {
      children: paragraphs.length ? paragraphs : [createParagraph("")],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  } as SerializedEditorState
}

function createParagraph(line: string) {
  return {
    children: [
      {
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
        text: line,
        type: "text",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "paragraph",
    version: 1,
  }
}
