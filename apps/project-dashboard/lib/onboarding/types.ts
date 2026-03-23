export const onboardingStateStatuses = [
  "not_started",
  "in_progress",
  "completed",
  "skipped",
] as const

export type OnboardingStateStatus = (typeof onboardingStateStatuses)[number]

export const onboardingSteps = [
  "profile",
  "workspace",
  "preferences",
  "invites",
  "review",
] as const

export type OnboardingStep = (typeof onboardingSteps)[number]

export interface OnboardingSummary {
  status: OnboardingStateStatus
  requiresOnboarding: boolean
  currentStep: OnboardingStep | null
  workspaceId: string | null
}

export interface OnboardingSession {
  id: string
  userId: string
  workspaceId: string | null
  status: Exclude<OnboardingStateStatus, "not_started">
  currentStep: OnboardingStep
  completedSteps: string[]
  answers: Record<string, unknown>
  version: number
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface OnboardingState extends OnboardingSummary {
  session: OnboardingSession | null
}

export interface UpdateOnboardingStepInput {
  answers?: Record<string, unknown>
  nextStep?: OnboardingStep
  markComplete?: boolean
}
