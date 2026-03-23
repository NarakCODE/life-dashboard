import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { authKeys } from "@/lib/auth/auth-query"
import {
  completeOnboarding,
  getOnboardingState,
  startOnboarding,
  updateOnboardingStep,
} from "@/lib/onboarding/onboarding-client"
import type {
  OnboardingStep,
  UpdateOnboardingStepInput,
} from "@/lib/onboarding/types"
import { workspaceKeys } from "@/lib/workspaces/workspace-query"

export const onboardingKeys = {
  all: ["onboarding"] as const,
  state: () => [...onboardingKeys.all, "state"] as const,
}

export function useOnboardingStateQuery(enabled: boolean) {
  return useQuery({
    queryKey: onboardingKeys.state(),
    queryFn: getOnboardingState,
    enabled,
    staleTime: 30_000,
  })
}

export function useStartOnboardingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: startOnboarding,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: onboardingKeys.all }),
        queryClient.invalidateQueries({ queryKey: authKeys.me() }),
        queryClient.invalidateQueries({ queryKey: workspaceKeys.all }),
      ])
    },
  })
}

export function useUpdateOnboardingStepMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      step,
      input,
    }: {
      step: OnboardingStep
      input: UpdateOnboardingStepInput
    }) => updateOnboardingStep(step, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: onboardingKeys.all })
    },
  })
}

export function useCompleteOnboardingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: onboardingKeys.all }),
        queryClient.invalidateQueries({ queryKey: authKeys.me() }),
        queryClient.invalidateQueries({ queryKey: workspaceKeys.all }),
      ])
    },
  })
}
