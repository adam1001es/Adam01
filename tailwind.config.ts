import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf6",
          100: "#dcfce9",
          500: "#0f9d58",
          600: "#0c7d46",
          700: "#0a6338",
        },
      },
    },
  },
  plugins: [],
};

export default config;
