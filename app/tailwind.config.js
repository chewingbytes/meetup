/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,tsx,ts,jsx}",
    "./components/**/*.{js,tsx,ts,jsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ── Clay Design System ──────────────────────────────────────────
        clay: {
          canvas:        "#F4F1FA",
          surface:       "#FFFFFF",
          primary:       "#332F3A",
          muted:         "#635F69",
          accent:        "#7C3AED",
          "accent-light":"#A78BFA",
          pink:          "#DB2777",
          blue:          "#0EA5E9",
          green:         "#10B981",
          amber:         "#F59E0B",
          coral:         "#F87171",
          "accent-muted":"#EDE9FE",
          "pink-muted":  "#FCE7F3",
          "blue-muted":  "#E0F2FE",
          "green-muted": "#D1FAE5",
          "amber-muted": "#FEF3C7",
        },
        // ── neo tokens remapped to clay palette (backward-compat) ───────
        neo: {
          bg:           "#F4F1FA",
          white:        "#FFFFFF",
          black:        "#332F3A",
          red:          "#F87171",
          yellow:       "#F59E0B",
          violet:       "#A78BFA",
          green:        "#10B981",
          blue:         "#0EA5E9",
          pink:         "#DB2777",
          accent:       "#7C3AED",
          purple:       "#7C3AED",
          "green-light":"#D1FAE5",
        },
      },
      fontFamily: {
        heading:        ["Nunito_800ExtraBold", "System"],
        "heading-bold": ["Nunito_900Black", "System"],
        "heading-md":   ["Nunito_700Bold", "System"],
        body:           ["DMSans_400Regular", "System"],
        "body-md":      ["DMSans_500Medium", "System"],
        "body-bold":    ["DMSans_700Bold", "System"],
        space:          ["Nunito_700Bold", "System"],
        "space-bold":   ["Nunito_800ExtraBold", "System"],
      },
      borderRadius: {
        "clay-xs":  "8px",
        "clay-sm":  "12px",
        "clay-md":  "16px",
        "clay-lg":  "20px",
        "clay-xl":  "28px",
        "clay-2xl": "36px",
        "clay-3xl": "48px",
      },
      borderWidth: {
        "3": "3px",
      },
    },
  },
  plugins: [],
};
