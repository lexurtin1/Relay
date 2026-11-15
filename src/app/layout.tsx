import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import "./globals.css";
import { Header } from "@/components/header";
import { CommandPalette } from "@/components/command-palette";
import { ThemeProvider, themeBootScript } from "@/components/theme-provider";
import { getAppName, isMockMode } from "@/lib/config";
import { getOverviewData } from "@/lib/overview";
import { getCurrentUser, listDemoUsers } from "@/lib/session";
import { listWorkstreamCommandItems } from "@/lib/workstreams";
import type { WorkstreamStage } from "@relay/core";

export const metadata: Metadata = {
  title: "Relay",
  description: "Calastone internal agent workspace prototype",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appName = getAppName();
  const mockMode = isMockMode();

  let currentUser = null;
  let users: Awaited<ReturnType<typeof listDemoUsers>> = [];
  let commandItems: Awaited<ReturnType<typeof listWorkstreamCommandItems>> = [];
  let agentsActive = 0;

  try {
    currentUser = await getCurrentUser();
    users = await listDemoUsers();
    commandItems = await listWorkstreamCommandItems();
    const overview = await getOverviewData();
    agentsActive = overview.agentsActive;
  } catch {
    // Database may be unavailable during first boot before migrations.
  }

  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="relative min-h-screen overflow-x-hidden bg-[var(--relay-bg)]">
        <ThemeProvider defaultTheme="dark">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-[var(--relay-surface)] focus:px-3 focus:py-2 focus:text-sm focus:shadow"
          >
            Skip to main content
          </a>
          <div
            aria-hidden
            className="pointer-events-none fixed inset-x-0 top-0 z-0 h-40 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--relay-brand)_18%,transparent),transparent)]"
          />
          {currentUser ? (
            <Header
              appName={appName}
              mockMode={mockMode}
              currentUser={currentUser}
              users={users}
              agentsActive={agentsActive}
            />
          ) : (
            <header className="relative z-30 border-b border-[var(--relay-border)] px-4 py-3 text-sm text-[var(--relay-ink-muted)]">
              {appName} is starting. Waiting for database seed.
            </header>
          )}
          <main
            id="main"
            className="relative z-10 mx-auto max-w-[1120px] px-7 pb-16 pt-24"
          >
            {children}
          </main>
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
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "font-[var(--relay-font-ui)] text-sm",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
