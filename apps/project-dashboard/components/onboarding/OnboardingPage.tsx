"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Rocket,
  Settings2,
  Sparkles,
  UserRound,
  UsersRound,
  Workflow,
} from "lucide-react"
import { toast } from "sonner"

import { getErrorMessage } from "@/components/auth/auth-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import { useUpdateProfileMutation } from "@/lib/auth/auth-query"
import {
  useCompleteOnboardingMutation,
  useOnboardingStateQuery,
  useStartOnboardingMutation,
  useUpdateOnboardingStepMutation,
} from "@/lib/onboarding/onboarding-query"
import {
  normalizeNextTarget,
  resolvePostOnboardingPath,
} from "@/lib/onboarding/onboarding-utils"
import type { OnboardingState, OnboardingStep } from "@/lib/onboarding/types"
import { cn } from "@/lib/utils"

const stepDefinitions: Array<{
  id: OnboardingStep
  label: string
  title: string
  description: string
  eyebrow: string
  icon: typeof UserRound
}> = [
  {
    id: "profile",
    label: "Profile",
    title: "Make the workspace yours",
    description: "Set the identity that appears across activity, mentions, and collaboration.",
    eyebrow: "Your account",
    icon: UserRound,
  },
  {
    id: "workspace",
    label: "Workspace",
    title: "Create your new workspace",
    description: "Choose the name that anchors projects, teammates, and everything you organize here.",
    eyebrow: "Workspace setup",
    icon: Workflow,
  },
  {
    id: "preferences",
    label: "Preferences",
    title: "Choose how you plan",
    description: "Pick the workflow defaults that should shape your first dashboard experience.",
    eyebrow: "Working style",
    icon: Settings2,
  },
  {
    id: "invites",
    label: "Invites",
    title: "Decide who joins first",
    description: "Keep your starter collaborators ready so the workspace can launch without losing momentum.",
    eyebrow: "Collaboration",
    icon: UsersRound,
  },
  {
    id: "review",
    label: "Review",
    title: "Review and launch",
    description: "Confirm the setup choices, then finish onboarding and enter the app.",
    eyebrow: "Ready to go",
    icon: Sparkles,
  },
] as const

const fallbackStepDefinition = stepDefinitions[0]!

const nextStepById: Record<OnboardingStep, OnboardingStep | null> = {
  profile: "workspace",
  workspace: "preferences",
  preferences: "invites",
  invites: "review",
  review: null,
}

const previousStepById: Record<OnboardingStep, OnboardingStep | null> = {
  profile: null,
  workspace: "profile",
  preferences: "workspace",
  invites: "preferences",
  review: "invites",
}

const focusAreaOptions = [
  {
    value: "personal",
    label: "Personal HQ",
    description: "Focus on tasks, habits, and your own planning system.",
    accent: "Solo-first",
  },
  {
    value: "team",
    label: "Team collaboration",
    description: "Coordinate shared work, updates, and teammate visibility.",
    accent: "Shared workflows",
  },
  {
    value: "projects",
    label: "Project delivery",
    description: "Structure the workspace around milestones, owners, and execution.",
    accent: "Execution-led",
  },
  {
    value: "wellness",
    label: "Wellness tracking",
    description: "Shape the dashboard around routines, energy, and personal health signals.",
    accent: "Habit-led",
  },
] as const

const planningCadenceOptions = [
  {
    value: "daily",
    label: "Daily focus",
    description: "Reset priorities every day and keep short planning loops.",
  },
  {
    value: "weekly",
    label: "Weekly rhythm",
    description: "Plan in weekly cycles with enough room for structure and flexibility.",
  },
  {
    value: "monthly",
    label: "Monthly goals",
    description: "Track larger outcomes and keep the workspace oriented around longer horizons.",
  },
] as const

interface OnboardingDraft {
  displayName: string
  workspaceName: string
  focusArea: string
  planningCadence: string
  invitees: string
}

interface ChoiceCardProps {
  title: string
  description: string
  isSelected: boolean
  onClick: () => void
  accent?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function getStepAnswers(
  state: OnboardingState | undefined,
  step: OnboardingStep,
) {
  const answers = state?.session?.answers

  if (!isRecord(answers)) {
    return {}
  }

  const stepAnswers = answers[step]
  return isRecord(stepAnswers) ? stepAnswers : {}
}

function buildDefaultWorkspaceName(displayName: string | undefined) {
  const trimmedName = displayName?.trim()

  if (!trimmedName) {
    return "My Workspace"
  }

  return `${trimmedName}'s Workspace`
}

function buildDraft(
  state: OnboardingState | undefined,
  displayName: string | undefined,
): OnboardingDraft {
  const profileAnswers = getStepAnswers(state, "profile")
  const workspaceAnswers = getStepAnswers(state, "workspace")
  const preferencesAnswers = getStepAnswers(state, "preferences")
  const invitesAnswers = getStepAnswers(state, "invites")

  const invitees = Array.isArray(invitesAnswers.invitees)
    ? invitesAnswers.invitees.filter((value): value is string => typeof value === "string").join("\n")
    : ""

  return {
    displayName:
      typeof profileAnswers.displayName === "string"
        ? profileAnswers.displayName
        : displayName ?? "",
    workspaceName:
      typeof workspaceAnswers.name === "string"
        ? workspaceAnswers.name
        : buildDefaultWorkspaceName(displayName),
    focusArea:
      typeof preferencesAnswers.focusArea === "string"
        ? preferencesAnswers.focusArea
        : "personal",
    planningCadence:
      typeof preferencesAnswers.planningCadence === "string"
        ? preferencesAnswers.planningCadence
        : "weekly",
    invitees,
  }
}

function parseInvitees(rawValue: string) {
  return rawValue
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean)
}

function ChoiceCard({
  title,
  description,
  isSelected,
  onClick,
  accent,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-full flex-col gap-6 rounded-[28px] border bg-background p-5 text-left transition-all duration-200",
        "hover:border-foreground/15 hover:shadow-sm",
        isSelected
          ? "border-emerald-500/70 bg-emerald-50/60 shadow-sm"
          : "border-border/60",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {accent ? (
          <Badge
            variant="outline"
            className={cn(
              "rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]",
              isSelected
                ? "border-emerald-500/40 bg-emerald-100/70 text-emerald-700"
                : "border-border/70 bg-muted/40 text-muted-foreground",
            )}
          >
            {accent}
          </Badge>
        ) : (
          <span />
        )}
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full border",
            isSelected
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-border bg-background text-transparent",
          )}
        >
          <Check className="size-4" />
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </button>
  )
}

function StepStatusBadge({
  isActive,
  isComplete,
}: {
  isActive: boolean
  isComplete: boolean
}) {
  if (isComplete) {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
        <Check className="mr-1 size-3" />
        Done
      </Badge>
    )
  }

  if (isActive) {
    return <Badge variant="secondary">Current</Badge>
  }

  return <Badge variant="outline">Upcoming</Badge>
}

function LoadingState() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-6">
      <div className="rounded-[32px] border border-border/60 bg-muted/35 p-4 shadow-sm md:p-6">
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="rounded-[28px] border border-border/60 bg-background/80 p-5">
            <div className="space-y-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-20 w-full rounded-3xl" />
              <Skeleton className="h-20 w-full rounded-3xl" />
              <Skeleton className="h-20 w-full rounded-3xl" />
            </div>
          </div>
          <div className="rounded-[28px] border border-border/60 bg-background/95 p-6">
            <div className="space-y-5">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-10 w-72" />
              <Skeleton className="h-4 w-full max-w-xl" />
              <Skeleton className="h-40 w-full rounded-[28px]" />
              <Skeleton className="h-10 w-48" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function OnboardingPage() {
  const auth = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextTarget = normalizeNextTarget(searchParams.get("next"))

  const onboardingStateQuery = useOnboardingStateQuery(
    auth.hasHydrated && auth.isAuthenticated,
  )
  const startMutation = useStartOnboardingMutation()
  const updateStepMutation = useUpdateOnboardingStepMutation()
  const completeMutation = useCompleteOnboardingMutation()
  const updateProfileMutation = useUpdateProfileMutation()

  const [draft, setDraft] = useState<OnboardingDraft>({
    displayName: "",
    workspaceName: "My Workspace",
    focusArea: "personal",
    planningCadence: "weekly",
    invitees: "",
  })
  const [draftKey, setDraftKey] = useState("")
  const [hasRequestedStart, setHasRequestedStart] = useState(false)

  const onboardingState = onboardingStateQuery.data
  const activeStep = onboardingState?.session?.currentStep ?? onboardingState?.currentStep ?? "profile"
  const activeStepIndex = Math.max(
    stepDefinitions.findIndex((step) => step.id === activeStep),
    0,
  )
  const completedSteps = onboardingState?.session?.completedSteps ?? []
  const completionProgress =
    ((completedSteps.length + (activeStep === "review" ? 1 : 0)) / stepDefinitions.length) * 100

  useEffect(() => {
    if (!onboardingState || !auth.user) {
      return
    }

    const nextDraftKey = `${auth.user.id}:${onboardingState.session?.id ?? onboardingState.status}`
    if (draftKey === nextDraftKey) {
      return
    }

    setDraft(buildDraft(onboardingState, auth.user.displayName))
    setDraftKey(nextDraftKey)
  }, [auth.user, draftKey, onboardingState])

  useEffect(() => {
    if (!auth.hasHydrated || !auth.isAuthenticated || !onboardingState) {
      return
    }

    if (
      onboardingState.status !== "not_started" ||
      onboardingState.session ||
      startMutation.isPending ||
      hasRequestedStart
    ) {
      return
    }

    setHasRequestedStart(true)
    void startMutation.mutateAsync().catch((error) => {
      setHasRequestedStart(false)
      toast.error(getErrorMessage(error, "Unable to start workspace setup"))
    })
  }, [
    auth.hasHydrated,
    auth.isAuthenticated,
    hasRequestedStart,
    onboardingState,
    startMutation,
  ])

  const activeDefinition = useMemo(
    () => stepDefinitions[activeStepIndex] ?? fallbackStepDefinition,
    [activeStepIndex],
  )

  const isBusy =
    onboardingStateQuery.isPending ||
    startMutation.isPending ||
    updateStepMutation.isPending ||
    completeMutation.isPending ||
    updateProfileMutation.isPending

  async function moveToPreviousStep() {
    const previousStep = previousStepById[activeStep]

    if (!previousStep) {
      return
    }

    try {
      await updateStepMutation.mutateAsync({
        step: activeStep,
        input: {
          nextStep: previousStep,
        },
      })
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to go back to the previous step"))
    }
  }

  async function saveProfileStep() {
    const displayName = draft.displayName.trim()

    if (displayName.length < 2) {
      toast.error("Display name must be at least 2 characters")
      return
    }

    try {
      if (displayName !== auth.user?.displayName) {
        await updateProfileMutation.mutateAsync({ displayName })
      }

      await updateStepMutation.mutateAsync({
        step: "profile",
        input: {
          answers: { displayName },
          nextStep: nextStepById.profile ?? undefined,
          markComplete: true,
        },
      })

      toast.success("Profile step saved")
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to save your profile step"))
    }
  }

  async function saveWorkspaceStep() {
    const workspaceName = draft.workspaceName.trim()

    if (workspaceName.length < 2) {
      toast.error("Workspace name must be at least 2 characters")
      return
    }

    try {
      await updateStepMutation.mutateAsync({
        step: "workspace",
        input: {
          answers: { name: workspaceName },
          nextStep: nextStepById.workspace ?? undefined,
          markComplete: true,
        },
      })

      toast.success("Workspace details saved")
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to save workspace details"))
    }
  }

  async function savePreferencesStep() {
    try {
      await updateStepMutation.mutateAsync({
        step: "preferences",
        input: {
          answers: {
            focusArea: draft.focusArea,
            planningCadence: draft.planningCadence,
          },
          nextStep: nextStepById.preferences ?? undefined,
          markComplete: true,
        },
      })

      toast.success("Preferences saved")
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to save planning preferences"))
    }
  }

  async function saveInvitesStep() {
    const invitees = parseInvitees(draft.invitees)

    try {
      await updateStepMutation.mutateAsync({
        step: "invites",
        input: {
          answers: { invitees },
          nextStep: nextStepById.invites ?? undefined,
          markComplete: true,
        },
      })

      toast.success(
        invitees.length > 0 ? "Invitations queued for workspace launch" : "Invite step saved",
      )
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to save collaborator planning"))
    }
  }

  async function finishOnboarding() {
    try {
      const session = await completeMutation.mutateAsync()
      const destination = resolvePostOnboardingPath(
        nextTarget,
        session.workspaceId ?? onboardingState?.workspaceId,
      )

      toast.success("Workspace setup complete")
      router.replace(destination)
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to complete workspace setup"))
    }
  }

  function renderStepBody() {
    if (activeStep === "profile") {
      return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="rounded-[28px] border border-border/60 bg-background p-6">
            <div className="grid gap-3">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={draft.displayName}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    displayName: event.target.value,
                  }))
                }
                autoComplete="name"
                placeholder="Your name"
                className="h-12 rounded-2xl"
              />
              <p className="text-sm leading-6 text-muted-foreground">
                This name is applied to your account profile and carried into workspace activity.
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-border/60 bg-muted/35 p-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">What this controls</p>
              <p className="text-sm leading-6 text-muted-foreground">
                Mentions, comments, notifications, and recent activity will use this identity from the first session.
              </p>
              <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Preview
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {draft.displayName.trim() || "Your name"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (activeStep === "workspace") {
      return (
        <div className="grid gap-4">
          <div className="rounded-[28px] border border-border/60 bg-background p-6">
            <div className="grid gap-3">
              <Label htmlFor="workspaceName">Workspace name</Label>
              <Input
                id="workspaceName"
                value={draft.workspaceName}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    workspaceName: event.target.value,
                  }))
                }
                placeholder="Personal HQ"
                className="h-12 rounded-2xl text-base"
              />
              <p className="text-sm leading-6 text-muted-foreground">
                This becomes the visible workspace name after onboarding is completed.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ChoiceCard
              title="Use a personal workspace"
              description="Keep things centered on your own planning system. You can still invite collaborators later."
              accent="Recommended"
              isSelected={draft.focusArea === "personal"}
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  focusArea: "personal",
                }))
              }
            />
            <ChoiceCard
              title="Start with a team-ready workspace"
              description="Bias the experience toward collaboration, shared visibility, and multi-person planning."
              accent="Team-ready"
              isSelected={draft.focusArea !== "personal"}
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  focusArea: "team",
                }))
              }
            />
          </div>
        </div>
      )
    }

    if (activeStep === "preferences") {
      return (
        <div className="grid gap-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Primary focus</p>
            <div className="grid gap-4 md:grid-cols-2">
              {focusAreaOptions.map((option) => (
                <ChoiceCard
                  key={option.value}
                  title={option.label}
                  description={option.description}
                  accent={option.accent}
                  isSelected={draft.focusArea === option.value}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      focusArea: option.value,
                    }))
                  }
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Planning cadence</p>
            <div className="grid gap-4 md:grid-cols-3">
              {planningCadenceOptions.map((option) => (
                <ChoiceCard
                  key={option.value}
                  title={option.label}
                  description={option.description}
                  isSelected={draft.planningCadence === option.value}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      planningCadence: option.value,
                    }))
                  }
                />
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (activeStep === "invites") {
      const inviteCount = parseInvitees(draft.invitees).length

      return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="rounded-[28px] border border-border/60 bg-background p-6">
            <div className="grid gap-3">
              <Label htmlFor="invitees">Invite list</Label>
              <Textarea
                id="invitees"
                value={draft.invitees}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    invitees: event.target.value,
                  }))
                }
                rows={8}
                placeholder={"alex@example.com\nsam@example.com"}
                className="rounded-2xl"
              />
              <p className="text-sm leading-6 text-muted-foreground">
                Add one email per line or separate them with commas. Invitations are sent after setup is completed.
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-border/60 bg-muted/35 p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Launch snapshot</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  You can finish onboarding without invites and add people later from workspace settings.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Invite count
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{inviteCount}</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    const invitees = parseInvitees(draft.invitees)

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-[28px] border-border/60 bg-background shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium text-foreground">{draft.displayName || "Not set"}</p>
            <p className="text-muted-foreground">Account name across the workspace</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-border/60 bg-background shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium text-foreground">{draft.workspaceName || "Not set"}</p>
            <p className="text-muted-foreground">Workspace display name</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-border/60 bg-background shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium text-foreground">
              {focusAreaOptions.find((option) => option.value === draft.focusArea)?.label ?? draft.focusArea}
            </p>
            <p className="text-muted-foreground">
              Planning cadence:{" "}
              <span className="font-medium text-foreground">
                {planningCadenceOptions.find((option) => option.value === draft.planningCadence)?.label ?? draft.planningCadence}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-border/60 bg-background shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Collaborators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium text-foreground">
              {invitees.length > 0 ? `${invitees.length} invite${invitees.length > 1 ? "s" : ""} ready to send` : "No invitees yet"}
            </p>
            <p className="text-muted-foreground">
              {invitees.length > 0 ? invitees.join(", ") : "You can add collaborators later."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  async function handlePrimaryAction() {
    if (activeStep === "profile") {
      await saveProfileStep()
      return
    }
    if (activeStep === "workspace") {
      await saveWorkspaceStep()
      return
    }
    if (activeStep === "preferences") {
      await savePreferencesStep()
      return
    }
    if (activeStep === "invites") {
      await saveInvitesStep()
      return
    }
    await finishOnboarding()
  }

  if (!auth.hasHydrated || auth.isAuthLoading || isBusy && !onboardingState) {
    return <LoadingState />
  }

  if (onboardingStateQuery.isError) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-10">
        <Card className="border-rose-200 bg-rose-50/60">
          <CardHeader>
            <CardTitle>Unable to load workspace setup</CardTitle>
            <CardDescription>
              {getErrorMessage(
                onboardingStateQuery.error,
                "The onboarding state request failed.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => void onboardingStateQuery.refetch()}>
              Retry
            </Button>
            <Button variant="outline" onClick={() => void auth.logout()}>
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-6 lg:py-8">
      <div className="rounded-[32px] border border-border/60 bg-muted/35 p-4 shadow-sm md:p-6">
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="rounded-[28px] border border-border/60 bg-background/80 p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Rocket className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">New workspace</p>
                <p className="text-sm text-muted-foreground">
                  {Math.round(completionProgress)}% complete
                </p>
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-[width]"
                style={{ width: `${completionProgress}%` }}
              />
            </div>

            <div className="mt-5 space-y-3">
              {stepDefinitions.map((step, index) => {
                const Icon = step.icon
                const isActive = step.id === activeStep
                const isComplete = completedSteps.includes(step.id)

                return (
                  <div
                    key={step.id}
                    className={cn(
                      "rounded-[24px] border p-4 transition",
                      isActive
                        ? "border-foreground/10 bg-muted/45"
                        : "border-border/60 bg-background",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex size-10 items-center justify-center rounded-2xl",
                          isActive
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {index + 1}. {step.label}
                          </p>
                          <StepStatusBadge isActive={isActive} isComplete={isComplete} />
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-border/60 bg-background/95 p-6">
            <div className="flex h-full flex-col gap-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge
                    variant="outline"
                    className="rounded-full border-foreground/10 bg-muted/40 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-foreground"
                  >
                    {activeDefinition.eyebrow}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    Step {activeStepIndex + 1} of {stepDefinitions.length}
                  </Badge>
                  {onboardingState?.session?.workspaceId ? (
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      Workspace linked
                    </Badge>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                    {activeDefinition.title}
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                    {activeDefinition.description}
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] bg-muted/35 p-4 md:p-5">
                {renderStepBody()}
              </div>

              <div className="mt-auto flex flex-col gap-4 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                  {activeStep === "review"
                    ? "Completing setup creates the workspace context and returns you to the app."
                    : "Each step is saved to the backend before you move forward, so onboarding progress is preserved."}
                </p>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void moveToPreviousStep()}
                    disabled={!previousStepById[activeStep] || isBusy}
                    className="h-10 rounded-xl px-4"
                  >
                    <ArrowLeft className="mr-2 size-4" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handlePrimaryAction()}
                    disabled={isBusy}
                    className="h-10 rounded-xl px-4"
                  >
                    {isBusy ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 size-4" />
                    )}
                    {activeStep === "review" ? "Complete setup" : "Continue"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
