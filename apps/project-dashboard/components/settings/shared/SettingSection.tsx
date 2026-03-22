"use client";

import type { ReactNode } from "react";

export function SettingSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
