"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuickCreateModalLayout } from "@/components/QuickCreateModalLayout";
import { UserSearchCombobox } from "@/components/ui/user-search-combobox";
import { ChannelType, type CreateChannelInput } from "@/lib/chat/types";
import { WorkspaceMember } from "@/lib/workspaces/workspace-types";
import { cn } from "@/lib/utils";

interface CreateChannelModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateChannelInput) => void;
  isPending?: boolean;
  members?: WorkspaceMember[];
}

const CHANNEL_TYPE_OPTIONS = [
  { value: ChannelType.PUBLIC, label: "Public", description: "Anyone in the workspace can join" },
  { value: ChannelType.PRIVATE, label: "Private", description: "Invite only" },
  { value: ChannelType.DM, label: "Direct Message", description: "One-on-one conversation" },
];

export function CreateChannelModal({
  open,
  onClose,
  onSubmit,
  isPending,
  members = [],
}: CreateChannelModalProps) {
  const [formData, setFormData] = useState<CreateChannelInput>({
    type: ChannelType.PUBLIC,
    name: "",
    description: "",
    memberIds: [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateChannelInput, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateChannelInput, string>> = {};

    if (formData.type !== ChannelType.DM && !formData.name?.trim()) {
      newErrors.name = "Channel name is required";
    }

    if (formData.type === ChannelType.DM && formData.memberIds?.length !== 2) {
      newErrors.memberIds = "Select exactly one person for DM";
    }

    if (formData.type === ChannelType.PRIVATE && (!formData.memberIds || formData.memberIds.length === 0)) {
      newErrors.memberIds = "Select at least one member";
    }

    if (formData.name && formData.name.length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(formData);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const selectedType = CHANNEL_TYPE_OPTIONS.find((opt) => opt.value === formData.type);

  // For DM, get the other user (excluding current user)
  const getDMName = () => {
    if (formData.type !== ChannelType.DM || formData.memberIds?.length !== 2) return "";
    const otherUserId = formData.memberIds.find((id) => id !== "current-user");
    if (!otherUserId) return "";
    const otherMember = members.find((m) => m.userId === otherUserId);
    return otherMember ? otherMember.user.displayName : "";
  };

  return (
    <QuickCreateModalLayout
      open={open}
      onClose={onClose}
      onSubmitShortcut={handleSubmit}
      className="max-w-lg"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {formData.type === ChannelType.DM ? "New Direct Message" : "Create Channel"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {formData.type === ChannelType.DM
              ? "Start a conversation with someone"
              : "Create a new channel for your workspace"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
          disabled={isPending}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4" onKeyDown={handleKeyDown}>
        <div className="space-y-2">
          <Label htmlFor="channel-type">Channel Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value: ChannelType) =>
              setFormData((prev) => ({ ...prev, type: value, memberIds: [] }))
            }
          >
            <SelectTrigger id="channel-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHANNEL_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.type === ChannelType.DM ? (
          <div className="space-y-2">
            <Label>Select Person</Label>
            <UserSearchCombobox
              members={members.filter((m) => m.userId !== "current-user")}
              selectedUserIds={formData.memberIds || []}
              onSelectionChange={(userIds) =>
                setFormData((prev) => ({ ...prev, memberIds: userIds }))
              }
              placeholder="Search for someone..."
              disabled={isPending}
              maxSelections={2}
            />
            {errors.memberIds && (
              <p className="text-xs text-destructive">{errors.memberIds}</p>
            )}
            {formData.memberIds?.length === 2 && (
              <p className="text-sm text-muted-foreground">
                Creating DM with <strong>{getDMName()}</strong>
              </p>
            )}
          </div>
        ) : (
          <>
            {formData.type === ChannelType.PRIVATE && (
              <div className="space-y-2">
                <Label>Select Members</Label>
                <UserSearchCombobox
                  members={members}
                  selectedUserIds={formData.memberIds || []}
                  onSelectionChange={(userIds) =>
                    setFormData((prev) => ({ ...prev, memberIds: userIds }))
                  }
                  placeholder="Search for members..."
                  disabled={isPending}
                />
                {errors.memberIds && (
                  <p className="text-xs text-destructive">{errors.memberIds}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel Name</Label>
              <Input
                id="channel-name"
                placeholder="e.g., general"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={isPending}
                className={cn(errors.name && "border-destructive")}
                autoFocus
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel-description">Description (optional)</Label>
              <Textarea
                id="channel-description"
                placeholder="Describe the purpose of this channel..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                disabled={isPending}
                className={cn("min-h-[80px]", errors.description && "border-destructive")}
                rows={3}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isPending ||
              (formData.type === ChannelType.DM && formData.memberIds?.length !== 2)
            }
          >
            {isPending ? "Creating..." : formData.type === ChannelType.DM ? "Start DM" : "Create Channel"}
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <kbd className="rounded border bg-muted px-1.5 py-0.5">
            {navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}
          </kbd>
          <kbd className="rounded border bg-muted px-1.5 py-0.5">Enter</kbd>
          <span>to submit</span>
        </div>
      </div>
    </QuickCreateModalLayout>
  );
}
