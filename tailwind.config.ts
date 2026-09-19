import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "var(--ink)",
          muted: "var(--ink-muted)",
        },
        canvas: "var(--canvas)",
        surface: {
          DEFAULT: "var(--surface)",
          soft: "var(--surface-soft)",
        },
        border: "var(--border)",
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
        },
        brandGreen: {
          DEFAULT: "var(--green)",
          soft: "var(--green-soft)",
        },
        brandBlue: {
          DEFAULT: "var(--blue)",
          soft: "var(--blue-soft)",
        },
        brandOrange: {
          DEFAULT: "var(--orange)",
          soft: "var(--orange-soft)",
        },
        brandRed: {
          DEFAULT: "var(--red)",
          soft: "var(--red-soft)",
        },
      },
      borderRadius: {
        sm: "10px",
        card: "16px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,24,50,.04), 0 8px 28px rgba(18,24,50,.035)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-newsreader)", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
