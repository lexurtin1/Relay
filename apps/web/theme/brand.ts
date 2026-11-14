/**
 * Brand tokens for Relay (white-labelled Calastone / SS&C).
 * Primary blue sampled from the provided SS&C logo PNG (#3274C0).
 * Other neutrals are placeholders for the official palette.
 */
export const brand = {
  nameSource: "APP_NAME",
  fonts: {
    display: '"Gill Sans MT", "Gill Sans", Calibri, sans-serif',
    ui: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    mono: "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  colors: {
    primary: "#3274C0",
    primaryHover: "#2B64A8",
    primaryFg: "#FFFFFF",
    ink: "#1A1C1E",
    inkMuted: "#4A5562",
    inkSubtle: "#667085",
    surface: "#FFFFFF",
    surfaceMuted: "#F4F5F7",
    surfaceSunken: "#EBEEF2",
    border: "#D5DAE1",
    borderStrong: "#B8C0CC",
    danger: "#B42318",
    dangerSoft: "#FEF3F2",
    warning: "#B54708",
    warningSoft: "#FFFAEB",
    success: "#027A48",
    successSoft: "#ECFDF3",
    live: "#3274C0",
  },
} as const;

export type BrandTokens = typeof brand;
