import { ApiError } from "@/lib/api/api-client"

export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export function getErrorDetails(error: unknown) {
  if (error instanceof ApiError && error.errors?.length) {
    return error.errors
  }

  return []
}
