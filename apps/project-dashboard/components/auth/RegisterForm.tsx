"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { getErrorDetails, getErrorMessage } from "@/components/auth/auth-error"
import { AuthFormWrapper } from "@/components/auth/auth-form-wrapper"
import { LoadingButton } from "@/components/auth/loading-button"
import { PasswordInput } from "@/components/auth/password-input"
import { VerificationStatus } from "@/components/auth/verification-status"
import { useRegisterMutation } from "@/lib/auth/auth-query"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const registerSchema = z.object({
  displayName: z.string().trim().min(2, "Display name is required").max(64),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const router = useRouter()
  const registerMutation = useRegisterMutation()
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await registerMutation.mutateAsync(values)
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`)
    } catch (error) {
      form.setError("root", {
        message: getErrorMessage(error, "Unable to create your account"),
      })
    }
  })

  return (
    <AuthFormWrapper
      title="Create your account"
      description="Register with the existing backend auth service. Email verification is required before first login."
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="displayName">Display name</FieldLabel>
            <Input id="displayName" autoComplete="name" {...form.register("displayName")} />
            <FieldError>{form.formState.errors.displayName?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
            <FieldError>{form.formState.errors.email?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <PasswordInput id="password" autoComplete="new-password" {...form.register("password")} />
            <FieldError>{form.formState.errors.password?.message}</FieldError>
          </Field>
        </FieldGroup>

        {form.formState.errors.root?.message ? (
          <VerificationStatus
            variant="error"
            title="Registration failed"
            description={form.formState.errors.root.message}
          />
        ) : null}

        {registerMutation.error ? (
          <FieldError>
            {getErrorDetails(registerMutation.error).map((detail) => (
              <div key={detail}>{detail}</div>
            ))}
          </FieldError>
        ) : null}

        <LoadingButton
          type="submit"
          className="w-full"
          isLoading={registerMutation.isPending}
          loadingLabel="Creating account..."
        >
          Create account
        </LoadingButton>

        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Back to login</Link>
        </Button>
      </form>
    </AuthFormWrapper>
  )
}
