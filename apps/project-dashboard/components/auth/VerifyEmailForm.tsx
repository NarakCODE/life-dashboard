"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { getErrorMessage } from "@/components/auth/auth-error"
import { AuthFormWrapper } from "@/components/auth/auth-form-wrapper"
import { LoadingButton } from "@/components/auth/loading-button"
import { VerificationStatus } from "@/components/auth/verification-status"
import {
  useResendVerificationMutation,
  useVerifyEmailMutation,
} from "@/lib/auth/auth-query"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

const verifyEmailSchema = z.object({
  email: z.email("Enter a valid email address"),
  code: z.string().trim().length(6, "Enter the 6-digit verification code"),
})

type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>

export function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const verificationEmail = searchParams.get("email") ?? ""
  const verifyMutation = useVerifyEmailMutation()
  const resendMutation = useResendVerificationMutation()
  const form = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: verificationEmail,
      code: "",
    },
  })

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
      await verifyMutation.mutateAsync(values)
      form.reset({
        email: values.email,
        code: "",
      })
    } catch (error) {
      form.setError("root", {
        message: getErrorMessage(error, "Unable to verify email"),
      })
    }
  })

  const emailValue = form.watch("email")

  return (
    <AuthFormWrapper
      title="Verify your email"
      description="Enter the six-digit code sent to your inbox. The backend requires verification before login."
      footer={
        <p>
          Already verified?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Go to login
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

          <Field data-invalid={Boolean(form.formState.errors.code)}>
            <FieldLabel htmlFor="code">Verification code</FieldLabel>
            <Controller
              control={form.control}
              name="code"
              render={({ field }) => (
                <InputOTP
                  id="code"
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-invalid={form.formState.errors.code ? "true" : undefined}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(value) => {
                    field.onChange(value)

                    if (form.formState.errors.root) {
                      form.clearErrors("root")
                    }
                  }}
                  containerClassName="justify-center sm:justify-start"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              )}
            />
            <FieldDescription>Paste the full six-digit code or enter it one digit at a time.</FieldDescription>
            <FieldError>{form.formState.errors.code?.message}</FieldError>
          </Field>
        </FieldGroup>

        {verifyMutation.isSuccess ? (
          <VerificationStatus
            variant="success"
            title="Email verified"
            description="Your email is verified. You can now sign in with your password."
          />
        ) : null}

        {form.formState.errors.root?.message ? (
          <VerificationStatus
            variant="error"
            title="Verification failed"
            description={form.formState.errors.root.message}
          />
        ) : (
          <VerificationStatus
            variant="info"
            title="Check your inbox"
            description="If you just registered, use the code from the verification email."
          />
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <LoadingButton
            type="submit"
            className="w-full"
            isLoading={verifyMutation.isPending}
            loadingLabel="Verifying..."
          >
            Verify email
          </LoadingButton>

          <LoadingButton
            type="button"
            variant="outline"
            className="w-full"
            isLoading={resendMutation.isPending}
            loadingLabel="Sending..."
            onClick={() => void handleResendVerification()}
            disabled={!emailValue}
          >
            Resend code
          </LoadingButton>
        </div>

        {resendMutation.isSuccess ? (
          <VerificationStatus
            variant="success"
            title="Code sent"
            description={resendMutation.data.message}
          />
        ) : null}

        <Button asChild variant="ghost" className="w-full">
          <Link href="/login">Back to login</Link>
        </Button>
      </form>
    </AuthFormWrapper>
  )
}
