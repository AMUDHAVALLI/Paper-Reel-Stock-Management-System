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
      fontFamily: {
        sans: ['var(--font-nunito-sans)', 'Nunito Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['var(--font-poppins)', 'Poppins', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          DEFAULT: '#d97706',
          hover: '#b45309',
          glow: 'rgba(217, 119, 6, 0.25)',
        },
        theme: {
          base: '#f8fafc',
          surface: '#ffffff',
          card: '#ffffff',
          cardHover: '#fbfaf8',
          border: '#e2e8f0',
        },
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
          bg: "#f8fafc",
          card: "#ffffff",
          cardHover: "#fbfaf8",
          border: "#e2e8f0",
          subtle: "#cbd5e1",
        }
      },
    },
  },
  plugins: [],
};
export default config;
