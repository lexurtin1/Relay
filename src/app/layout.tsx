import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import "./globals.css";
import { Header } from "@/components/header";
import { CommandPalette } from "@/components/command-palette";
import { Sidebar } from "@/components/sidebar";
import { Atmosphere } from "@/components/atmosphere";
import { CalastoneWireframes } from "@/components/calastone-wireframes";
import { ThemeProvider, themeBootScript } from "@/components/theme-provider";
import { AstryxProviders } from "@/components/providers";
import { TourCoach } from "@/components/tour/tour-coach";
import { getAppName, isMockMode } from "@/lib/config";
import { isDemoMode } from "@/lib/db";
import { DemoStoreProvider } from "@/lib/demo-store/provider";
import { buildDemoSeed } from "@/lib/demo-store/seed";
import { getCurrentUser, listDemoUsers } from "@/lib/session";
import { listWorkstreamCommandItems } from "@/lib/workstreams";
import type { WorkstreamStage } from "@relay/core/domain";

export const metadata: Metadata = {
  title: "Relay",
  description: "Calastone agent workspace: from problem to merged pull request",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const appName = getAppName();
  const mockMode = isMockMode();
  const demo = isDemoMode();

  let currentUser = null;
  let users: Awaited<ReturnType<typeof listDemoUsers>> = [];
  let commandItems: Awaited<ReturnType<typeof listWorkstreamCommandItems>> = [];

  try {
    currentUser = await getCurrentUser();
    users = await listDemoUsers();
    commandItems = demo ? [] : await listWorkstreamCommandItems();
  } catch {
    // Database may be unavailable during first boot before migrations.
  }

  const shell = (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-[var(--relay-surface)] focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to main content
      </a>
      <CalastoneWireframes />
      <Atmosphere />
      <div className="relative z-10 flex h-dvh min-h-0 flex-col">
        {currentUser ? (
          <Header
            appName={appName}
            mockMode={mockMode}
            currentUser={{ id: currentUser.id, name: currentUser.name, role: currentUser.role }}
            users={users.map((u) => ({ id: u.id, name: u.name, role: u.role }))}
          />
        ) : (
          <header className="relative z-30 shrink-0 border-b border-[var(--relay-border)] bg-[var(--relay-surface)] px-4 py-3 text-sm text-[var(--relay-ink-muted)]">
            {appName} is starting. Waiting for database seed.
          </header>
        )}
        <div className="flex min-h-0 flex-1">
          {currentUser ? <Sidebar /> : null}
          <main id="main" className="rl-main relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
      {currentUser ? (
        <CommandPalette
          workstreams={commandItems.map((item) => ({
            id: item.id,
            title: item.title,
            jiraKey: item.jiraKey,
            stage: item.stage as WorkstreamStage,
          }))}
        />
      ) : null}
      {demo ? <TourCoach /> : null}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "font-[var(--relay-font-ui)] text-sm",
        }}
      />
    </>
  );

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="relative min-h-dvh overflow-x-hidden">
        <ThemeProvider defaultTheme="light">
          <AstryxProviders>
            {demo ? <DemoStoreProvider seed={buildDemoSeed(Date.now())}>{shell}</DemoStoreProvider> : shell}
          </AstryxProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
