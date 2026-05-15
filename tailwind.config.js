/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          900: "var(--s-900)",
          800: "var(--s-800)",
          700: "var(--s-700)",
          600: "var(--s-600)",
          500: "var(--s-500)",
        },
        th: {
          primary: "var(--t-primary)",
          secondary: "var(--t-secondary)",
          muted: "var(--t-muted)",
          faint: "var(--t-faint)",
        },
        accent: {
          DEFAULT: "#6366f1",
          light: "#818cf8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "slide-in": "slideIn 0.4s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "score-fill": "scoreFill 1s ease-out forwards",
      },
      keyframes: {
        slideIn: {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scoreFill: {
          "0%": { width: "0%" },
          "100%": { width: "var(--score-width)" },
        },
      },
    },
  },
  plugins: [],
};
