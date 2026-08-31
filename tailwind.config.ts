import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fbf6",
          100: "#dcf5e7",
          200: "#b8e8cd",
          300: "#87d3ac",
          400: "#4fb384",
          500: "#1e8c60",
          600: "#12704c",
          700: "#0f5940",
          800: "#0e4735",
          900: "#0c3b2d",
        },
        gold: {
          50: "#fbf7ee",
          100: "#f4ead1",
          200: "#e8d29f",
          300: "#dab86c",
          400: "#c9a04a",
          500: "#a97e2e",
          600: "#8c6624",
          700: "#6f4f1e",
        },
        canvas: "#fbfaf7",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        arabic: ["var(--font-arabic)", "Traditional Arabic", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 89, 64, 0.04), 0 8px 24px -12px rgba(15, 89, 64, 0.18)",
        "card-hover": "0 4px 10px rgba(15, 89, 64, 0.06), 0 16px 32px -14px rgba(15, 89, 64, 0.28)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #12704c 0%, #0f5940 100%)",
      },
      keyframes: {
        // Sanftes Einblenden + leichtes Heranzoomen der Basmala beim Erscheinen der
        // Lade-Ansicht (siehe GenerierungLoading.tsx).
        "basmala-in": {
          "0%": { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        // Langsames, dezentes "Atmen" der Basmala während der (teils minutenlangen) Wartezeit,
        // damit die Ansicht sichtbar lebendig bleibt statt eingefroren zu wirken.
        "basmala-breathe": {
          "0%, 100%": { opacity: "0.85" },
          "50%": { opacity: "1" },
        },
        // Goldener Lichtschein, der einmalig quer über die Basmala läuft.
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "basmala-in": "basmala-in 900ms ease-out both",
        "basmala-breathe": "basmala-breathe 3.2s ease-in-out 900ms infinite",
        shimmer: "shimmer 2.8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
