import { apiRequest } from "@/lib/api/api-client"
import type {
  OnboardingSession,
  OnboardingState,
  OnboardingStep,
  UpdateOnboardingStepInput,
} from "@/lib/onboarding/types"

export function getOnboardingState() {
  return apiRequest<OnboardingState>({
    path: "/onboarding/me",
    auth: "required",
  })
}

export function startOnboarding() {
  return apiRequest<OnboardingSession>({
    path: "/onboarding/start",
    method: "POST",
    auth: "required",
  })
}

export function updateOnboardingStep(
  step: OnboardingStep,
  input: UpdateOnboardingStepInput,
) {
  return apiRequest<OnboardingSession>({
    path: `/onboarding/steps/${step}`,
    method: "PATCH",
    body: input,
    auth: "required",
  })
}

export function completeOnboarding() {
  return apiRequest<OnboardingSession>({
    path: "/onboarding/complete",
    method: "POST",
    auth: "required",
  })
}
