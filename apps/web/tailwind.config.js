/** @type {import('tailwindcss').Config} */
// EVERYTHING ELO — brand design system (navy + electric blue + ping yellow + lime)
// Reference: docs/redesign-spec.md §2.1
// Phase A PR4 — legacy aliases (cream, cup-red, forest, ink…) purged.
//               All source files now use canonical Everything ELO tokens.
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // ---------------------------------------------------------------
      // Palette — Everything ELO canonical tokens (§2.1)
      // ---------------------------------------------------------------
      colors: {
        // ── Surfaces ────────────────────────────────────────────────
        navy: "#0B1320",             // app background
        "navy-deep": "#070C16",      // deeper panels
        "navy-soft": "#141D2F",      // cards

        // ── Text (white is Tailwind default) ────────────────────────
        "cool-gray": "#A8B0C0",      // secondary / muted text

        // ── Brand accents ────────────────────────────────────────────
        "electric-blue": "#2F6BFF",         // primary CTA, ELO hero, focus
        "electric-blue-deep": "#1E4CD9",    // pressed state
        "electric-blue-deepest": "#15327A", // league hero (sober/institutional)
        "signal-red": "#FF3B3B",         // alert, live, delta-negative
        "signal-red-deep": "#D32828",    // pressed state
        "ping-yellow": "#FFD400",        // highlight, podium 1st, bracket
        "ping-yellow-deep": "#D9B400",   // pressed state
        lime: "#B7FF3B",                 // delta-positive, ELO hero, rank highlight
        "lime-deep": "#8BCC1F",          // lime pressed / border accent
        bronze: "#CD7F32",               // podium 3rd
      },

      // ---------------------------------------------------------------
      // Typography — Sora (body/display) + Teko (numbers) + JetBrains Mono
      // ---------------------------------------------------------------
      fontFamily: {
        sans: ["Sora", "system-ui", "sans-serif"],
        display: ["Teko", "system-ui", "sans-serif"],
        // @deprecated — use sans (Sora) for body text; kept as legacy fallback
        archivo: ["Archivo", "Sora", "system-ui", "sans-serif"],
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
        // Display — for huge ELO numbers, scoreboard (Teko)
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

      // ---------------------------------------------------------------
      // Spacing (layout tokens — unchanged)
      // ---------------------------------------------------------------
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

      // ---------------------------------------------------------------
      // Radius — sharp
      // xs:2, sm:4, md:6, lg:10, xl:14, full:9999
      // ---------------------------------------------------------------
      borderRadius: {
        xs: "2px",
        sm: "4px",
        md: "6px",
        lg: "10px",
        xl: "14px",
        card: "10px",
        button: "6px",
        input: "6px",
      },
      borderColor: {
        card: "rgba(168, 176, 192, 0.14)",       // cool-gray with alpha
        "card-muted": "rgba(168, 176, 192, 0.06)",
      },
      borderWidth: {
        card: "1px",
      },

      // ---------------------------------------------------------------
      // Screens
      // ---------------------------------------------------------------
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1440px",
      },

      // ---------------------------------------------------------------
      // Background images — Everything ELO gradients
      // Legacy class names kept for compatibility during Phase B reskin.
      // ---------------------------------------------------------------
      backgroundImage: {
        // Cards: navy wash
        "gradient-card":
          "linear-gradient(180deg, #141D2F 0%, #0B1320 100%)",
        "gradient-card-transparent":
          "linear-gradient(180deg, rgba(20,29,47,0.8) 0%, rgba(11,19,32,0.6) 100%)",
        // CTA buttons: electric-blue → electric-blue-deep (ÉNERGIE pillar)
        "gradient-cta":
          "linear-gradient(135deg, #2F6BFF 0%, #1E4CD9 100%)",
        "gradient-cta-alt":
          "linear-gradient(135deg, #B7FF3B 0%, #8BCC1F 100%)",
        // FAB: ping-yellow (COMPÉTITION pillar)
        "gradient-fab":
          "linear-gradient(135deg, #FFD400 0%, #D9B400 100%)",
        // Tab active: electric-blue (ÉNERGIE pillar)
        "gradient-tab-active":
          "linear-gradient(135deg, #2F6BFF 0%, #1E4CD9 100%)",
      },

      // ---------------------------------------------------------------
      // Shadows — Everything ELO glows (electric-blue + lime + ping-yellow)
      // ---------------------------------------------------------------
      boxShadow: {
        card: "0 0 0 1px rgba(168,176,192,0.06), 0 8px 24px rgba(0,0,0,0.5)",
        "card-lg":
          "0 0 0 1px rgba(168,176,192,0.08), 0 20px 60px rgba(0,0,0,0.6), 0 0 60px rgba(47,107,255,0.18)",
        fab: "0 0 0 1px rgba(168,176,192,0.08), 0 10px 30px rgba(0,0,0,0.6), 0 0 30px rgba(255,212,0,0.25)",
        modal:
          "0 0 0 1px rgba(168,176,192,0.1), 0 25px 60px -12px rgba(0,0,0,0.8)",
        // Canonical glow tokens — use these in new Phase B components
        "glow-electric": "0 0 24px rgba(47,107,255,0.4)",
        "glow-lime": "0 0 24px rgba(183,255,59,0.4)",
        "glow-yellow": "0 0 24px rgba(255,212,0,0.4)",
        "glow-red": "0 0 24px rgba(255,59,59,0.4)",
        // Legacy names — remapped onto new glows (kept for compat)
        "glow-blue": "0 0 24px rgba(47,107,255,0.4)",  // → glow-electric
      },

      // ---------------------------------------------------------------
      // Animations — bottom sheets, fade-ins, slide-ups
      // ---------------------------------------------------------------
      keyframes: {
        "sheet-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "cup-spin": {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(360deg)" },
        },
        // Brillance pulsée pilotée par la CSS var `--glow` (couleur adaptable
        // lime/rouge/bleu selon le contexte). Utilisé en mode diffusion pour
        // mettre en avant les protagonistes d'un nouveau match.
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 6px 0 var(--glow, rgba(47,107,255,0.5))" },
          "50%": { boxShadow: "0 0 30px 4px var(--glow, rgba(47,107,255,0.75))" },
        },
        // Bannière "nouveau match" : descend du haut, maintient, remonte.
        // Total piloté par la durée d'animation (cf. animation ci-dessous).
        "banner-drop": {
          "0%": { transform: "translateY(-120%)", opacity: "0" },
          "10%, 88%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-120%)", opacity: "0" },
        },
        // Flash de l'écran à l'arrivée d'un match (clignotement).
        "screen-flash": {
          "0%, 100%": { opacity: "0" },
          "50%": { opacity: "0.45" },
        },
        // Respiration lente et discrète de "ma" ligne dans le classement :
        // la teinte electric-blue s'intensifie légèrement + halo doux qui
        // apparaît/disparaît. Volontairement subtil (clignotement léger, lent).
        "me-pulse": {
          "0%, 100%": {
            backgroundColor: "rgba(47,107,255,0.10)",
            boxShadow: "0 0 0 0 rgba(47,107,255,0)",
          },
          "50%": {
            backgroundColor: "rgba(47,107,255,0.17)",
            boxShadow: "0 0 16px 0 rgba(47,107,255,0.28)",
          },
        },
      },
      animation: {
        "invite-sheet-up": "sheet-up 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        "cup-spin": "cup-spin 1.6s linear infinite",
        "glow-pulse": "glow-pulse 1.4s ease-in-out infinite",
        "banner-drop": "banner-drop 3.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "screen-flash": "screen-flash 0.55s ease-in-out infinite",
        "me-pulse": "me-pulse 3.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
