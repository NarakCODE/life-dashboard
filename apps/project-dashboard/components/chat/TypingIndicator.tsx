"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  userIds: string[];
  userNames?: Record<string, string>;
  className?: string;
}

export function TypingIndicator({ userIds, userNames = {}, className }: TypingIndicatorProps) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const text = useTextForTypingUsers(userIds, userNames);

  return (
    <AnimatePresence>
      {userIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: 10, height: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex items-center gap-3 border-t bg-muted/30 px-4 py-2",
            className
          )}
        >
          <div className="flex gap-1">
            <motion.span
              className="flex h-2 w-2 rounded-full bg-muted-foreground"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.span
              className="flex h-2 w-2 rounded-full bg-muted-foreground"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />
            <motion.span
              className="flex h-2 w-2 rounded-full bg-muted-foreground"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            />
          </div>
          <span className="text-muted-foreground text-sm">
            {text}
            <span className="inline-block w-6">{dots}</span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function useTextForTypingUsers(userIds: string[], userNames: Record<string, string>): string {
  return useTextForTypingUsersMemo(userIds, userNames);
}

function useTextForTypingUsersMemo(userIds: string[], userNames: Record<string, string>): string {
  if (userIds.length === 0) return "";

  const names = userIds.map((id) => userNames[id] || "Someone").filter(Boolean);

  if (names.length === 1) {
    return `${names[0]} is typing`;
  }

  if (names.length === 2) {
    return `${names.join(" and ")} are typing`;
  }

  return `${names[0]} and ${names.length - 1} others are typing`;
}
