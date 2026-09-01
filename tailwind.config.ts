import type { Config } from "tailwindcss";

const config: Config = {
  // "./lib/**" dazu: einige Tailwind-Klassen (z.B. die Sektions-Akzentfarben in
  // lib/sectionFarben.ts) stehen nur dort als Literal - ohne diesen Pfad im Content-Scan würde
  // der JIT-Compiler sie beim Build als "ungenutzt" verwerfen.
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
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
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 89, 64, 0.04), 0 8px 24px -12px rgba(15, 89, 64, 0.18)",
        "card-hover": "0 4px 10px rgba(15, 89, 64, 0.06), 0 16px 32px -14px rgba(15, 89, 64, 0.28)",
        // Violett-getönte Variante für den Klassen-Bereich (siehe backgroundImage.klassen-gradient
        // hier drunter) - bewusst eigene Farbidentität statt der grünen Marke, damit sich Klassen/
        // Wissensstand/Prüfungen als eigener "Modus" innerhalb von Lernwerk anfühlt.
        "card-klassen": "0 1px 2px rgba(88, 28, 135, 0.05), 0 8px 24px -12px rgba(88, 28, 135, 0.22)",
        "card-klassen-hover": "0 4px 10px rgba(88, 28, 135, 0.08), 0 16px 32px -14px rgba(88, 28, 135, 0.32)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #12704c 0%, #0f5940 100%)",
        "klassen-gradient": "linear-gradient(135deg, #7c3aed 0%, #a21caf 55%, #db2777 100%)",
      },
      keyframes: {
        // Wandernder Balken-Abschnitt für die unbestimmte Fortschrittsanzeige während der
        // Arbeitsblatt-Erstellung (siehe GenerierungLoading.tsx).
        "lade-balken": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(400%)" },
        },
        // Dezentes Einblenden beim Seitenwechsel (siehe app/template.tsx) - bewusst sehr kurz
        // und mit minimaler Bewegung (4px), damit es als angenehmes Detail auffällt statt als
        // spürbare Verzögerung.
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "lade-balken": "lade-balken 1.3s ease-in-out infinite",
        "fade-in": "fade-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
