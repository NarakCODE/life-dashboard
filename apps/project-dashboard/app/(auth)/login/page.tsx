"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FlaskConical, Rocket } from "lucide-react";
import Image from "next/image";

import { getErrorMessage } from "@/components/auth/auth-error";
import { LoadingButton } from "@/components/auth/loading-button";
import { PasswordInput } from "@/components/auth/password-input";
import { VerificationStatus } from "@/components/auth/verification-status";
import {
  useLoginMutation,
  useResendVerificationMutation,
  useDevBootstrapMutation,
} from "@/lib/auth/auth-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function isUnverifiedEmailErrorMessage(message: string | undefined) {
  return message?.toLowerCase().includes("not verified") ?? false;
}

function LoginContent({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginMutation = useLoginMutation();
  const resendMutation = useResendVerificationMutation();
  const devBootstrapMutation = useDevBootstrapMutation();
  const nextTarget = searchParams.get("next") || "/";
  const [isDevelopment, setIsDevelopment] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    setIsDevelopment(window.location.hostname === "localhost");
  }, []);

  const emailValue = form.watch("email");
  const rootError = form.formState.errors.root?.message;
  const hasUnverifiedEmailError = isUnverifiedEmailErrorMessage(rootError);

  async function handleResendVerification() {
    try {
      await resendMutation.mutateAsync({ email: emailValue });
    } catch (error) {
      form.setError("root", {
        message: getErrorMessage(error, "Unable to resend verification email"),
      });
    }
  }

  async function handleDevBootstrap() {
    try {
      await devBootstrapMutation.mutateAsync();
      router.replace(nextTarget);
    } catch (error) {
      form.setError("root", {
        message: getErrorMessage(error, "Unable to bootstrap a local dev session"),
      });
    }
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await loginMutation.mutateAsync(values);
      router.replace(nextTarget);
    } catch (error) {
      const message = getErrorMessage(error, "Unable to sign in");

      if (isUnverifiedEmailErrorMessage(message)) {
        const params = new URLSearchParams({
          email: values.email,
          message,
        });
        router.push(`/verify-email?${params.toString()}`);
        return;
      }

      form.setError("root", { message });
    }
  });

  return (
    <div className={cn("w-full max-w-md", className)}>
      <Card className="border-border/60 shadow-xl shadow-black/5">
        <CardHeader className="space-y-4">
          <Link href="/" className="flex items-center gap-3 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-800 text-primary-foreground shadow-[inset_0_-5px_6.6px_0_rgba(0,0,0,0.25)]">
              <Image
                src="/logo-wrapper.png"
                alt="PM Tools"
                className="h-5 w-5"
                width={200}
                height={200}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">PM Tools</p>
              <CardTitle className="text-xl">Sign in</CardTitle>
            </div>
          </Link>
          <CardDescription>
            Use your email and password. If your email is still unverified, finish
            verification before logging in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  {...form.register("email")}
                />
                <FieldError>{form.formState.errors.email?.message}</FieldError>
              </Field>

              <Field>
                <div className="flex items-center justify-between gap-4">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <span className="text-xs text-muted-foreground">
                    Forgot password is not yet supported
                  </span>
                </div>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...form.register("password")}
                />
                <FieldError>{form.formState.errors.password?.message}</FieldError>
              </Field>
            </FieldGroup>

            {rootError ? (
              <VerificationStatus
                variant={hasUnverifiedEmailError ? "warning" : "error"}
                title={hasUnverifiedEmailError ? "Email verification required" : "Login failed"}
                description={rootError}
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
                  <Link href={`/verify-email?email=${encodeURIComponent(emailValue)}`}>
                    Verify email
                  </Link>
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
                      <FlaskConical className="h-4 w-4 text-muted-foreground" />
                      Local Dev Access
                    </CardTitle>
                    <CardDescription className="text-xs">
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
                      <Rocket className="mr-2 h-4 w-4" />
                      Use local development account
                    </LoadingButton>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Need an account?{" "}
              <Link
                href="/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Register
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex w-full items-center justify-center px-4 py-12">
      <LoginContent />
    </div>
  );
}
