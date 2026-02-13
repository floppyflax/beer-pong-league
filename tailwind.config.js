/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // --- Task 1: Couleurs (AC: 1) ---
      colors: {
        // Fond principal et surfaces
        background: {
          primary: "#0f172a", // slate-900
          secondary: "#1e293b", // slate-800
          tertiary: "#334155", // slate-700
        },
        // Texte
        text: {
          primary: "#ffffff", // white
          secondary: "#cbd5e1", // slate-300
          tertiary: "#94a3b8", // slate-400
          muted: "#64748b", // slate-500
        },
        // Accents (primary=amber pour migration progressive; gradient-cta pour nouveau design)
        primary: "#f59e0b", // amber-500 (legacy + landing)
        success: "#22c55e", // green-500
        error: "#ef4444", // red-500
        elo: "#f59e0b", // amber-500 (ELO highlight)
        info: "#3b82f6", // blue-500
        // Sémantique
        "status-active": "#f59e0b", // amber-500
        "status-finished": "#22c55e", // green-500
        "delta-positive": "#22c55e", // green-500
        "delta-negative": "#ef4444", // red-500
        // Legacy aliases (migration progressive)
        secondary: "#1e293b",
        accent: "#ef4444",
      },
      // --- Task 2: Gradients (AC: 2) ---
      backgroundImage: {
        "gradient-cta": "linear-gradient(to right, #f59e0b, #eab308)", // amber-500 → yellow-500
        "gradient-cta-alt": "linear-gradient(to right, #3b82f6, #7c3aed)", // blue-500 → violet-600
        "gradient-fab": "linear-gradient(to right, #3b82f6, #7c3aed)", // blue-500 → violet-600
        "gradient-tab-active": "linear-gradient(to right, #3b82f6, #7c3aed)",
        "gradient-card":
          "linear-gradient(to left, rgba(51, 65, 85, 0.85), rgba(30, 41, 59, 0.85))", // slate-700 → slate-800, avec transparence
        "gradient-card-transparent":
          "linear-gradient(to left, rgba(51, 65, 85, 0.7), rgba(30, 41, 59, 0.7))", // variante plus transparente (landing, overlays)
      },
      // --- Task 3: Typographie (AC: 3) ---
      fontSize: {
        "page-title": ["1.25rem", { lineHeight: "1.75rem", fontWeight: "700" }], // text-xl mobile
        "page-title-lg": ["1.5rem", { lineHeight: "2rem", fontWeight: "700" }], // text-2xl desktop
        "section-title": [
          "1.125rem",
          { lineHeight: "1.75rem", fontWeight: "700" },
        ],
        body: ["1rem", { lineHeight: "1.5rem" }],
        "body-sm": ["0.875rem", { lineHeight: "1.25rem" }],
        label: ["0.875rem", { lineHeight: "1.25rem", fontWeight: "500" }],
        stat: ["1.5rem", { lineHeight: "2rem", fontWeight: "700" }],
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      // --- Task 4: Espacements (AC: 4) ---
      spacing: {
        page: "1rem", // p-4 mobile
        "page-lg": "1.5rem", // p-6 desktop
        "card-gap": "1rem", // gap-4
        "card-gap-lg": "1.5rem", // gap-6
        "bottom-nav": "5rem", // pb-20
        "bottom-nav-lg": "6rem", // pb-24
      },
      padding: {
        page: "1rem",
        "page-lg": "1.5rem",
        card: "1rem",
        "card-lg": "1.5rem",
      },
      gap: {
        card: "1rem",
        "card-lg": "1.5rem",
      },
      margin: {
        "bottom-nav": "5rem",
        "bottom-nav-lg": "6rem",
      },
      // --- Task 5: Radius et bordures (AC: 5) ---
      borderRadius: {
        card: "0.75rem", // rounded-xl (12px)
        button: "0.5rem", // rounded-lg (8px)
        input: "0.75rem", // rounded-xl
      },
      borderColor: {
        card: "#334155", // slate-700
        "card-muted": "rgba(51, 65, 85, 0.5)", // slate-700/50
      },
      borderWidth: {
        card: "1px",
      },
      // --- Task 6: Screens (Frame 1–11 cohérence) ---
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1440px",
      },
      // Élévations (design-system 3.6)
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        fab: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        modal: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
      },
    },
  },
  plugins: [],
};
