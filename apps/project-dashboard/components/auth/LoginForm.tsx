"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { FlaskConical, Rocket } from "lucide-react"
import { useEffect, useState } from "react"

import { getErrorMessage } from "@/components/auth/auth-error"
import { AuthFormWrapper } from "@/components/auth/auth-form-wrapper"
import { LoadingButton } from "@/components/auth/loading-button"
import { PasswordInput } from "@/components/auth/password-input"
import { VerificationStatus } from "@/components/auth/verification-status"
import {
  useLoginMutation,
  useResendVerificationMutation,
  useDevBootstrapMutation,
} from "@/lib/auth/auth-query"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

function isUnverifiedEmailErrorMessage(message: string | undefined) {
  return message?.toLowerCase().includes("not verified") ?? false
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const loginMutation = useLoginMutation()
  const resendMutation = useResendVerificationMutation()
  const devBootstrapMutation = useDevBootstrapMutation()
  const nextTarget = searchParams.get("next") || "/"
  const [isDevelopment, setIsDevelopment] = useState(false)
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  useEffect(() => {
    setIsDevelopment(window.location.hostname === "localhost")
  }, [])

  async function handleResendVerification() {
    try {
      await resendMutation.mutateAsync({ email: emailValue })
    } catch (error) {
      form.setError("root", {
        message: getErrorMessage(error, "Unable to resend verification email"),
      })
    }
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await loginMutation.mutateAsync(values)
      router.replace(nextTarget)
    } catch (error) {
      const message = getErrorMessage(error, "Unable to sign in")

      if (isUnverifiedEmailErrorMessage(message)) {
        const params = new URLSearchParams({
          email: values.email,
          message,
        })

        router.push(`/verify-email?${params.toString()}`)
        return
      }

      form.setError("root", {
        message,
      })
    }
  })

  async function handleDevBootstrap() {
    try {
      await devBootstrapMutation.mutateAsync()
      router.replace(nextTarget)
    } catch (error) {
      form.setError("root", {
        message: getErrorMessage(error, "Unable to bootstrap a local dev session"),
      })
    }
  }

  const emailValue = form.watch("email")
  const hasUnverifiedEmailError = isUnverifiedEmailErrorMessage(form.formState.errors.root?.message)

  return (
    <AuthFormWrapper
      title="Sign in"
      description="Use your email and password. If your email is still unverified, finish verification before logging in."
      footer={
        <p>
          Need an account?{" "}
          <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Register
          </Link>
        </p>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
            <FieldError>{form.formState.errors.email?.message}</FieldError>
          </Field>

          <Field>
            <div className="flex items-center justify-between gap-4">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <span className="text-xs text-muted-foreground">Forgot password is not yet supported by the API.</span>
            </div>
            <PasswordInput id="password" autoComplete="current-password" {...form.register("password")} />
            <FieldError>{form.formState.errors.password?.message}</FieldError>
          </Field>
        </FieldGroup>

        {form.formState.errors.root?.message ? (
          <VerificationStatus
            variant={hasUnverifiedEmailError ? "warning" : "error"}
            title={hasUnverifiedEmailError ? "Email verification required" : "Login failed"}
            description={form.formState.errors.root.message}
          />
        ) : null}

        {hasUnverifiedEmailError ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <LoadingButton
              type="button"
              variant="outline"
              className="w-full"
              isLoading={resendMutation.isPending}
              loadingLabel="Sending..."
              onClick={() => void handleResendVerification()}
              disabled={!emailValue}
            >
              Resend verification
            </LoadingButton>
            <Button asChild className="w-full">
              <Link href={`/verify-email?email=${encodeURIComponent(emailValue)}`}>Verify email</Link>
            </Button>
          </div>
        ) : null}

        {resendMutation.isSuccess ? (
          <VerificationStatus
            variant="success"
            title="Verification sent"
            description={resendMutation.data.message}
          />
        ) : null}

        <LoadingButton
          type="submit"
          className="w-full"
          isLoading={loginMutation.isPending}
          loadingLabel="Signing in..."
        >
          Sign in
        </LoadingButton>

        {isDevelopment ? (
          <>
            <FieldSeparator>Development</FieldSeparator>

            <Card className="border-dashed border-border/70 bg-muted/20 shadow-none">
              <CardHeader className="gap-2 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FlaskConical className="text-muted-foreground" />
                  Local Dev Access
                </CardTitle>
                <CardDescription>
                  Bootstrap a verified local session instantly for protected route testing.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <LoadingButton
                  type="button"
                  variant="outline"
                  className="w-full"
                  isLoading={devBootstrapMutation.isPending}
                  loadingLabel="Bootstrapping..."
                  onClick={() => void handleDevBootstrap()}
                >
                  <Rocket data-icon="inline-start" />
                  Use local development account
                </LoadingButton>
              </CardContent>
            </Card>
          </>
        ) : null}
      </form>
    </AuthFormWrapper>
  )
}
