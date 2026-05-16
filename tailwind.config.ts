import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "notes-wood": "#1a0f0a",
        "notes-leather": "#3e240c",
        "notes-paper": "#fdfbf7",
        "notes-ink": "#2c2c2c"
      },
      keyframes: {
        liquidWave: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        }
      },
      animation: {
        liquidWave: "liquidWave 2s ease-in-out infinite"
      }
    }
  },
  plugins: []
} satisfies Config;
