import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { getAppName, isMockMode } from "@/lib/config";
import { getCurrentUser, listDemoUsers } from "@/lib/session";

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

  try {
    currentUser = await getCurrentUser();
    users = await listDemoUsers();
  } catch {
    // Database may be unavailable during first boot before migrations.
  }

  return (
    <html lang="en">
      <body>
        {currentUser ? (
          <Header
            appName={appName}
            mockMode={mockMode}
            currentUser={currentUser}
            users={users}
          />
        ) : (
          <header className="border-b border-[var(--relay-border)] bg-white px-4 py-3 text-sm text-[var(--relay-ink-muted)]">
            {appName} is starting. Waiting for database seed.
          </header>
        )}
        <main className="mx-auto max-w-[1400px] px-4 py-4">{children}</main>
      </body>
    </html>
  );
}
