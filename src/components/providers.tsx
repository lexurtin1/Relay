"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Theme } from "@astryxdesign/core/theme";
import { LinkProvider } from "@astryxdesign/core/Link";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { useTheme } from "@/components/theme-provider";

/**
 * Astryx provider. Relay's ThemeProvider owns light and dark; the root
 * Astryx Theme also writes data-theme to <html>, so it is always given the
 * same mode to keep the two in agreement. Colours come from
 * src/app/astryx-theme.css, which maps Astryx tokens onto Relay tokens.
 */
export function AstryxProviders(props: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <Theme theme={neutralTheme} mode={theme}>
      <LinkProvider component={Link}>{props.children}</LinkProvider>
    </Theme>
  );
}
