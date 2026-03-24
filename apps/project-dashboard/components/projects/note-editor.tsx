"use client"

import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { 
  $convertFromMarkdownString, 
  $convertToMarkdownString, 
  TRANSFORMERS 
} from "@lexical/markdown"
import { ListNode, ListItemNode } from "@lexical/list"
import { CodeNode } from "@lexical/code"
import { AutoLinkNode, LinkNode } from "@lexical/link"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useEffect } from "react"
import { EditorState } from "lexical"

import { editorTheme } from "@/components/editor/themes/editor-theme"
import { ContentEditable } from "@/components/editor/editor-ui/content-editable"
import { nodes as baseNodes } from "@/components/blocks/editor-00/nodes"
import { cn } from "@/lib/utils"

const editorConfig: InitialConfigType = {
  namespace: "NoteEditor",
  theme: editorTheme,
  nodes: [...baseNodes, ListNode, ListItemNode, CodeNode, AutoLinkNode, LinkNode],
  onError: (error: Error) => {
    console.error(error)
  },
}

interface NoteEditorProps {
  initialContent: string
  onChange: (markdown: string) => void
  className?: string
}

function InitialContentPlugin({ initialContent }: { initialContent: string }) {
  const [editor] = useLexicalComposerContext()
  
  useEffect(() => {
    editor.update(() => {
      $convertFromMarkdownString(initialContent, TRANSFORMERS)
    })
  }, [editor, initialContent])

  return null
}

export function NoteEditor({ initialContent, onChange, className }: NoteEditorProps) {
  return (
    <LexicalComposer
      initialConfig={{
        ...editorConfig,
      }}
    >
      <div className={cn("relative h-full", className)}>
        <InitialContentPlugin initialContent={initialContent} />
        <RichTextPlugin
          contentEditable={
            <ContentEditable 
              placeholder="Start typing your note..." 
              className="min-h-50 outline-none prose prose-sm max-w-none focus:outline-none"
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <OnChangePlugin
          onChange={(editorState: EditorState) => {
            editorState.read(() => {
              const markdown = $convertToMarkdownString(TRANSFORMERS)
              onChange(markdown)
            })
          }}
        />
      </div>
    </LexicalComposer>
  )
}
