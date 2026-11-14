/**
 * Brand tokens for Relay (white-labelled Calastone / SS&C).
 * Primary blue was sampled from the provided SS&C logo PNG (#3274C0).
 * Remaining neutrals are placeholders you can replace with the official palette.
 */
export const brand = {
  nameSource: "APP_NAME",
  fonts: {
    sans: '"Gill Sans MT", "Gill Sans", Calibri, sans-serif',
  },
  colors: {
    // From provided logo asset
    primary: "#3274C0",
    primaryHover: "#2B64A8",
    // Neutral placeholders (replace with official palette)
    ink: "#1A1C1E",
    inkMuted: "#5C6370",
    inkSubtle: "#8B929E",
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
    mockBadge: "#6941C6",
    mockBadgeSoft: "#F4F3FF",
  },
} as const;

export type BrandTokens = typeof brand;
