"use client"

import { useCallback, useEffect, useState } from "react"
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  UndoIcon,
  RedoIcon,
  Heading1Icon,
  Heading2Icon,
} from "lucide-react"
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from "lexical"
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, HeadingNode, QuoteNode } from "@lexical/rich-text"
import { $createListItemNode, $createListNode, $isListItemNode, ListItemNode } from "@lexical/list"
import { mergeRegister, $getNearestNodeOfType } from "@lexical/utils"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Toggle } from "@/components/ui/toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function Toolbar() {
  const [editor] = useLexicalComposerContext()

  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isBulletList, setIsBulletList] = useState(false)
  const [isNumberedList, setIsNumberedList] = useState(false)
  const [isQuote, setIsQuote] = useState(false)
  const [headingLevel, setHeadingLevel] = useState<number | null>(null)

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      // Update text format states
      setIsBold(selection.hasFormat("bold"))
      setIsItalic(selection.hasFormat("italic"))
      setIsUnderline(selection.hasFormat("underline"))
      setIsStrikethrough(selection.hasFormat("strikethrough"))

      // Update list states
      const anchorNode = selection.anchor.getNode()
      const listItem = $getNearestNodeOfType(anchorNode, ListItemNode)
      if (listItem) {
        const list = listItem.getParent()
        if (list) {
          const listType = list.getListType()
          setIsBulletList(listType === "bullet")
          setIsNumberedList(listType === "number")
        }
      } else {
        setIsBulletList(false)
        setIsNumberedList(false)
      }

      // Update quote state
      const quoteNode = $getNearestNodeOfType(anchorNode, QuoteNode)
      setIsQuote(quoteNode !== null)

      // Update heading state
      const element = anchorNode.getKey() === "root" ? anchorNode : anchorNode.getTopLevelElementOrThrow()
      const elementNode = $getNearestNodeOfType(element, HeadingNode)
      
      if (elementNode && $isHeadingNode(elementNode)) {
        const tag = elementNode.getTag()
        setHeadingLevel(parseInt(tag.replace("h", "")))
      } else {
        setHeadingLevel(null)
      }
    }
  }, [editor])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar()
        })
      }),
    )
  }, [editor, $updateToolbar])

  const toggleBold = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")
  }, [editor])

  const toggleItalic = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
  }, [editor])

  const toggleUnderline = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
  }, [editor])

  const toggleStrikethrough = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
  }, [editor])

  const toggleBulletList = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode()
        const listItem = $getNearestNodeOfType(anchorNode, ListItemNode)
        
        if (listItem && isBulletList) {
          // Remove list - convert back to paragraph
          const paragraph = $createParagraphNode()
          paragraph.append(...listItem.getChildren())
          listItem.replace(paragraph)
        } else {
          // Create bullet list
          const topNodes = selection.getNodes()
          topNodes.forEach(node => {
            if (node.getType() === "paragraph") {
              const listItem = $createListItemNode()
              listItem.append(...node.getChildren())
              const list = $createListNode("bullet")
              list.append(listItem)
              node.replace(list)
            } else if ($isListItemNode(node)) {
              const parent = node.getParent()
              if (parent && parent.getType() === "list" && parent.getListType() !== "bullet") {
                parent.setListType("bullet")
              }
            }
          })
        }
      }
    })
  }, [editor, isBulletList])

  const toggleNumberedList = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode()
        const listItem = $getNearestNodeOfType(anchorNode, ListItemNode)
        
        if (listItem && isNumberedList) {
          // Remove list - convert back to paragraph
          const paragraph = $createParagraphNode()
          paragraph.append(...listItem.getChildren())
          listItem.replace(paragraph)
        } else {
          // Create numbered list
          const topNodes = selection.getNodes()
          topNodes.forEach(node => {
            if (node.getType() === "paragraph") {
              const listItem = $createListItemNode()
              listItem.append(...node.getChildren())
              const list = $createListNode("number")
              list.append(listItem)
              node.replace(list)
            } else if ($isListItemNode(node)) {
              const parent = node.getParent()
              if (parent && parent.getType() === "list" && parent.getListType() !== "number") {
                parent.setListType("number")
              }
            }
          })
        }
      }
    })
  }, [editor, isNumberedList])

  const toggleQuote = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode()
        const quoteNode = $getNearestNodeOfType(anchorNode, QuoteNode)
        
        if (quoteNode) {
          // Remove quote - convert back to paragraph
          const paragraph = $createParagraphNode()
          paragraph.append(...quoteNode.getChildren())
          quoteNode.replace(paragraph)
        } else {
          // Create quote
          const topNodes = selection.getNodes()
          topNodes.forEach(node => {
            if (node.getType() === "paragraph") {
              const quote = $createQuoteNode()
              quote.append(...node.getChildren())
              node.replace(quote)
            }
          })
        }
      }
    })
  }, [editor, isQuote])

  const setHeading = useCallback((level: 1 | 2 | 3 | 4 | 5 | 6 | null) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode()
        const element = anchorNode.getKey() === "root" ? anchorNode : anchorNode.getTopLevelElementOrThrow()
        const elementNode = $getNearestNodeOfType(element, HeadingNode)
        
        if (level) {
          if (elementNode && elementNode.getTag() === `h${level}`) {
            // Toggle off - convert to paragraph
            const paragraph = $createParagraphNode()
            paragraph.append(...elementNode.getChildren())
            elementNode.replace(paragraph)
          } else if (elementNode) {
            // Change heading level
            elementNode.setTag(`h${level}`)
          } else {
            // Convert paragraph to heading
            if (element.getType() === "paragraph") {
              const heading = $createHeadingNode(`h${level}`)
              heading.append(...element.getChildren())
              element.replace(heading)
            }
          }
        } else if (elementNode) {
          // Convert heading to paragraph
          const paragraph = $createParagraphNode()
          paragraph.append(...elementNode.getChildren())
          elementNode.replace(paragraph)
        }
      }
    })
  }, [editor])

  const undo = useCallback(() => {
    editor.dispatchCommand(UNDO_COMMAND, undefined)
  }, [editor])

  const redo = useCallback(() => {
    editor.dispatchCommand(REDO_COMMAND, undefined)
  }, [editor])

  return (
    <div className={cn("sticky top-0 z-10 border-b border-border bg-background px-2 py-1.5")}>
      <div className="flex flex-wrap items-center gap-1">
        {/* Headings */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              pressed={headingLevel === 1}
              onPressedChange={() => setHeading(headingLevel === 1 ? null : 1)}
              className="h-8 w-8 p-0"
            >
              <Heading1Icon className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>H1</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              pressed={headingLevel === 2}
              onPressedChange={() => setHeading(headingLevel === 2 ? null : 2)}
              className="h-8 w-8 p-0"
            >
              <Heading2Icon className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>H2</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Text Formatting */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              pressed={isBold}
              onPressedChange={toggleBold}
              className="h-8 w-8 p-0"
            >
              <BoldIcon className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Bold</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              pressed={isItalic}
              onPressedChange={toggleItalic}
              className="h-8 w-8 p-0"
            >
              <ItalicIcon className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Italic</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              pressed={isUnderline}
              onPressedChange={toggleUnderline}
              className="h-8 w-8 p-0"
            >
              <UnderlineIcon className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Underline</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              pressed={isStrikethrough}
              onPressedChange={toggleStrikethrough}
              className="h-8 w-8 p-0"
            >
              <StrikethroughIcon className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Strikethrough</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              pressed={isBulletList}
              onPressedChange={toggleBulletList}
              className="h-8 w-8 p-0"
            >
              <ListIcon className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Bullet List</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              pressed={isNumberedList}
              onPressedChange={toggleNumberedList}
              className="h-8 w-8 p-0"
            >
              <ListOrderedIcon className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Numbered List</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              pressed={isQuote}
              onPressedChange={toggleQuote}
              className="h-8 w-8 p-0"
            >
              <QuoteIcon className="h-4 w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Quote</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Undo/Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              className="h-8 w-8 p-0"
            >
              <UndoIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              className="h-8 w-8 p-0"
            >
              <RedoIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
