"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  CheckCircle,
  CopySimple,
  PencilSimpleLine,
  Spinner,
  UploadSimple,
  X,
} from "@phosphor-icons/react/dist/ssr";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SettingRow } from "@/components/settings/shared/SettingRow";
import { SettingSection } from "@/components/settings/shared/SettingSection";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfileMutation } from "@/lib/auth/auth-query";
import { useUploadUserAvatarMutation } from "@/lib/upload/upload-query";
import { getInitials } from "@/lib/utils";

export function AccountSettingsPane() {
  const { user, hasHydrated } = useAuth();
  const updateProfileMutation = useUpdateProfileMutation();
  const uploadAvatarMutation = useUploadUserAvatarMutation();
  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  const handleRequestPhoto = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please use JPEG, PNG, WebP, or GIF.");
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File too large. Maximum size is 5MB.");
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setPhotoPreview(nextUrl);
    setSelectedFile(file);
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile) return;

    try {
      await uploadAvatarMutation.mutateAsync(selectedFile);
      // Clear preview after successful upload - the actual avatar will come from user data
      setPhotoPreview(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleResetPhoto = () => {
    setPhotoPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        displayName: displayName.trim(),
      });
      toast.success("Profile updated successfully");
      setIsEditingName(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update profile";
      toast.error(message);
    }
  };

  const handleCopyUserId = async () => {
    if (!user?.id) return;
    try {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (!hasHydrated) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">
          Please log in to view your account settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <DialogTitle className="text-xl">Account</DialogTitle>
        <DialogDescription className="mt-1">
          Manage your personal information and account preferences.
        </DialogDescription>
      </div>

      <Separator />

      <SettingSection title="Information">
        <SettingRow
          label="Profile photo"
          description="This image appears across your workspace."
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={photoPreview || user.avatarUrl || undefined}
                  className="object-cover"
                />
                <AvatarFallback className="text-lg font-medium">
                  {getInitials(user.displayName)}
                </AvatarFallback>
              </Avatar>
              {uploadAvatarMutation.isPending && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <Spinner className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedFile ? (
                <>
                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={handleUploadAvatar}
                    disabled={uploadAvatarMutation.isPending}
                  >
                    {uploadAvatarMutation.isPending ? (
                      <Spinner className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <UploadSimple className="mr-1 h-3 w-3" />
                    )}
                    Upload
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs text-muted-foreground"
                    onClick={handleResetPhoto}
                    disabled={uploadAvatarMutation.isPending}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={handleRequestPhoto}
                  >
                    Change photo
                  </Button>
                  {user.avatarUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-xs text-muted-foreground"
                      onClick={handleResetPhoto}
                    >
                      Remove
                    </Button>
                  )}
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handlePhotoChange}
                aria-label="Upload profile photo"
              />
            </div>
          </div>
        </SettingRow>
        <SettingRow label="Full name">
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <>
                <Input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="h-9 flex-1 text-sm"
                  placeholder="Your name"
                  disabled={updateProfileMutation.isPending}
                />
                <Button
                  size="sm"
                  className="h-9"
                  onClick={handleUpdateDisplayName}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <Spinner className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9"
                  onClick={() => {
                    setDisplayName(user.displayName);
                    setIsEditingName(false);
                  }}
                  disabled={updateProfileMutation.isPending}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Input
                  value={user.displayName}
                  readOnly
                  className="h-9 flex-1 bg-muted/40 text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setIsEditingName(true)}
                >
                  <PencilSimpleLine className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </SettingRow>
        <SettingRow
          label="Email address"
          description="Notifications will be sent to this address."
        >
          <Input
            value={user.email}
            type="email"
            className="h-9 bg-muted/40 text-sm"
            readOnly
          />
        </SettingRow>
        <SettingRow
          label="Email verification"
          description={
            user.isEmailVerified
              ? "Your email is verified."
              : "Please verify your email address."
          }
        >
          <div className="flex items-center gap-2">
            {user.isEmailVerified ? (
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-600"
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Verified
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-600"
              >
                Pending
              </Badge>
            )}
          </div>
        </SettingRow>
        <SettingRow
          label="Password"
          description="Secure your account with a strong password."
        >
          <div className="flex items-center justify-between gap-3 rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <span>••••••••</span>
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
              Change password
            </Button>
          </div>
        </SettingRow>
      </SettingSection>

      <Separator />

      <SettingSection title="Appearance">
        <SettingRow label="Theme">
          <Select
            value={isMounted ? (theme ?? "system") : "system"}
            onValueChange={(value) => setTheme(value)}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System default</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </SettingSection>

      <Separator />

      <SettingSection title="Authentication">
        <SettingRow
          label="User ID"
          description="Share this ID if you contact support."
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={user.id}
              readOnly
              className="bg-muted/40 font-mono text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-9 shrink-0"
              onClick={handleCopyUserId}
            >
              <CopySimple className="mr-2 h-4 w-4" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </SettingRow>
        <SettingRow
          label="Account created"
          description="When you joined the platform."
        >
          <Input
            value={new Date(user.createdAt).toLocaleDateString()}
            readOnly
            className="h-9 bg-muted/40 text-sm"
          />
        </SettingRow>
      </SettingSection>
    </div>
  );
}
