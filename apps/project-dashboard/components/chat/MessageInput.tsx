"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Smile, Paperclip, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  channelId: string;
  onSendMessage: (content: string, tempId?: string) => Promise<void>;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const TYPING_STOP_DELAY = 2000; // Stop typing indicator after 2s of inactivity
const MAX_MESSAGE_LENGTH = 4000;

export function MessageInput({
  channelId,
  onSendMessage,
  onStartTyping,
  onStopTyping,
  disabled,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingStoppedRef = useRef(true);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_MESSAGE_LENGTH;
  const isEmpty = !content.trim();

  // Auto-focus textarea when channel changes
  useEffect(() => {
    textareaRef.current?.focus();
  }, [channelId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTypingStart = useCallback(() => {
    if (typingStoppedRef.current && onStartTyping) {
      typingStoppedRef.current = false;
      onStartTyping();
    }
  }, [onStartTyping]);

  const handleTypingStop = useCallback(() => {
    if (!typingStoppedRef.current && onStopTyping) {
      typingStoppedRef.current = true;
      onStopTyping();
    }
  }, [onStopTyping]);

  const handleTyping = useCallback(() => {
    handleTypingStart();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, TYPING_STOP_DELAY);
  }, [handleTypingStart, handleTypingStop]);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || disabled || isSending || isOverLimit) return;

    setIsSending(true);

    // Generate temp ID for optimistic UI
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    try {
      await onSendMessage(trimmed, tempId);
      setContent("");
      handleTypingStop();

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    handleTyping();

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const clearInput = () => {
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  return (
    <div className="bg-transparent pb-2">
      <div
        className={cn(
          "flex items-end gap-2 rounded-2xl border border-border/40 bg-background/50 backdrop-blur-md p-2 shadow-xs transition-all",
          isFocused && "bg-background/80 ring-1 ring-primary/30 shadow-md",
          disabled && "opacity-50",
        )}
      >
        {/* Attachment Button */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                disabled={disabled || isSending}
                type="button"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attach file (coming soon)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Text Input */}
        <div className="relative min-w-0 flex-1">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={disabled ? "Disconnected..." : placeholder}
            disabled={disabled || isSending}
            className="min-h-11 resize-none border-0 bg-transparent py-2.5 focus-visible:ring-0 focus-visible:ring-offset-0"
            rows={1}
          />
          {content && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground opacity-0 transition-opacity hover:text-foreground"
              style={{ opacity: content ? 1 : 0 }}
              onClick={clearInput}
              type="button"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Emoji Button */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                disabled={disabled || isSending}
                type="button"
              >
                <Smile className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add emoji (coming soon)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Send Button */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleSubmit}
                disabled={isEmpty || disabled || isSending || isOverLimit}
                size="icon"
                className={cn(
                  "h-9 w-9 shrink-0 transition-all rounded-xl",
                  isEmpty || disabled
                    ? "opacity-50 bg-muted text-muted-foreground"
                    : "opacity-100 bg-linear-to-br from-primary to-primary/80 shadow-md hover:shadow-lg hover:scale-105",
                )}
                type="button"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isOverLimit
                ? `Message too long (${charCount}/${MAX_MESSAGE_LENGTH})`
                : "Send message"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Character Count / Help Text */}
      <div className="mt-2.5 flex items-center justify-between px-2">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
          <kbd className="rounded-lg border border-border/40 bg-muted/30 px-1.5 py-0.5 font-sans font-medium">
            Enter
          </kbd>{" "}
          to send
          <span className="mx-1 opacity-50">•</span>
          <kbd className="rounded-lg border border-border/40 bg-muted/30 px-1.5 py-0.5 font-sans font-medium">
            Shift + Enter
          </kbd>{" "}
          for new line
        </p>
        <span
          className={cn(
            "text-[11px] font-medium transition-colors backdrop-blur-sm px-2 py-0.5 rounded-full border border-border/20",
            isOverLimit
              ? "text-destructive bg-destructive/10"
              : "text-muted-foreground/70 bg-muted/20",
          )}
        >
          {charCount} / {MAX_MESSAGE_LENGTH}
        </span>
      </div>
    </div>
  );
}
