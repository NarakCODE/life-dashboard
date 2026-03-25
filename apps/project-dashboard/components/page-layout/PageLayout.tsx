"use client";

import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div
      className={cn(
        "mx-2 my-2 flex min-h-0 min-w-0 flex-1 flex-col rounded-lg border border-border bg-background overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}


// 
