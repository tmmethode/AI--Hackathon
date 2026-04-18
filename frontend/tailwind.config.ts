import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--color-brand)",
          hover: "var(--color-brand-hover)",
          soft: "var(--color-brand-soft)",
          softer: "var(--color-brand-softer)",
        },
        ink: {
          DEFAULT: "var(--color-ink)",
          soft: "var(--color-ink-soft)",
          muted: "var(--color-ink-muted)",
          subtle: "var(--color-ink-subtle)",
        },
        line: {
          DEFAULT: "var(--color-line)",
          strong: "var(--color-line-strong)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          muted: "var(--color-surface-muted)",
          soft: "var(--color-surface-soft)",
        },
        success: {
          DEFAULT: "#1dc956",
          soft: "#d2f9df",
          deep: "#0e642a",
        },
        danger: {
          DEFAULT: "#eb4747",
          soft: "#fde4e4",
        },
        info: {
          deep: "var(--color-info-deep)",
        },
      },
      fontFamily: {
        sans: ["var(--font-open-sans)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        card: "0px 2px 4px 0px rgba(23,25,28,0.07)",
        soft: "0px 3px 6px 0px rgba(18,15,40,0.08)",
      },
      borderRadius: {
        card: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
