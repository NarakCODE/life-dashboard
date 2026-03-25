import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { authKeys } from "@/lib/auth/auth-query"
import {
  uploadAttachment,
  uploadAudio,
  uploadAvatar,
  uploadFromUrl,
  uploadUserAvatar,
  type UploadFromUrlInput,
  type UploadResponse,
} from "@/lib/upload/upload-client"

export const uploadKeys = {
  all: ["upload"] as const,
  avatar: () => [...uploadKeys.all, "avatar"] as const,
  attachment: () => [...uploadKeys.all, "attachment"] as const,
  audio: () => [...uploadKeys.all, "audio"] as const,
  fromUrl: () => [...uploadKeys.all, "from-url"] as const,
}

interface UploadMutationOptions {
  onSuccess?: (data: UploadResponse) => void
  onError?: (error: Error) => void
  showSuccessToast?: boolean
  showErrorToast?: boolean
  successMessage?: string
}

/**
 * Hook to upload avatar (general purpose)
 */
export function useUploadAvatarMutation(options?: UploadMutationOptions) {
  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (data) => {
      if (options?.showSuccessToast !== false) {
        toast.success(options?.successMessage || "Avatar uploaded successfully")
      }
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      if (options?.showErrorToast !== false) {
        const message = error instanceof Error ? error.message : "Upload failed"
        toast.error(message)
      }
      options?.onError?.(error as Error)
    },
  })
}

/**
 * Hook to upload and update current user avatar
 * Automatically invalidates the current user query on success
 */
export function useUploadUserAvatarMutation(options?: UploadMutationOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadUserAvatar,
    onSuccess: async (data) => {
      // Invalidate auth user query to refresh the avatar
      await queryClient.invalidateQueries({ queryKey: authKeys.me() })

      if (options?.showSuccessToast !== false) {
        toast.success(options?.successMessage || "Profile photo updated")
      }
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      if (options?.showErrorToast !== false) {
        const message = error instanceof Error ? error.message : "Upload failed"
        toast.error(message)
      }
      options?.onError?.(error as Error)
    },
  })
}

/**
 * Hook to upload attachment
 */
export function useUploadAttachmentMutation(options?: UploadMutationOptions) {
  return useMutation({
    mutationFn: uploadAttachment,
    onSuccess: (data) => {
      if (options?.showSuccessToast !== false) {
        toast.success(options?.successMessage || "Attachment uploaded successfully")
      }
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      if (options?.showErrorToast !== false) {
        const message = error instanceof Error ? error.message : "Upload failed"
        toast.error(message)
      }
      options?.onError?.(error as Error)
    },
  })
}

/**
 * Hook to upload audio
 */
export function useUploadAudioMutation(options?: UploadMutationOptions) {
  return useMutation({
    mutationFn: uploadAudio,
    onSuccess: (data) => {
      if (options?.showSuccessToast !== false) {
        toast.success(options?.successMessage || "Audio uploaded successfully")
      }
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      if (options?.showErrorToast !== false) {
        const message = error instanceof Error ? error.message : "Upload failed"
        toast.error(message)
      }
      options?.onError?.(error as Error)
    },
  })
}

/**
 * Hook to upload from URL
 */
export function useUploadFromUrlMutation(options?: UploadMutationOptions) {
  return useMutation({
    mutationFn: (input: UploadFromUrlInput) => uploadFromUrl(input),
    onSuccess: (data) => {
      if (options?.showSuccessToast !== false) {
        toast.success(options?.successMessage || "File uploaded from URL")
      }
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      if (options?.showErrorToast !== false) {
        const message = error instanceof Error ? error.message : "Upload failed"
        toast.error(message)
      }
      options?.onError?.(error as Error)
    },
  })
}
