"use client";

import type { LucideIcon } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /**
   * The title of the empty state
   */
  title: string;
  /**
   * Optional description text
   */
  description?: string;
  /**
   * Optional icon to display
   */
  icon?: LucideIcon;
  /**
   * Optional action element (Button, Link, etc.)
   */
  action?: React.ReactNode;
  /**
   * Optional secondary action or additional content
   */
  children?: React.ReactNode;
  /**
   * Visual variant of the empty state
   * @default "default"
   */
  variant?: "default" | "muted" | "border" | "muted-alt";
  /**
   * Size variant
   * @default "default"
   */
  size?: "default" | "sm" | "lg";
  /**
   * Additional className for the container
   */
  className?: string;
  /**
   * Whether to show the icon in a styled container
   * @default true when icon is provided
   */
  iconContainer?: boolean;
}

const variantStyles = {
  default: "",
  muted: "bg-muted",
  border: "border",
  "muted-alt": "bg-muted/50",
};

const sizeStyles = {
  default: "py-8 md:py-12",
  sm: "py-6 md:py-8",
  lg: "py-12 md:py-16",
};

/**
 * A reusable, dynamic empty state component for displaying empty data states.
 * Wraps the shadcn Empty component with a simpler API for common use cases.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="No invitations yet"
 *   description="Invite teammates to collaborate on this workspace."
 *   icon={Mail}
 * />
 * ```
 */
export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  children,
  variant = "default",
  size = "sm",
  className,
  iconContainer = true,
}: EmptyStateProps) {
  return (
    <Empty
      className={cn(
        variantStyles[variant],
        sizeStyles[size],
        "rounded-2xl",
        className
      )}
    >
      <EmptyHeader>
        {Icon && (
          <EmptyMedia variant={iconContainer ? "icon" : "default"}>
            <Icon className="size-6" />
          </EmptyMedia>
        )}
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {(action || children) && (
        <EmptyContent>
          {action}
          {children}
        </EmptyContent>
      )}
    </Empty>
  );
}

/**
 * A compact inline empty state for use within lists or tables.
 * Shows a simplified message without the full layout.
 */
export function EmptyStateInline({
  title,
  description,
  icon: Icon,
  className,
}: Omit<EmptyStateProps, "action" | "children" | "variant" | "size" | "iconContainer">) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-4 py-8 text-center",
        className
      )}
    >
      {Icon && <Icon className="size-8 text-muted-foreground/60" />}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
