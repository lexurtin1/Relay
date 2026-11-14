import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { headers } from "next/headers";
import { Toaster } from "sonner";
import "./globals.css";
import { Header } from "@/components/header";
import { CommandPalette } from "@/components/command-palette";
import { getAppName, isMockMode } from "@/lib/config";
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
  const headerList = await headers();
  const currentPath = headerList.get("x-pathname") ?? "/";

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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-[var(--relay-surface)] focus:px-3 focus:py-2 focus:text-sm focus:shadow"
        >
          Skip to main content
        </a>
        {currentUser ? (
          <Header
            appName={appName}
            mockMode={mockMode}
            currentUser={currentUser}
            users={users}
            currentPath={currentPath}
          />
        ) : (
          <header className="border-b border-[var(--relay-border)] bg-white px-4 py-3 text-sm text-[var(--relay-ink-muted)]">
            {appName} is starting. Waiting for database seed.
          </header>
        )}
        <main id="main" className="mx-auto max-w-[1440px] px-4 py-4">
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
      </body>
    </html>
  );
}
