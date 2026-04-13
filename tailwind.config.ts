import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1f8cf9",
          hover: "#1976d9",
          soft: "#f0f7ff",
          softer: "#d7ebfe",
        },
        ink: {
          DEFAULT: "#16181d",
          soft: "#1e2128",
          muted: "#9196a1",
          subtle: "#343842",
        },
        line: {
          DEFAULT: "#e0e2e6",
          strong: "#bec2ca",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f9fafb",
          soft: "#f3f4f6",
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
          deep: "#03407c",
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
