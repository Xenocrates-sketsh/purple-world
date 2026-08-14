import type { Config } from "tailwindcss";

const hsl = (v: string) => `hsl(var(--${v}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: hsl("background"),
        foreground: hsl("foreground"),
        surface: {
          DEFAULT: hsl("surface"),
          muted: hsl("surface-muted"),
          elevated: hsl("surface-elevated"),
        },
        border: hsl("border"),
        input: hsl("input"),
        ring: hsl("ring"),
        muted: {
          DEFAULT: hsl("muted"),
          foreground: hsl("muted-foreground"),
        },
        primary: {
          DEFAULT: hsl("primary"),
          foreground: hsl("primary-foreground"),
          soft: hsl("primary-soft"),
          muted: hsl("primary-muted"),
        },
        accent: {
          DEFAULT: hsl("accent"),
          foreground: hsl("accent-foreground"),
        },
        success: {
          DEFAULT: hsl("success"),
          soft: hsl("success-soft"),
        },
        warning: {
          DEFAULT: hsl("warning"),
          soft: hsl("warning-soft"),
        },
        danger: {
          DEFAULT: hsl("danger"),
          soft: hsl("danger-soft"),
        },
        info: {
          DEFAULT: hsl("info"),
          soft: hsl("info-soft"),
        },
        purple: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
          950: "#3b0764",
        },
      },
      borderRadius: {
        xl: "0.85rem",
        "2xl": "1.1rem",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        lg: "var(--shadow-lg)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "zoom-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        "fade-in": "fade-in 0.2s ease-out both",
        "fade-in-up": "fade-in-up 0.25s ease-out both",
        "zoom-in": "zoom-in 0.18s ease-out both",
        "toast-in": "toast-in 0.2s ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;
