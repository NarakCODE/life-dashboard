import type React from "react";
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { AppProviders } from "@/components/providers/app-providers";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import {
  DEFAULT_THEME_PRESET,
  themePresetScript,
} from "@/lib/theme/theme-preset";
import "./globals.css";

export const metadata: Metadata = {
  title: "PM Tools - Project Management",
  description: "Modern project and task management tool with timeline view",
  generator: "v0.app",
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme={DEFAULT_THEME_PRESET}>
      <body className={`font-sans antialiased`}>
        <Script id="theme-preset-script" strategy="beforeInteractive">
          {themePresetScript}
        </Script>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppProviders>
            {children}
            <Analytics />
            <Toaster richColors closeButton />
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
