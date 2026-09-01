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
        // Türkis/Teal ist die neue Hauptfarbe der App (vorher Waldgrün) - entspricht Tailwinds
        // eigener "teal"-Skala, damit sie exakt zu den bereits eingeführten Community-/Klassen-
        // Tönen passt (die literal teal-*/emerald-* referenzieren). brand-700/800/900 sind damit
        // bewusst dieselben Werte wie teal-700/800/900 - kein Konflikt, sondern Absicht: "brand"
        // ist jetzt schlicht die Teal-Familie.
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
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
        // Schatten-Basisfarbe an die neue Teal-Hauptfarbe angepasst (Mittelwert aus
        // brand-gradient 700/900, siehe backgroundImage hier drunter).
        card: "0 1px 2px rgba(17, 98, 92, 0.04), 0 8px 24px -12px rgba(17, 98, 92, 0.18)",
        "card-hover": "0 4px 10px rgba(17, 98, 92, 0.06), 0 16px 32px -14px rgba(17, 98, 92, 0.28)",
        // Türkis getönte Variante für den Klassen-Bereich (siehe backgroundImage.klassen-gradient
        // hier drunter) - bewusst nah am Teal von Community (siehe community-gradient), aber
        // heller, damit beide Bereiche als verwandt statt identisch wirken. Gleiche Alpha-Werte
        // wie card/card-hover (nur andere Basisfarbe), damit die Intensität zur Standard-Variante
        // passt statt lauter zu wirken.
        "card-klassen": "0 1px 2px rgba(18, 151, 138, 0.04), 0 8px 24px -12px rgba(18, 151, 138, 0.18)",
        "card-klassen-hover": "0 4px 10px rgba(18, 151, 138, 0.06), 0 16px 32px -14px rgba(18, 151, 138, 0.28)",
      },
      backgroundImage: {
        // Hauptfarbe der App: dunkelstes/"seriösestes" Teal (700->900) - Übersicht, Logo,
        // Landingpage, Standard-Buttons. Community und Klassen nutzen jeweils eine Stufe hellere
        // Teal-Bereiche (siehe direkt drunter), damit alle drei als verwandte Familie wirken, aber
        // im Nav trotzdem auf einen Blick unterscheidbar bleiben (dunkel -> mittel -> hell).
        "brand-gradient": "linear-gradient(135deg, #0f766e 0%, #134e4a 100%)",
        // "Geteilte Arbeitsblätter": eine Stufe heller als die Hauptfarbe (600->800 statt 700->900).
        "community-gradient": "linear-gradient(135deg, #0d9488 0%, #115e59 100%)",
        // Klassen: nochmal eine Stufe heller/frischer (500->700), das hellste der drei Teal-Bänder.
        "klassen-gradient": "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)",
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
