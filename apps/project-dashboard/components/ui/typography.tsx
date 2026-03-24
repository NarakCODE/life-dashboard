"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// ============================================================================
// Typography Components
// Following shadcn/ui design system with radix base
// ============================================================================

// ----------------------------------------------------------------------------
// Heading Components
// ----------------------------------------------------------------------------

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, as: Component = "h1", ...props }, ref) => {
    const variantStyles = {
      h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
      h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
      h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
      h4: "scroll-m-20 text-xl font-semibold tracking-tight",
      h5: "scroll-m-20 text-lg font-semibold tracking-tight",
      h6: "scroll-m-20 text-base font-semibold tracking-tight",
    }

    return (
      <Component
        ref={ref}
        className={cn(variantStyles[Component], className)}
        {...props}
      />
    )
  }
)
Heading.displayName = "Heading"

// ----------------------------------------------------------------------------
// Text Components
// ----------------------------------------------------------------------------

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: "default" | "lead" | "large" | "small" | "muted"
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantStyles = {
      default: "leading-7",
      lead: "text-xl text-muted-foreground",
      large: "text-lg font-semibold",
      small: "text-sm font-medium leading-none",
      muted: "text-sm text-muted-foreground",
    }

    return (
      <p
        ref={ref}
        className={cn(variantStyles[variant], className)}
        {...props}
      />
    )
  }
)
Text.displayName = "Text"

// ----------------------------------------------------------------------------
// Blockquote Component
// ----------------------------------------------------------------------------

const Blockquote = React.forwardRef<
  HTMLQuoteElement,
  React.HTMLAttributes<HTMLQuoteElement>
>(({ className, ...props }, ref) => (
  <blockquote
    ref={ref}
    className={cn(
      "mt-6 border-l-2 pl-6 italic text-muted-foreground",
      className
    )}
    {...props}
  />
))
Blockquote.displayName = "Blockquote"

// ----------------------------------------------------------------------------
// List Components
// ----------------------------------------------------------------------------

const Ul = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}
    {...props}
  />
))
Ul.displayName = "Ul"

const Ol = React.forwardRef<
  HTMLOListElement,
  React.HTMLAttributes<HTMLOListElement>
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn("my-6 ml-6 list-decimal [&>li]:mt-2", className)}
    {...props}
  />
))
Ol.displayName = "Ol"

const Li = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("leading-7", className)} {...props} />
))
Li.displayName = "Li"

// ----------------------------------------------------------------------------
// Inline Components
// ----------------------------------------------------------------------------

const InlineCode = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <code
    ref={ref}
    className={cn(
      "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
      className
    )}
    {...props}
  />
))
InlineCode.displayName = "InlineCode"

const Link = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => (
  <a
    ref={ref}
    className={cn(
      "font-medium text-primary underline underline-offset-4 hover:text-primary/80",
      className
    )}
    {...props}
  />
))
Link.displayName = "Link"

// ----------------------------------------------------------------------------
// Prose/Markdown Component
// This is the main component for rendering markdown content
// ----------------------------------------------------------------------------

interface ProseProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  /** Render HTML content directly (for markdown) */
  html?: string
  /** Size variant for the prose */
  size?: "sm" | "base" | "lg"
  /** Whether to invert colors for dark backgrounds */
  invert?: boolean
}

// ----------------------------------------------------------------------------
// Markdown Component (for rendering HTML content)
// ----------------------------------------------------------------------------

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"

interface MarkdownProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string
  size?: "sm" | "base" | "lg"
  invert?: boolean
}

const Markdown = React.forwardRef<HTMLDivElement, MarkdownProps>(
  ({ className, content, size = "base", invert, ...props }, ref) => {
    const sizeStyles = {
      sm: "prose-sm",
      base: "prose",
      lg: "prose-lg",
    }

    return (
      <div
        ref={ref}
        className={cn(
          // Base prose styles
          sizeStyles[size],
          // Max width
          "max-w-none",
          // Headings
          "prose-headings:scroll-m-20 prose-headings:font-semibold prose-headings:tracking-tight",
          "prose-h1:text-3xl prose-h1:font-extrabold prose-h1:lg:text-4xl",
          "prose-h2:border-b prose-h2:pb-2 prose-h2:text-2xl",
          "prose-h3:text-xl",
          "prose-h4:text-lg",
          // Paragraphs
          "prose-p:leading-7",
          // Links
          "prose-a:font-medium prose-a:text-primary prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-primary/80",
          // Lists
          "prose-ul:my-6 prose-ul:ml-6 prose-ul:list-disc",
          "prose-ol:my-6 prose-ol:ml-6 prose-ol:list-decimal",
          "prose-li:mt-2 prose-li:leading-7",
          // Blockquotes
          "prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-muted-foreground",
          // Code
          "prose-code:rounded prose-code:bg-muted prose-code:px-[0.3rem] prose-code:py-[0.2rem] prose-code:font-mono prose-code:text-sm prose-code:font-semibold",
          // Pre (code blocks)
          "prose-pre:rounded-lg prose-pre:bg-muted prose-pre:p-4",
          // Images
          "prose-img:rounded-lg prose-img:border",
          // Tables
          "prose-table:w-full prose-table:overflow-hidden prose-table:rounded-lg prose-table:border",
          "prose-thead:bg-muted prose-thead:border-b",
          "prose-th:p-3 prose-th:text-left prose-th:font-semibold prose-th:leading-none",
          "prose-td:p-3 prose-td:border-t prose-td:leading-none",
          "prose-tr:border-t first:prose-tr:border-t-0",
          // Horizontal rule
          "prose-hr:my-6 prose-hr:border",
          // Strong
          "prose-strong:font-semibold",
          // Invert variant (for dark backgrounds)
          invert && "prose-invert",
          className
        )}
        {...props}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {content}
        </ReactMarkdown>
      </div>
    )
  }
)
Markdown.displayName = "Markdown"

// ----------------------------------------------------------------------------
// Prose Component (for wrapping children with prose styles)
// ----------------------------------------------------------------------------

interface ProseProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  size?: "sm" | "base" | "lg"
  invert?: boolean
}

const Prose = React.forwardRef<HTMLDivElement, ProseProps>(
  ({ className, children, size = "base", invert, ...props }, ref) => {
    const sizeStyles = {
      sm: "prose-sm",
      base: "prose",
      lg: "prose-lg",
    }

    return (
      <div
        ref={ref}
        className={cn(
          sizeStyles[size],
          "max-w-none",
          "prose-headings:scroll-m-20 prose-headings:font-semibold prose-headings:tracking-tight",
          "prose-h1:text-3xl prose-h1:font-extrabold prose-h1:lg:text-4xl",
          "prose-h2:border-b prose-h2:pb-2 prose-h2:text-2xl",
          "prose-h3:text-xl",
          "prose-h4:text-lg",
          "prose-p:leading-7",
          "prose-a:font-medium prose-a:text-primary prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-primary/80",
          "prose-ul:my-6 prose-ul:ml-6 prose-ul:list-disc",
          "prose-ol:my-6 prose-ol:ml-6 prose-ol:list-decimal",
          "prose-li:mt-2 prose-li:leading-7",
          "prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-muted-foreground",
          "prose-code:rounded prose-code:bg-muted prose-code:px-[0.3rem] prose-code:py-[0.2rem] prose-code:font-mono prose-code:text-sm prose-code:font-semibold",
          "prose-pre:rounded-lg prose-pre:bg-muted prose-pre:p-4",
          "prose-img:rounded-lg prose-img:border",
          "prose-table:w-full prose-table:overflow-hidden prose-table:rounded-lg prose-table:border",
          "prose-thead:bg-muted prose-thead:border-b",
          "prose-th:p-3 prose-th:text-left prose-th:font-semibold prose-th:leading-none",
          "prose-td:p-3 prose-td:border-t prose-td:leading-none",
          "prose-tr:border-t first:prose-tr:border-t-0",
          "prose-hr:my-6 prose-hr:border",
          "prose-strong:font-semibold",
          invert && "prose-invert",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Prose.displayName = "Prose"

// ----------------------------------------------------------------------------
// Exports
// ----------------------------------------------------------------------------

export {
  Heading,
  Text,
  Blockquote,
  Ul,
  Ol,
  Li,
  InlineCode,
  Link,
  Prose,
  Markdown,
}
