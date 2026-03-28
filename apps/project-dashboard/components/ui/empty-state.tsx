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
        className,
      )}
    >
      <EmptyHeader>
        {Icon && (
          <EmptyMedia variant={iconContainer ? "icon" : "default"}>
            <Icon className="size-6" />
            <svg
              width="200"
              height="100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M146.815 92.158c.452 1.64.063 3.385-1.043 4.72-1.036 1.342-2.726 2.122-4.548 2.122h-83.45c-1.822 0-3.504-.787-4.61-2.122-1.043-1.342-1.433-3.08-.974-4.72C54.916 82.222 59.59 65 59.59 65h79.812s4.68 17.222 7.406 27.158h.007Z"
                fill="#E3E3E3"
              ></path>
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M148.307 70.28H52.34l13.106-50.473h69.194l13.673 50.473h-.006Z"
                fill="#E3DEC9"
                stroke="#2C2C2C"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="m67.806 42.4-2.36-22.593M132.667 42.553l1.793-22.76"
                stroke="#2C2C2C"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="M6 14.52a5.522 5.522 0 0 1 5.52 5.52 5.522 5.522 0 0 1 5.52-5.52A5.522 5.522 0 0 1 11.52 9 5.522 5.522 0 0 1 6 14.52Z"
                fill="#B3AEEF"
                stroke="#2C2C2C"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="M180.76 89.52a2.76 2.76 0 1 0 0-5.52 2.76 2.76 0 0 0 0 5.52Z"
                fill="#F4AFC7"
                stroke="#2C2C2C"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M140.04 70.68H60.367l7.52-28.28h64.793l7.36 28.28Z"
                fill="#D0CBB5"
                stroke="#2C2C2C"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M141.453 93.487c-.353 1.194-1.473 2.014-2.66 2.014h-78.1c-1.26 0-2.38-.847-2.666-2.067C56.413 87.42 52 70.327 52 70.327h95.973s-4.833 17.194-6.52 23.16Z"
                fill="#E8FEDF"
                stroke="#2C2C2C"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="m134.64 19.806 13.673 50.474s18.893-11.227 24.927-14.714c1.086-.626 1.633-1.913 1.313-3.113L162.566 7.7c-.22-.834-.766-1.534-1.573-1.854a2.888 2.888 0 0 0-2.453.167l-23.894 13.793h-.006ZM65.447 19.806 52.34 70.28S32.933 58.893 26.9 55.413c-1.08-.627-1.633-1.907-1.307-3.113l11.98-44.754c.22-.826.847-1.486 1.647-1.813.72-.367 1.68-.273 2.373.127C48.707 9.966 65.44 19.8 65.44 19.8l.007.006Z"
                fill="#F4EED7"
                stroke="#2C2C2C"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="m90.24 33.394 6.507 6.5-2.38 8.873-8.88 2.38-6.507-6.5 2.38-8.873 8.88-2.38Z"
                stroke="#fff"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="m92.046 26.62 11.48 11.473-4.2 15.674-15.68 4.2-11.48-11.474 4.2-15.673 15.68-4.2ZM92.073 26.887 83.767 57.88"
                stroke="#fff"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="m81.26 67.227-.814 3.04 3.32-12.387-.466 1.74M93.566 21.48l.454-1.687-1.84 6.88.26-.967M137.18 29.273l-33.74 9.04M103.5 38.267l-31.133 8.34M72.366 46.606l-14.92 4M65.733 20.287l10.64 10.64M76.373 30.927l22.76 22.76M99.133 53.687l16.554 16.553"
                stroke="#fff"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="M148.307 70.28H52.34l13.106-50.473h69.194l13.673 50.473h-.006ZM99.98 2.333v12.413M79.986 8.54l3.427 5.927M120.093 8.793l-3.447 5.973"
                stroke="#2C2C2C"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="m59.98 78.953 2.14 8.273h10.273l-1.38-8.273H59.98Z"
                fill="#fff"
                stroke="#2C2C2C"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="M139.286 78.953h-11.033M138.6 83.094h-11.034M137.22 87.227h-11.033M152.36 48.607c-5.78 16.06-26.98 14.527-32.66 4.387-3.827-6.814-1.02-16.394 3.953-15.16.707.173-.513-.154.207.053 6.506 1.867 1.353 20.44-12.894 14.553"
                stroke="#2C2C2C"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="m153.6 44.227.18.673c.18.674.613 1.233 1.213 1.58.6.34 1.307.44 1.973.26a2.626 2.626 0 0 0 1.58-1.213c.347-.593.44-1.3.26-1.974l-1.313-4.893a2.728 2.728 0 0 0-.513-1.086 2.448 2.448 0 0 0-.734-.627c-.6-.34-1.306-.44-1.973-.26a2.893 2.893 0 0 0-.867.413c-.113.087-.22.167-.32.267l-3.666 3.673a2.608 2.608 0 0 0 0 3.68c.486.48 1.153.767 1.84.767.686 0 1.353-.273 1.84-.76l.493-.493.007-.007Z"
                fill="#fff"
                stroke="#2C2C2C"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M153.58 44.2a5.21 5.21 0 0 0 3.693-3.693c.12-.454.187-.914.187-1.36a2.528 2.528 0 0 0-4.714-1.26 5.09 5.09 0 0 0-.52 1.266 5.213 5.213 0 0 0 1.354 5.047Z"
                fill="#71C4AB"
                stroke="#2C2C2C"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </svg>
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
}: Omit<
  EmptyStateProps,
  "action" | "children" | "variant" | "size" | "iconContainer"
>) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-4 py-8 text-center",
        className,
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
