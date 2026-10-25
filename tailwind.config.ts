import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        kraft: {
          50: "#faf6f0",
          100: "#f3ebe0",
          200: "#e6d5bf",
          300: "#d5ba99",
          400: "#c49e74",
          500: "#b58454",
          600: "#a67146",
          700: "#8a5939",
          800: "#704832",
          900: "#5d3c2b",
        },
        paper: {
          bg: "#0b0f17",
          card: "#121824",
          cardHover: "#182234",
          border: "#1e293b",
          subtle: "#334155",
        }
      },
    },
  },
  plugins: [],
};
export default config;
