import type { Config } from "tailwindcss";

/**
 * Clay Design System — ported from the Expo app's theme/clay.ts so the webapp
 * is visually identical to the native experience.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F1FA",
        surface: "#FFFFFF",
        surfaceWarm: "#FAF8FF",
        textPrimary: "#332F3A",
        textSecondary: "#635F69",
        textTertiary: "#9B96A3",
        accent: "#7C3AED",
        accentLight: "#A78BFA",
        accentPink: "#DB2777",
        accentBlue: "#0EA5E9",
        accentGreen: "#10B981",
        accentAmber: "#F59E0B",
        accentCoral: "#F87171",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#0EA5E9",
        accentMuted: "#EDE9FE",
        pinkMuted: "#FCE7F3",
        blueMuted: "#E0F2FE",
        greenMuted: "#D1FAE5",
        amberMuted: "#FEF3C7",
      },
      fontFamily: {
        heading: ["var(--font-nunito)", "system-ui", "sans-serif"],
        body: ["var(--font-dmsans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "20px",
        xl: "28px",
        xxl: "36px",
        xxxl: "48px",
      },
      boxShadow: {
        clayCard: "0 8px 24px rgba(124,58,237,0.13)",
        clayCardSm: "0 4px 14px rgba(124,58,237,0.08)",
        clayButton: "0 6px 14px rgba(124,58,237,0.28)",
        clayHero: "0 16px 40px rgba(124,58,237,0.18)",
      },
      keyframes: {
        "sheet-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "sheet-up-fade": {
          "0%": { transform: "translateY(24px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "drawer-in": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.4) translateY(12px)", opacity: "0" },
          "60%": { transform: "scale(1.06) translateY(0)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.7" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
      },
      animation: {
        "sheet-up": "sheet-up 0.32s cubic-bezier(0.16,1,0.3,1)",
        "sheet-up-fade": "sheet-up-fade 0.28s cubic-bezier(0.16,1,0.3,1)",
        "drawer-in": "drawer-in 0.3s cubic-bezier(0.16,1,0.3,1)",
        "fade-in": "fade-in 0.2s ease-out",
        "pop-in": "pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        "pulse-ring": "pulse-ring 1.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
