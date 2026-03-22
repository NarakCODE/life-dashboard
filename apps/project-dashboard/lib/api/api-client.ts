import { getAuthSnapshot, handleUnauthorizedSession, refreshAuthSession } from "@/lib/auth/auth-store"

export interface ApiEnvelopeWithMeta<T, M> {
  success: true
  data: T
  meta?: M
  timestamp: string
}

interface ApiErrorPayload {
  success: false
  statusCode: number
  message: string
  errors?: string[]
  error: string
  timestamp: string
  path: string
}

interface ApiRequestOptions {
  path: string
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  body?: unknown
  headers?: HeadersInit
  auth?: "required" | "optional" | "none"
  retryOnUnauthorized?: boolean
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (!value || typeof value !== "object") return false

  const candidate = value as Partial<ApiErrorPayload>

  return (
    candidate.success === false &&
    typeof candidate.statusCode === "number" &&
    typeof candidate.message === "string" &&
    typeof candidate.error === "string" &&
    typeof candidate.timestamp === "string" &&
    typeof candidate.path === "string"
  )
}

export class ApiError extends Error {
  statusCode: number
  errors?: string[]

  constructor(payload: ApiErrorPayload) {
    super(payload.message)
    this.name = "ApiError"
    this.statusCode = payload.statusCode
    this.errors = payload.errors
  }
}

function getApiBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL

  if (!value) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured")
  }

  return value.endsWith("/") ? value.slice(0, -1) : value
}

function createHeaders(options: ApiRequestOptions, accessToken?: string) {
  const headers = new Headers(options.headers)

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json")
  }

  if (accessToken && options.auth !== "none") {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  return headers
}

async function parseError(response: Response) {
  const payload = (await response.json().catch(() => null)) as unknown

  if (isApiErrorPayload(payload)) {
    return new ApiError(payload)
  }

  return new ApiError({
    success: false,
    statusCode: response.status,
    message: "Request failed",
    error: "RequestError",
    timestamp: new Date().toISOString(),
    path: response.url,
  })
}

export async function apiRequest<T>(options: ApiRequestOptions): Promise<T> {
  const payload = await apiRequestEnvelope<T>(options)
  return payload.data
}

export async function apiRequestEnvelope<T, M = Record<string, unknown>>(
  options: ApiRequestOptions,
): Promise<ApiEnvelopeWithMeta<T, M>> {
  const session = getAuthSnapshot().tokens
  const response = await fetch(`${getApiBaseUrl()}${options.path}`, {
    method: options.method ?? "GET",
    headers: createHeaders(options, session?.accessToken),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  })

  if (
    response.status === 401 &&
    options.auth !== "none" &&
    options.retryOnUnauthorized !== false &&
    session?.refreshToken
  ) {
    const refreshedSession = await refreshAuthSession()

    if (refreshedSession?.accessToken) {
      return apiRequestEnvelope({
        ...options,
        retryOnUnauthorized: false,
      })
    }
  }

  if (!response.ok) {
    const error = await parseError(response)

    if (response.status === 401 && options.auth !== "none") {
      await handleUnauthorizedSession()
    }

    throw error
  }

  return (await response.json()) as ApiEnvelopeWithMeta<T, M>
}
