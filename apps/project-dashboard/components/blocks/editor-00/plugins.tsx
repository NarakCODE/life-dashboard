"use client"

import { useState } from "react"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"

import { ContentEditable } from "@/components/editor/editor-ui/content-editable"
import { Toolbar } from "@/components/editor/toolbar/toolbar"

export function Plugins() {
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null)

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

  return (
    <div className="relative flex flex-col">
      {/* Toolbar */}
      <Toolbar />
      
      {/* Content Area */}
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <div className="">
              <div className="" ref={onRef}>
                <ContentEditable placeholder={"Start typing ..."} />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
      
      {/* List Plugin for bullet and numbered lists */}
      <ListPlugin />
      
      {/* History Plugin for undo/redo */}
      <HistoryPlugin />
    </div>
  )
}
