export interface HealthIndicatorResult {
  status: "up" | "down"
  [key: string]: unknown
}

export interface HealthCheckResult {
  status: "ok" | "error"
  info?: Record<string, HealthIndicatorResult>
  error?: Record<string, HealthIndicatorResult>
  details?: Record<string, HealthIndicatorResult>
}
