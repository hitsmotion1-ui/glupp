import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        glupp: {
          bg: "#16130E",
          card: "#211E18",
          "card-alt": "#2A2520",
          accent: "#E08840",
          "accent-soft": "rgba(224, 136, 64, 0.08)",
          gold: "#DCB04C",
          cream: "#FBF7F1",
          warm: "#2A2118",
          "warm-black": "#3D3428",
          "text-soft": "#A89888",
          "text-muted": "#6B6050",
          border: "#3A3530",
          // Rarity
          common: "#8D7C6C",
          rare: "#4ECDC4",
          epic: "#A78BFA",
          legendary: "#F0C460",
          // Functional
          success: "#4CAF50",
          error: "#E05252",
        },
      },
      fontFamily: {
        display: ["Bricolage Grotesque", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        glupp: "16px",
        "glupp-lg": "20px",
        "glupp-xl": "24px",
      },
      boxShadow: {
        glupp: "0 4px 20px rgba(0, 0, 0, 0.15)",
        "glupp-accent": "0 4px 12px rgba(224, 136, 64, 0.2)",
      },
      animation: {
        "xp-pop": "xpPop 0.6s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
      },
      keyframes: {
        xpPop: {
          "0%": { transform: "scale(0.5) translateY(20px)", opacity: "0" },
          "50%": { transform: "scale(1.2) translateY(-10px)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(-30px)", opacity: "0" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
