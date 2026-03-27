"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";

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
import { useWorkspaceQuery } from "@/lib/workspaces/workspace-query";
import { useWorkspaceScope } from "@/lib/workspaces/use-workspace-scope";
import { cn } from "@/lib/utils";
import { GlobeIcon, LockIcon, UserIcon } from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// Zod schema — validation rules match the original manual validate() logic
// ---------------------------------------------------------------------------

const createChannelSchema = z
  .object({
    type: z.nativeEnum(ChannelType),
    name: z
      .string()
      .max(100, "Name must be less than 100 characters")
      .optional(),
    description: z
      .string()
      .max(500, "Description must be less than 500 characters")
      .optional(),
    memberIds: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    // Name required for non-DM channels
    if (data.type !== ChannelType.DM && !data.name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Channel name is required",
      });
    }
    // DM must target exactly one other person.
    if (data.type === ChannelType.DM && data.memberIds?.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["memberIds"],
        message: "Select exactly one person for DM",
      });
    }
    // Private channels require at least one invite
    if (
      data.type === ChannelType.PRIVATE &&
      (!data.memberIds || data.memberIds.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["memberIds"],
        message: "Select at least one member",
      });
    }
  });

type FormValues = z.infer<typeof createChannelSchema>;

// ---------------------------------------------------------------------------
// Channel type options
// ---------------------------------------------------------------------------

const CHANNEL_TYPE_OPTIONS = [
  {
    value: ChannelType.PUBLIC,
    label: "Public",
    icon: <GlobeIcon />,
    description: "Anyone in the workspace can join",
  },
  {
    value: ChannelType.PRIVATE,
    label: "Private",
    description: "Invite only",
    icon: <LockIcon />,
  },
  {
    value: ChannelType.DM,
    label: "Direct Message",
    description: "One-on-one conversation",
    icon: <UserIcon />,
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CreateChannelModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateChannelInput) => void;
  isPending?: boolean;
  initialType?: ChannelType;
  /** Workspace members to populate the invite picker. If omitted, fetched internally. */
  members?: WorkspaceMember[];
  /** Pass workspaceId so the modal can self-fetch members when the prop is absent/empty. */
  workspaceId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateChannelModal({
  open,
  onClose,
  onSubmit,
  isPending,
  initialType = ChannelType.PUBLIC,
  members: membersProp = [],
  workspaceId: workspaceIdProp,
}: CreateChannelModalProps) {
  // Resolve workspaceId: use the prop if provided, otherwise read from route scope
  const { workspaceId: scopeWorkspaceId } = useWorkspaceScope();
  const workspaceId = workspaceIdProp ?? scopeWorkspaceId;

  // Self-fetch workspace members so the picker is never empty due to timing issues
  const { data: workspace } = useWorkspaceQuery(workspaceId ?? "", {
    enabled: Boolean(workspaceId),
  });

  // Prefer the prop when populated (parent might already have data); fall back to query result
  const members: WorkspaceMember[] = useMemo(() => {
    if (membersProp.length > 0) return membersProp;
    return workspace?.members ?? [];
  }, [membersProp, workspace?.members]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      type: initialType,
      name: "",
      description: "",
      memberIds: [],
    },
  });

  const resetForm = useCallback(() => {
    reset({
      type: initialType,
      name: "",
      description: "",
      memberIds: [],
    });
  }, [initialType, reset]);

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  const channelType = watch("type");
  const memberIds = watch("memberIds");

  // For DM: derive the display name of the selected person (excluding self placeholder)
  const getDMName = () => {
    if (channelType !== ChannelType.DM || memberIds?.length !== 1) return "";
    const otherUserId = memberIds[0];
    if (!otherUserId) return "";
    return (
      members.find((m) => m.userId === otherUserId)?.user.displayName ?? ""
    );
  };

  const onValid = (data: FormValues) => {
    onSubmit(data as CreateChannelInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(onValid)();
    }
  };

  return (
    <QuickCreateModalLayout
      open={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      onSubmitShortcut={() => handleSubmit(onValid)()}
      className="max-w-lg"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {channelType === ChannelType.DM
              ? "New Direct Message"
              : "Create Channel"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {channelType === ChannelType.DM
              ? "Start a conversation with someone"
              : "Create a new channel for your workspace"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => {
            resetForm();
            onClose();
          }}
          disabled={isPending}
        >
          <X />
        </Button>
      </div>

      <form
        onSubmit={handleSubmit(onValid)}
        className="flex flex-col gap-4"
        onKeyDown={handleKeyDown}
      >
        {/* Channel Type */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="channel-type">Channel Type</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value: ChannelType) => field.onChange(value)}
              >
                <SelectTrigger id="channel-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* DM: person selector only */}
        {channelType === ChannelType.DM ? (
          <div className="flex flex-col gap-2">
            <Label>Select Person</Label>
            <Controller
              name="memberIds"
              control={control}
              render={({ field }) => (
                <UserSearchCombobox
                  members={members}
                  selectedUserIds={field.value ?? []}
                  onSelectionChange={field.onChange}
                  placeholder="Search for someone..."
                  disabled={isPending}
                  maxSelections={1}
                />
              )}
            />
            {errors.memberIds && (
              <p className="text-xs text-destructive">
                {errors.memberIds.message}
              </p>
            )}
            {memberIds?.length === 1 && (
              <p className="text-sm text-muted-foreground">
                Creating DM with <strong>{getDMName()}</strong>
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Channel name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="channel-name">Channel Name</Label>
              <Input
                id="channel-name"
                placeholder="e.g., general"
                disabled={isPending}
                autoFocus
                aria-invalid={!!errors.name}
                className={cn(errors.name && "border-destructive")}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Member invite */}
            <div className="flex flex-col gap-2">
              <Label>
                {channelType === ChannelType.PRIVATE
                  ? "Invite Members"
                  : "Invite Members (optional)"}
              </Label>
              <Controller
                name="memberIds"
                control={control}
                render={({ field }) => (
                  <UserSearchCombobox
                    members={members}
                    selectedUserIds={field.value ?? []}
                    onSelectionChange={field.onChange}
                    placeholder={
                      members.length === 0
                        ? "Loading members..."
                        : "Search workspace members..."
                    }
                    disabled={isPending || members.length === 0}
                  />
                )}
              />
              {errors.memberIds && (
                <p className="text-xs text-destructive">
                  {errors.memberIds.message}
                </p>
              )}
              {channelType === ChannelType.PUBLIC && (
                <p className="text-xs text-muted-foreground">
                  Public channels are open to everyone — invites are optional.
                </p>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="channel-description">
                Description (optional)
              </Label>
              <Textarea
                id="channel-description"
                placeholder="Describe the purpose of this channel..."
                disabled={isPending}
                aria-invalid={!!errors.description}
                className={cn(
                  "min-h-20",
                  errors.description && "border-destructive",
                )}
                rows={3}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <kbd className="rounded border bg-muted px-1.5 py-0.5">
              {navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}
            </kbd>
            <kbd className="rounded border bg-muted px-1.5 py-0.5">Enter</kbd>
            <span>to submit</span>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isPending ||
                (channelType === ChannelType.DM && memberIds?.length !== 1)
              }
            >
              {isPending
                ? "Creating..."
                : channelType === ChannelType.DM
                  ? "Start DM"
                  : "Create Channel"}
            </Button>
          </div>
        </div>
      </form>
    </QuickCreateModalLayout>
  );
}
