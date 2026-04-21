/** @type {import('tailwindcss').Config} */
// PONGLO — Arcade design system (dark + neon + Space Grotesk + JetBrains Mono)
// Reference: /tmp/bpl-design/tokens.js (system: arcade)
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // -------------------------------------------------------------
      // Palette Arcade
      // -------------------------------------------------------------
      colors: {
        // Surfaces (dark night / under the neons)
        cream: "#0B0D14", // app background
        "cream-deep": "#050710", // deeper panels
        paper: "#141826", // cards
        // Text / ink (inverted for dark)
        ink: "#F4F2E8", // primary text
        "ink-soft": "#B8B4A3", // secondary text
        "ink-mute": "#6B6A5E", // tertiary text
        // Brand cups
        "cup-red": "#FF4438",
        "cup-red-deep": "#C42418",
        "cup-blue": "#3B8EFF",
        "cup-blue-deep": "#0052D4",
        "cup-green": "#B8FF3D",
        "cup-green-deep": "#8BCC1F",
        // Aliases Ponglo
        forest: "#3B8EFF",
        "forest-deep": "#0052D4",
        terracotta: "#FF4438",
        "terracotta-deep": "#C42418",
        // Signals
        lime: "#B8FF3D",
        gold: "#FFB800",
        ruby: "#FF4438",

        // -----------------------------------------------------------
        // Legacy aliases (Epic 14 compat — remap onto Arcade palette)
        // Kept to keep the app compiling during the reskin. These WILL
        // be removed once all components are migrated.
        // -----------------------------------------------------------
        background: {
          primary: "#0B0D14", // → cream
          secondary: "#141826", // → paper
          tertiary: "#1F2433", // slightly lighter paper
        },
        text: {
          primary: "#F4F2E8", // → ink
          secondary: "#B8B4A3", // → ink-soft
          tertiary: "#8A8878",
          muted: "#6B6A5E", // → ink-mute
        },
        primary: "#FF4438", // → terracotta (was amber)
        success: "#B8FF3D", // → lime
        error: "#FF4438", // → ruby
        elo: "#B8FF3D", // → lime (ELO highlight)
        info: "#3B8EFF", // → cup-blue
        "status-active": "#FF4438",
        "status-finished": "#B8FF3D",
        "delta-positive": "#B8FF3D",
        "delta-negative": "#FF4438",
        secondary: "#141826",
        accent: "#FF4438",
      },

      // -------------------------------------------------------------
      // Typography — Space Grotesk (body/display) + JetBrains Mono
      //               Archivo kept as display fallback
      // -------------------------------------------------------------
      fontFamily: {
        sans: ["Space Grotesk", "Archivo", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Archivo", "system-ui", "sans-serif"],
        archivo: ["Archivo", "Space Grotesk", "system-ui", "sans-serif"],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SF Mono",
          "Menlo",
          "monospace",
        ],
      },
      fontSize: {
        "page-title": [
          "1.25rem",
          { lineHeight: "1.75rem", fontWeight: "700" },
        ],
        "page-title-lg": [
          "1.5rem",
          { lineHeight: "2rem", fontWeight: "700" },
        ],
        "section-title": [
          "1.125rem",
          { lineHeight: "1.75rem", fontWeight: "700" },
        ],
        body: ["1rem", { lineHeight: "1.5rem" }],
        "body-sm": ["0.875rem", { lineHeight: "1.25rem" }],
        label: ["0.875rem", { lineHeight: "1.25rem", fontWeight: "500" }],
        stat: ["1.5rem", { lineHeight: "2rem", fontWeight: "700" }],
        // Arcade display — for huge ELO numbers, scoreboard
        "display-sm": [
          "2rem",
          { lineHeight: "2rem", fontWeight: "700", letterSpacing: "-0.02em" },
        ],
        "display-md": [
          "2.75rem",
          {
            lineHeight: "2.75rem",
            fontWeight: "800",
            letterSpacing: "-0.03em",
          },
        ],
        "display-lg": [
          "4rem",
          { lineHeight: "3.75rem", fontWeight: "900", letterSpacing: "-0.04em" },
        ],
      },

      // -------------------------------------------------------------
      // Spacing (kept from Epic 14 — these are layout tokens)
      // -------------------------------------------------------------
      spacing: {
        page: "1rem",
        "page-lg": "1.5rem",
        "card-gap": "1rem",
        "card-gap-lg": "1.5rem",
        "bottom-nav": "5rem",
        "bottom-nav-lg": "6rem",
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

      // -------------------------------------------------------------
      // Radius — Arcade sharp
      // xs:2, sm:4, md:6, lg:10, xl:14, full:9999
      // -------------------------------------------------------------
      borderRadius: {
        xs: "2px",
        sm: "4px",
        md: "6px",
        lg: "10px",
        xl: "14px",
        // Legacy component radius (remapped sharper)
        card: "10px", // was 12px
        button: "6px", // was 8px
        input: "6px", // was 12px
      },
      borderColor: {
        card: "rgba(244, 242, 232, 0.14)", // ink with alpha
        "card-muted": "rgba(244, 242, 232, 0.06)",
      },
      borderWidth: {
        card: "1px",
      },

      // -------------------------------------------------------------
      // Screens
      // -------------------------------------------------------------
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1440px",
      },

      // -------------------------------------------------------------
      // Shadows — Arcade neon (glow + hairline ink outline)
      // -------------------------------------------------------------
      boxShadow: {
        card: "0 0 0 1px rgba(244,242,232,0.06), 0 8px 24px rgba(0,0,0,0.5)",
        "card-lg":
          "0 0 0 1px rgba(244,242,232,0.08), 0 20px 60px rgba(0,0,0,0.6), 0 0 60px rgba(227,34,42,0.18)",
        fab: "0 0 0 1px rgba(244,242,232,0.08), 0 10px 30px rgba(0,0,0,0.6), 0 0 30px rgba(184,255,61,0.25)",
        modal:
          "0 0 0 1px rgba(244,242,232,0.1), 0 25px 60px -12px rgba(0,0,0,0.8)",
        "glow-red": "0 0 24px rgba(255,68,56,0.4)",
        "glow-blue": "0 0 24px rgba(59,142,255,0.4)",
        "glow-lime": "0 0 24px rgba(184,255,61,0.4)",
      },
    },
  },
  plugins: [],
};
