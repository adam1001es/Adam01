import type { Config } from "tailwindcss";

const config: Config = {
  // "./lib/**" dazu: einige Tailwind-Klassen (z.B. die Sektions-Akzentfarben in
  // lib/sectionFarben.ts) stehen nur dort als Literal - ohne diesen Pfad im Content-Scan würde
  // der JIT-Compiler sie beim Build als "ungenutzt" verwerfen.
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  // Klassenbasierter statt medienabfrage-basierter Dark Mode: die .dark-Klasse landet auf <html>
  // (siehe app/layout.tsx Inline-Script + components/ThemeToggle.tsx), damit die gespeicherte
  // Nutzer-Präferenz (nicht nur die System-Einstellung) den Ausschlag gibt.
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Neutrale UI-Farben (Seiten-Hintergrund, Karten-Fläche, Grautöne für Text/Rahmen) sind
        // bewusst über CSS-Variablen an :root/.dark gebunden (siehe app/globals.css) statt fixer
        // Hex-Werte - so passt sich praktisch die GESAMTE App an den Dark Mode an, ohne dass jede
        // einzelne Komponente eine "dark:"-Variante pro Klasse braucht. Die "rgb(var(...) /
        // <alpha-value>)"-Schreibweise erhält dabei Tailwinds Opacity-Modifier (z.B. bg-white/90).
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        slate: {
          50: "rgb(var(--color-slate-50) / <alpha-value>)",
          100: "rgb(var(--color-slate-100) / <alpha-value>)",
          200: "rgb(var(--color-slate-200) / <alpha-value>)",
          300: "rgb(var(--color-slate-300) / <alpha-value>)",
          400: "rgb(var(--color-slate-400) / <alpha-value>)",
          500: "rgb(var(--color-slate-500) / <alpha-value>)",
          600: "rgb(var(--color-slate-600) / <alpha-value>)",
          700: "rgb(var(--color-slate-700) / <alpha-value>)",
          800: "rgb(var(--color-slate-800) / <alpha-value>)",
          900: "rgb(var(--color-slate-900) / <alpha-value>)",
        },
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
        // Wissensstand/Prüfungen als eigener "Modus" innerhalb von Lernwerk anfühlt. Gleiche
        // Alpha-Werte wie card/card-hover (nur andere Basisfarbe), damit die Intensität zur
        // grünen Variante passt statt lauter zu wirken.
        "card-klassen": "0 1px 2px rgba(170, 45, 223, 0.04), 0 8px 24px -12px rgba(170, 45, 223, 0.18)",
        "card-klassen-hover": "0 4px 10px rgba(170, 45, 223, 0.06), 0 16px 32px -14px rgba(170, 45, 223, 0.28)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #12704c 0%, #0f5940 100%)",
        // Für "Geteilte Arbeitsblätter" (Community) - bewusst nur ein leichter Ton-Unterschied
        // zum brand-gradient der Übersicht (etwas kühler/türkiser statt waldgrün), damit beide
        // Bereiche auf den ersten Blick unterscheidbar sind, aber klar in derselben grünen
        // Farbfamilie bleiben statt wie ein eigener Modus wie Klassen zu wirken.
        "community-gradient": "linear-gradient(135deg, #0d9488 0%, #115e59 100%)",
        // Gedämpfter Violett-Ton für den Klassen-Bereich: nah beieinanderliegende Farbtöne
        // (Purple->Fuchsia statt Violett->Pink) statt eines kontrastreichen Drei-Farben-Sweeps.
        "klassen-gradient": "linear-gradient(135deg, #9333ea 0%, #c026d3 100%)",
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
