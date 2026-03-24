"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Smile, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageInputProps {
  channelId: string;
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  channelId,
  onSendMessage,
  disabled,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when channel changes
  useEffect(() => {
    textareaRef.current?.focus();
  }, [channelId]);

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setContent("");
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="flex items-end gap-2 rounded-lg border bg-muted/30 p-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground"
          disabled={disabled}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[40px] resize-none border-0 bg-transparent py-2.5 focus-visible:ring-0 focus-visible:ring-offset-0"
          rows={1}
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground"
          disabled={disabled}
        >
          <Smile className="h-5 w-5" />
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || disabled}
          size="icon"
          className="h-9 w-9 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-2 text-center text-muted-foreground text-xs">
        Press Enter to send, Shift + Enter for new line
      </p>
    </div>
  );
}
