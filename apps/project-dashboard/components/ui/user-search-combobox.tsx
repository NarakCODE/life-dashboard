"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { WorkspaceMember } from "@/lib/workspaces/workspace-types";

interface UserSearchComboboxProps {
  members: WorkspaceMember[];
  selectedUserIds: string[];
  onSelectionChange: (userIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxSelections?: number;
}

export function UserSearchCombobox({
  members,
  selectedUserIds,
  onSelectionChange,
  placeholder = "Select users...",
  disabled = false,
  maxSelections,
}: UserSearchComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedUsers = React.useMemo(
    () => members.filter((m) => selectedUserIds.includes(m.userId)),
    [members, selectedUserIds],
  );

  const availableMembers = React.useMemo(
    () =>
      members.filter(
        (m) =>
          !selectedUserIds.includes(m.userId) &&
          m.user.displayName.toLowerCase().includes(search.toLowerCase()),
      ),
    [members, selectedUserIds, search],
  );

  const handleSelect = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onSelectionChange(selectedUserIds.filter((id) => id !== userId));
    } else {
      if (maxSelections && selectedUserIds.length >= maxSelections) {
        return;
      }
      onSelectionChange([...selectedUserIds, userId]);
    }
  };

  const handleRemove = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange(selectedUserIds.filter((id) => id !== userId));
  };

  const isAtMax = maxSelections ? selectedUserIds.length >= maxSelections : false;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10 py-2 px-3"
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedUsers.length === 0 && (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            {selectedUsers.map((user) => (
              <Badge
                key={user.userId}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {user.user.displayName}
                <button
                  onClick={(e) => handleRemove(user.userId, e)}
                  className="hover:bg-muted rounded-full p-0.5"
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search users..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {availableMembers.map((member) => (
                <CommandItem
                  key={member.userId}
                  value={member.user.displayName}
                  onSelect={() => handleSelect(member.userId)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedUserIds.includes(member.userId)
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{member.user.displayName}</span>
                    <span className="text-xs text-muted-foreground">
                      {member.user.email}
                    </span>
                  </div>
                </CommandItem>
              ))}
              {isAtMax && (
                <CommandItem disabled className="text-muted-foreground text-xs">
                  Maximum {maxSelections} users selected
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
