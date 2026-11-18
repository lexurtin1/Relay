import type { Metadata } from "next";
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
import { getAppName, isMockMode } from "@/lib/config";
import { getCurrentUser, listDemoUsers } from "@/lib/session";
import { listWorkstreamCommandItems } from "@/lib/workstreams";
import type { WorkstreamStage } from "@relay/core/domain";

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

  try {
    currentUser = await getCurrentUser();
    users = await listDemoUsers();
    commandItems = await listWorkstreamCommandItems();
  } catch {
    // Database may be unavailable during first boot before migrations.
  }

  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="relative min-h-dvh overflow-x-hidden">
        <ThemeProvider defaultTheme="light">
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
                currentUser={currentUser}
                users={users}
              />
            ) : (
              <header className="relative z-30 shrink-0 border-b border-[var(--relay-border)] bg-[var(--relay-surface)] px-4 py-3 text-sm text-[var(--relay-ink-muted)]">
                {appName} is starting. Waiting for database seed.
              </header>
            )}
            <div className="flex min-h-0 flex-1">
              {currentUser ? <Sidebar /> : null}
              <main
                id="main"
                className="rl-main relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto"
              >
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
