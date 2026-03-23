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
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
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
import type {
  OnboardingState,
  OnboardingStep,
} from "@/lib/onboarding/types"

const stepDefinitions: Array<{
  id: OnboardingStep
  label: string
  title: string
  description: string
  icon: typeof UserRound
}> = [
  {
    id: "profile",
    label: "Profile",
    title: "Personalize your account",
    description: "Set the name that appears across your workspace and activity history.",
    icon: UserRound,
  },
  {
    id: "workspace",
    label: "Workspace",
    title: "Name your workspace",
    description: "Create the base identity for your dashboard, projects, and collaboration space.",
    icon: Workflow,
  },
  {
    id: "preferences",
    label: "Preferences",
    title: "Shape your planning style",
    description: "Capture a few defaults so the dashboard can feel tailored from the first session.",
    icon: Settings2,
  },
  {
    id: "invites",
    label: "Invites",
    title: "Plan your collaborators",
    description: "Store the first teammates you want to invite so setup is not lost.",
    icon: UsersRound,
  },
  {
    id: "review",
    label: "Review",
    title: "Review and finish",
    description: "Check the setup summary and activate your workspace.",
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

interface OnboardingDraft {
  displayName: string
  workspaceName: string
  focusArea: string
  planningCadence: string
  invitees: string
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="border-border/60 bg-card/80">
          <CardContent className="space-y-4 p-5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/90">
          <CardContent className="space-y-5 p-6">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-11 w-40" />
          </CardContent>
        </Card>
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
        invitees.length > 0 ? "Invite list saved for later" : "Invite step saved",
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
        <div className="grid gap-5">
          <div className="grid gap-2">
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
            />
            <p className="text-sm text-muted-foreground">
              This is applied directly to your account profile and also stored in onboarding progress.
            </p>
          </div>
        </div>
      )
    }

    if (activeStep === "workspace") {
      return (
        <div className="grid gap-5">
          <div className="grid gap-2">
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
            />
            <p className="text-sm text-muted-foreground">
              This becomes the visible name of the workspace when onboarding is completed.
            </p>
          </div>
        </div>
      )
    }

    if (activeStep === "preferences") {
      return (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="focusArea">Primary focus</Label>
            <Select
              value={draft.focusArea}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  focusArea: value,
                }))
              }
            >
              <SelectTrigger id="focusArea">
                <SelectValue placeholder="Choose a focus area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal productivity</SelectItem>
                <SelectItem value="team">Team collaboration</SelectItem>
                <SelectItem value="projects">Project delivery</SelectItem>
                <SelectItem value="wellness">Wellness tracking</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="planningCadence">Planning cadence</Label>
            <Select
              value={draft.planningCadence}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  planningCadence: value,
                }))
              }
            >
              <SelectTrigger id="planningCadence">
                <SelectValue placeholder="Choose a planning rhythm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily focus</SelectItem>
                <SelectItem value="weekly">Weekly planning</SelectItem>
                <SelectItem value="monthly">Monthly goals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    }

    if (activeStep === "invites") {
      return (
        <div className="grid gap-5">
          <div className="grid gap-2">
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
              rows={7}
              placeholder={"alex@example.com\nsam@example.com"}
            />
            <p className="text-sm text-muted-foreground">
              These emails are stored with your onboarding answers for follow-up. Invitation sending can be connected next.
            </p>
          </div>
        </div>
      )
    }

    const invitees = parseInvitees(draft.invitees)

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/60 bg-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium text-foreground">{draft.displayName || "Not set"}</p>
            <p className="text-muted-foreground">Account name across the workspace</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium text-foreground">{draft.workspaceName || "Not set"}</p>
            <p className="text-muted-foreground">Workspace display name</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium capitalize text-foreground">{draft.focusArea}</p>
            <p className="text-muted-foreground">
              Planning cadence: <span className="capitalize">{draft.planningCadence}</span>
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Collaborators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium text-foreground">
              {invitees.length > 0 ? `${invitees.length} planned invite${invitees.length > 1 ? "s" : ""}` : "No invitees yet"}
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-4 lg:py-8">
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardHeader className="gap-4">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Rocket className="size-5" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl">Finish your workspace setup</CardTitle>
              <CardDescription className="text-sm leading-6">
                We use the onboarding state from the backend to guide setup and keep incomplete users away from workspace-bound routes.
              </CardDescription>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(completionProgress)}%</span>
              </div>
              <Progress value={completionProgress} className="h-2" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {stepDefinitions.map((step, index) => {
              const Icon = step.icon
              const isActive = step.id === activeStep
              const isComplete = completedSteps.includes(step.id)

              return (
                <div
                  key={step.id}
                  className={`rounded-2xl border px-4 py-3 transition ${
                    isActive
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/50 bg-background/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 inline-flex size-9 items-center justify-center rounded-xl ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {index + 1}. {step.label}
                        </p>
                        <p className="text-xs leading-5 text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    <StepStatusBadge isActive={isActive} isComplete={isComplete} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/95 shadow-sm">
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                {activeDefinition.label}
              </Badge>
              {onboardingState?.session?.workspaceId ? (
                <Badge variant="secondary">Workspace linked</Badge>
              ) : null}
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl tracking-tight">
                {activeDefinition.title}
              </CardTitle>
              <CardDescription className="max-w-2xl text-base leading-7">
                {activeDefinition.description}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderStepBody()}

            <Separator />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {activeStep === "review"
                  ? "Completing setup activates the workspace flow and returns you to the app."
                  : "Your progress is stored on the backend after each step."}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void moveToPreviousStep()}
                  disabled={!previousStepById[activeStep] || isBusy}
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Back
                </Button>
                <Button type="button" onClick={() => void handlePrimaryAction()} disabled={isBusy}>
                  {isBusy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
                  {activeStep === "review" ? "Complete setup" : "Save and continue"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
