"use client"

import { useState, useCallback, useEffect } from "react"
import { SerializedEditorState, SerializedLexicalNode } from "lexical"
import { cn } from "@/lib/utils"
import { Editor } from "@/components/blocks/editor-md/editor"
import { Button } from "@/components/ui/button"
import { ArrowsOutSimple, ArrowsInSimple } from "@phosphor-icons/react/dist/ssr"

// Empty editor state
export const emptyEditorState: SerializedEditorState = {
  root: {
    children: [
      {
        children: [],
        direction: null,
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      } as SerializedLexicalNode,
    ],
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
}

// Helper to create a text node
function createTextNode(text: string): SerializedLexicalNode {
  return {
    detail: 0,
    format: 0,
    mode: "normal",
    style: "",
    text,
    type: "text",
    version: 1,
  } as SerializedLexicalNode
}

// Helper to create a paragraph node
function createParagraphNode(text: string): SerializedLexicalNode {
  return {
    children: text ? [createTextNode(text)] : [],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "paragraph",
    version: 1,
  } as SerializedLexicalNode
}

// Helper to convert HTML to initial editor state (simplified)
function htmlToInitialState(html: string): SerializedEditorState {
  if (!html || html === "<p></p>" || html === "<p><br></p>") {
    return emptyEditorState
  }

  // For SSR safety, check for window
  if (typeof window === "undefined") {
    return emptyEditorState
  }

  // Create a temporary div to parse HTML
  const div = document.createElement("div")
  div.innerHTML = html

  const children: SerializedLexicalNode[] = []

  div.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      const tagName = el.tagName.toLowerCase()

      if (tagName === "p") {
        children.push(createParagraphNode(el.textContent || ""))
      } else if (tagName === "h1") {
        children.push({
          children: [createTextNode(el.textContent || "")],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "heading",
          tag: "h1",
          version: 1,
        } as SerializedLexicalNode)
      } else if (tagName === "h2") {
        children.push({
          children: [createTextNode(el.textContent || "")],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "heading",
          tag: "h2",
          version: 1,
        } as SerializedLexicalNode)
      } else if (tagName === "h3") {
        children.push({
          children: [createTextNode(el.textContent || "")],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "heading",
          tag: "h3",
          version: 1,
        } as SerializedLexicalNode)
      } else if (tagName === "ul" || tagName === "ol") {
        const listType = tagName === "ul" ? "bullet" : "number"
        const listItems: SerializedLexicalNode[] = []
        el.querySelectorAll("li").forEach((li) => {
          listItems.push({
            children: [createParagraphNode(li.textContent || "")],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "listitem",
            version: 1,
            value: 1,
          } as SerializedLexicalNode)
        })
        children.push({
          children: listItems,
          direction: "ltr",
          format: "",
          indent: 0,
          type: "list",
          listType,
          start: 1,
          tag: tagName,
          version: 1,
        } as SerializedLexicalNode)
      } else if (tagName === "blockquote") {
        children.push({
          children: [createParagraphNode(el.textContent || "")],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "quote",
          version: 1,
        } as SerializedLexicalNode)
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim()
      if (text) {
        children.push(createParagraphNode(text))
      }
    }
  })

  if (children.length === 0) {
    return emptyEditorState
  }

  return {
    root: {
      children,
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  }
}

interface LexicalDescriptionEditorProps {
  value?: string
  onChange?: (value: string) => void
  onFocusChange?: (isFocused: boolean) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export function LexicalDescriptionEditor({
  value,
  onChange,
  onFocusChange,
  placeholder = "Enter description...",
  className,
  minHeight = "150px",
}: LexicalDescriptionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Parse initial value from HTML
  const [editorState, setEditorState] = useState<SerializedEditorState>(emptyEditorState)

  // Mount effect to avoid SSR issues
  useEffect(() => {
    setIsMounted(true)
    if (value) {
      setEditorState(htmlToInitialState(value))
    }
  }, [])

  // Notify parent of focus changes
  useEffect(() => {
    onFocusChange?.(isFocused)
  }, [isFocused, onFocusChange])

  // Handle editor changes
  const handleSerializedChange = useCallback(
    (newState: SerializedEditorState) => {
      setEditorState(newState)

      // Convert to HTML for backward compatibility
      const html = editorStateToHtml(newState)
      onChange?.(html)
    },
    [onChange]
  )

  // Simple converter from editor state to HTML
  function editorStateToHtml(state: SerializedEditorState): string {
    const root = state.root
    if (!root.children || root.children.length === 0) {
      return "<p></p>"
    }

    const parts: string[] = []

    root.children.forEach((node: SerializedLexicalNode) => {
      const n = node as unknown as { 
        type: string
        children?: unknown[] 
        tag?: string 
        text?: string
        listType?: string
      }

      switch (n.type) {
        case "paragraph":
          const text = extractText(n.children)
          parts.push(`<p>${text}</p>`)
          break
        case "heading":
          const tag = n.tag || "h2"
          parts.push(`<${tag}>${extractText(n.children)}</${tag}>`)
          break
        case "list":
          const listTag = n.listType === "number" ? "ol" : "ul"
          const items = (n.children || [])
            .map((item: unknown) => {
              const li = item as { children?: unknown[] }
              return `<li>${extractText(li.children)}</li>`
            })
            .join("")
          parts.push(`<${listTag}>${items}</${listTag}>`)
          break
        case "quote":
          parts.push(`<blockquote>${extractText(n.children)}</blockquote>`)
          break
        default:
          if (n.text) {
            parts.push(`<p>${n.text}</p>`)
          }
      }
    })

    return parts.join("") || "<p></p>"
  }

  function extractText(children: unknown[] | undefined): string {
    if (!children) return ""
    return children
      .map((child: unknown) => {
        const c = child as { text?: string; children?: unknown[] }
        if (c.text) return c.text
        if (c.children) return extractText(c.children)
        return ""
      })
      .join("")
  }

  // Check if content is empty
  const isEmpty = !editorState.root.children?.some(
    (child: SerializedLexicalNode) => {
      const c = child as unknown as { children?: unknown[]; text?: string }
      return (c.children?.length ?? 0) > 0 || c.text
    }
  )

  if (!isMounted) {
    return (
      <div 
        className={cn(
          "rounded-lg border bg-background animate-pulse",
          className
        )}
        style={{ minHeight }}
      />
    )
  }

  return (
    <div
      className={cn(
        "relative rounded-lg border transition-all duration-200",
        isFocused ? "ring-2 ring-ring ring-offset-2" : "",
        isExpanded ? "fixed inset-4 z-50 bg-background" : "",
        className
      )}
    >
      {/* Expand/Collapse Button */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 w-8 opacity-50 hover:opacity-100"
        >
          {isExpanded ? (
            <ArrowsInSimple className="h-4 w-4" />
          ) : (
            <ArrowsOutSimple className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Editor Container */}
      <div
        className={cn(
          "overflow-hidden",
          isExpanded ? "h-full" : ""
        )}
        style={{ minHeight: isExpanded ? undefined : minHeight }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <Editor
          editorSerializedState={editorState}
          onSerializedChange={handleSerializedChange}
        />
      </div>

      {/* Placeholder overlay when empty */}
      {isEmpty && (
        <div className="absolute top-12 left-8 text-muted-foreground pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  )
}
