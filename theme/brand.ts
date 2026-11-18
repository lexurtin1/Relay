/**
 * Brand tokens for Relay (white-labelled Calastone / SS&C).
 * Light-first Operate shell (sidebar + elevated sheets); dark remains available.
 * Calastone blues for primary / live. AI Gateway purple used only for active nav
 * and selected chips (matches SS&C AI Governance accents).
 */
export const brand = {
  nameSource: "APP_NAME",
  fonts: {
    ui: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    mono: "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  radius: {
    control: "12px",
    card: "16px",
    panel: "20px",
    pill: "999px",
  },
  colors: {
    // Calastone blues
    brand: "#2B6FD6",
    brandHover: "#3F82E0",
    brandSoft: "rgba(63, 130, 224, 0.18)",
    brandFg: "#8DBBFA",
    primary: "#F2F5FA",
    primaryHover: "#FFFFFF",
    primaryFg: "#0D131F",
    primarySoft: "rgba(242, 245, 250, 0.12)",
    accent: "#3F82E0",
    accentMuted: "#6FA9F5",
    // Dark ground (default)
    ink: "#F2F5FA",
    inkMuted: "#A9B4C6",
    inkSubtle: "#8E9AAF",
    inkBody: "#D5DCE8",
    surface: "#0D131F",
    surfaceMuted: "#060A12",
    surfaceSunken: "#1A2233",
    border: "rgba(255, 255, 255, 0.12)",
    borderStrong: "rgba(255, 255, 255, 0.18)",
    // Status
    danger: "#F97066",
    dangerSoft: "rgba(249, 112, 102, 0.12)",
    warning: "#F5B24A",
    warningSoft: "rgba(245, 178, 74, 0.1)",
    success: "#86D9AE",
    successSoft: "rgba(134, 217, 174, 0.12)",
    live: "#6FA9F5",
    // Timeline segments
    segPerson: "#DDE4EF",
    segAgent: "#3F82E0",
    segWaitA: "#F0A630",
    segWaitB: "#B8780F",
    // Atmosphere: Calastone blue only (no green / teal decoration)
    blobBlue: "#2B6FD6",
    blobAmber: "#D9861C",
    // Wireframe polyhedra: light blue → brand blue
    wireTeal: "#6FA9F5",
    wireBlue: "#3F82E0",
  },
  light: {
    ink: "#0D131F",
    inkMuted: "#4A5562",
    inkSubtle: "#667085",
    inkBody: "#1A2233",
    surface: "#FFFFFF",
    surfaceMuted: "#F2F5FA",
    surfaceSunken: "#E8EDF5",
    border: "rgba(13, 19, 31, 0.12)",
    borderStrong: "rgba(13, 19, 31, 0.18)",
    primary: "#2B6FD6",
    primaryHover: "#245DB8",
    primaryFg: "#FFFFFF",
    primarySoft: "#E8F1FB",
    brandSoft: "#E8F1FB",
    blobBlue: "#2B6FD6",
    wireTeal: "#5B8FD4",
    wireBlue: "#2B6FD6",
  },
} as const;

export type BrandTokens = typeof brand;
