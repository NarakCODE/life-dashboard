import { apiRequest } from "@/lib/api/api-client"

export interface UploadResponse {
  url: string
  key: string
  filename: string
  size: number
  mimeType: string
}

export interface UploadFromUrlInput {
  url: string
  filename?: string
}

const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]
const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB

function validateAvatarFile(file: File): void {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type. Allowed types: JPEG, PNG, WebP, GIF`
    )
  }
  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error(`File too large. Maximum size: 5MB`)
  }
}

async function uploadFile<T>(
  path: string,
  file: File,
): Promise<T> {
  const formData = new FormData()
  formData.append("file", file)

  // Note: We don't use apiRequest here because we need to send FormData
  // and let the browser set the Content-Type with boundary
  const { getAuthSnapshot } = await import("@/lib/auth/auth-store")
  const session = getAuthSnapshot().tokens

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured")
  }
  const apiBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl

  const headers: HeadersInit = {}
  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers,
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    if (errorData?.message) {
      throw new Error(errorData.message)
    }
    throw new Error(`Upload failed: ${response.statusText}`)
  }

  const envelope = await response.json()
  return envelope.data as T
}

/**
 * Upload avatar image (JPEG, PNG, WebP, GIF, max 5MB)
 * Endpoint: POST /upload/avatar
 */
export async function uploadAvatar(
  file: File,
): Promise<UploadResponse> {
  validateAvatarFile(file)
  return uploadFile<UploadResponse>("/upload/avatar", file)
}

/**
 * Upload and update current user avatar
 * Endpoint: POST /auth/me/avatar
 */
export async function uploadUserAvatar(
  file: File,
): Promise<UploadResponse> {
  validateAvatarFile(file)
  return uploadFile<UploadResponse>("/auth/me/avatar", file)
}

/**
 * Upload attachment (images, PDFs, docs)
 * Endpoint: POST /upload/attachment
 */
export async function uploadAttachment(
  file: File,
): Promise<UploadResponse> {
  return uploadFile<UploadResponse>("/upload/attachment", file)
}

/**
 * Upload audio file (MP3, WAV, OGG, M4A)
 * Endpoint: POST /upload/audio
 */
export async function uploadAudio(
  file: File,
): Promise<UploadResponse> {
  return uploadFile<UploadResponse>("/upload/audio", file)
}

/**
 * Upload file from remote URL
 * Endpoint: POST /upload/from-url
 */
export async function uploadFromUrl(
  input: UploadFromUrlInput
): Promise<UploadResponse> {
  return apiRequest<UploadResponse>({
    path: "/upload/from-url",
    method: "POST",
    body: input,
    auth: "required",
  })
}
