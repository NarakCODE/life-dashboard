import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

interface AuthFormWrapperProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthFormWrapper({
  title,
  description,
  children,
  footer,
  className,
}: AuthFormWrapperProps) {
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
              <p className="text-sm font-medium text-muted-foreground">
                PM Tools
              </p>
              <CardTitle className="text-xl">{title}</CardTitle>
            </div>
          </Link>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
          {footer ? (
            <div className="text-sm text-muted-foreground">{footer}</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
