import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        ink: {
          DEFAULT: "#111111",
          soft: "#1A1A1A",
          lighter: "#262626",
          border: "rgba(255, 255, 255, 0.1)",
        },
        orosu: {
          warm: "#F8F8F6",
          dark: "#111111",
          muted: "#666666",
          border: "rgba(17, 17, 17, 0.08)",
          card: "#FFFFFF",
          pink: "#F43F5E",
          coral: "#FB7185",
          orange: "#F97316",
          purple: "#A855F7",
          violet: "#6366F1",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "orosu-gradient":
          "linear-gradient(115deg, #7E22CE 0%, #E11D48 45%, #F97316 100%)",
        "orosu-gradient-soft":
          "linear-gradient(135deg, rgba(126, 34, 206, 0.08) 0%, rgba(225, 29, 72, 0.08) 50%, rgba(249, 115, 22, 0.08) 100%)",
        "orosu-cta": "linear-gradient(115deg, #E11D48 0%, #FB7185 40%, #F97316 100%)",
      },
      boxShadow: {
        soft: "0 14px 40px -10px rgba(17, 17, 17, 0.06)",
        card: "0 4px 20px -2px rgba(17, 17, 17, 0.04), 0 2px 6px -1px rgba(17, 17, 17, 0.02)",
        glow: "0 0 35px -5px rgba(225, 29, 72, 0.25)",
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
