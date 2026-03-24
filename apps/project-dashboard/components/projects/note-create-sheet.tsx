"use client"

import { useEffect, useState } from "react"
import { Paperclip, Microphone, UploadSimple, Tag, Sparkle } from "@phosphor-icons/react/dist/ssr"
import { EditorState, SerializedEditorState, $getRoot } from "lexical"

import type { User, ProjectNote } from "@/lib/data/project-details"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Editor } from "@/components/blocks/editor-00/editor"

type NoteCreateSheetProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentUser: User
    editingNote?: ProjectNote | null
    onCreateNote: (title: string, content: string) => void
    onUpdateNote?: (noteId: string, title: string, content: string) => void
    onUploadAudio: () => void
    isPending?: boolean
}

export function NoteCreateSheet({
    open,
    onOpenChange,
    currentUser,
    editingNote,
    onCreateNote,
    onUpdateNote,
    onUploadAudio,
    isPending,
}: NoteCreateSheetProps) {
    const [title, setTitle] = useState("")
    const [plainContent, setPlainContent] = useState("")
    const [editorSerializedState, setEditorSerializedState] = useState<SerializedEditorState>(
        createSerializedEditorState(""),
    )
    const isEditing = Boolean(editingNote)

    useEffect(() => {
        if (!open) return

        const initialContent = editingNote?.content ?? ""

        if (editingNote) {
            setTitle(editingNote.title)
        } else {
            setTitle("")
        }

        setPlainContent(initialContent)
        setEditorSerializedState(createSerializedEditorState(initialContent))
    }, [open, editingNote])

    const handleClose = () => {
        onOpenChange(false)
        setTitle("")
        setPlainContent("")
        setEditorSerializedState(createSerializedEditorState(""))
    }

    const handleSubmit = () => {
        if (isEditing && editingNote && onUpdateNote) {
            onUpdateNote(editingNote.id, title, plainContent)
        } else {
            onCreateNote(title, plainContent)
        }
        handleClose()
    }

    const handleUploadClick = () => {
        onUploadAudio()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault()
            handleSubmit()
        }
    }

    const handleEditorChange = (editorState: EditorState) => {
        const text = editorState.read(() => $getRoot().getTextContent())
        setPlainContent(text)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-[600px] p-0 gap-0 overflow-hidden flex flex-col [&>[data-slot=sheet-close]]:hidden"
                onKeyDown={handleKeyDown}
            >
                <SheetHeader className="sr-only">
                    <SheetTitle>{isEditing ? "Edit Note" : "Create Note"}</SheetTitle>
                </SheetHeader>

                {/* Header */}
                <div className="flex items-center p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Sparkle className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">
                                {isEditing ? "Edit Note" : "Create Note"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {isEditing ? "Update your note details" : "Add a new note to your project"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Title Input */}
                    <div className="space-y-2">
                        <Label htmlFor="note-title">Title</Label>
                        <Input
                            id="note-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter note title..."
                            className="text-lg"
                            autoComplete="off"
                        />
                    </div>

                    {/* Content Editor */}
                    <div className="space-y-2 flex-1 flex flex-col">
                        <Label>Content</Label>
                        <Editor
                            editorSerializedState={editorSerializedState}
                            onChange={handleEditorChange}
                            onSerializedChange={setEditorSerializedState}
                            className="min-h-[220px] px-0"
                        />
                    </div>

                    {/* Note Context */}
                    <div className="flex items-center gap-2 pt-4 border-t border-border">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/50">
                            <Avatar className="h-5 w-5">
                                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                                <AvatarFallback className="text-[10px]">
                                    {currentUser.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{currentUser.name}</span>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">General note</span>
                        </div>
                    </div>
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

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleUploadClick}>
                            <UploadSimple className="h-4 w-4 mr-2" />
                            Upload audio
                        </Button>
                        <Button size="sm" onClick={handleSubmit} disabled={isPending || !title.trim()}>
                            {isEditing ? "Update Note" : "Create Note"}
                        </Button>
                    </div>
                </div>

                {/* Keyboard shortcut hint */}
                <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex items-center justify-end gap-1">
                    <span>Press</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Enter</kbd>
                    <span>to save</span>
                </div>
            </SheetContent>
        </Sheet>
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
