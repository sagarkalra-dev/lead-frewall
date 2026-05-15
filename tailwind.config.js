/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          900: "#07070d",
          800: "#0d0d16",
          700: "#12121f",
          600: "#1a1a2e",
          500: "#242440",
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
