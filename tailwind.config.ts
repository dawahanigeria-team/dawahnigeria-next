import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    // Mirrors the CRA config. Note: because these entries include objects,
    // Tailwind disables the arbitrary `min-[…]`/`max-[…]` variants entirely —
    // every breakpoint must be a *named* screen or it silently compiles to
    // nothing.
    screens: {
      mobile: { max: "615px" },
      "mobile-up": "615px",
      // CRA's shell breakpoints, named so they actually emit:
      //   tab    — hamburger shows, sidebar collapses       (CRA: max-width 767)
      //   tab-up — persistent sidebar                       (CRA: min-width 768)
      //   narrow — store badges swap for the "Get app" pill (CRA: max-width 1035)
      tab: { max: "767px" },
      "tab-up": "768px",
      narrow: { max: "1035px" },
      // Card-row headings step 22px → 20px here (CRA: max-width 900).
      mid: { max: "900px" },
      // Auth pages split from single-column to the 45/55 grid here.
      "md-auth": "690px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-nunito)", "Nunito Sans", "system-ui", "sans-serif"],
        // Auth pages only.
        manrope: ["var(--font-manrope)", "Manrope", "sans-serif"],
        serif: ["var(--font-dm-serif)", "DM Serif Display", "serif"],
        // New Releases page only.
        display: ["var(--font-fraunces)", "Fraunces", "Georgia", "serif"],
        body: ["var(--font-public-sans)", "Public Sans", "sans-serif"],
        // Ramadan page only.
        cormorant: ["var(--font-cormorant)", "Cormorant", "serif"],
        plex: ["var(--font-plex-sans)", "IBM Plex Sans", "sans-serif"],
      },
      colors: {
        dncolor: { 500: "#ddff2b" },
        border: "hsl(var(--border))",
        auth: "hsl(var(--auth))",
        input: "hsl(var(--input))",
        hover: "hsl(var(--hover))",
        comment: "hsl(var(--comment))",
        footer: "hsl(var(--footer))",
        ring: "hsl(var(--ring))",
        search: "hsl(var(--search))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        // Backs CRA's `text-color` / `text-color-foreground` utilities, which
        // the shell markup leans on heavily for its hover states.
        color: {
          DEFAULT: "hsl(var(--color))",
          foreground: "hsl(var(--color-foreground))",
          primary: "hsl(var(--color-primary))",
        },
      },
    },
  },
  plugins: [],
};

export default config;
