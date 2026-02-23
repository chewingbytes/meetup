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
        neo: {
          bg: "#FFFDF5",
          white: "#FFFFFF",
          black: "#000000",
          red: "#FF6B6B",
          yellow: "#FFD93D",
          violet: "#C4B5FD",
          green: "#6EE7B7",
          blue: "#93C5FD",
          pink: "#F472B6",
          accent: "#FF6B6B",
          purple: "#A78BFA",
          "green-light": "#D1FAE5",
        }
      },
      fontFamily: {
        space: ["SpaceGrotesk_400Regular"],
        "space-bold": ["SpaceGrotesk_700Bold"],
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
};
