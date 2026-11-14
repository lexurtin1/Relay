/**
 * Brand tokens for Relay (white-labelled Calastone / SS&C).
 * Calastone blue from the logo PNG (#3274C0), with a SaaS purple accent
 * for interactive chrome throughout.
 */
export const brand = {
  nameSource: "APP_NAME",
  fonts: {
    display: '"Gill Sans MT", "Gill Sans", Calibri, sans-serif',
    ui: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    mono: "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  radius: {
    control: "10px",
    card: "14px",
    panel: "18px",
  },
  colors: {
    // Calastone / SS&C
    brand: "#3274C0",
    brandHover: "#2B64A8",
    brandSoft: "#E8F1FB",
    // SaaS purple accent (interactive)
    primary: "#6B5CE7",
    primaryHover: "#5848D6",
    primaryFg: "#FFFFFF",
    primarySoft: "#F1EFFE",
    accent: "#6B5CE7",
    accentMuted: "#8B7FF0",
    ink: "#16181D",
    inkMuted: "#4A5562",
    inkSubtle: "#667085",
    surface: "#FFFFFF",
    surfaceMuted: "#F5F4FB",
    surfaceSunken: "#EEEBF8",
    border: "#DDD8EF",
    borderStrong: "#C4BDE0",
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
