import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    "#0d0d1a",
          surface: "#12122b",
          card:    "#16163a",
          elevated:"#1c1c45",
          hover:   "#1f1f4a",
        },
        purple: {
          DEFAULT: "#7c3aed",
          light:   "#a855f7",
          bright:  "#c084fc",
          muted:   "#7c3aed15",
          glow:    "#7c3aed40",
        },
        border: {
          DEFAULT: "#1f1f45",
          bright:  "#2a2a5a",
        },
        text: {
          primary:   "#f1f0ff",
          secondary: "#a09dc0",
          muted:     "#5a5780",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card:   "0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px #1f1f45",
        glow:   "0 0 20px #7c3aed40, 0 0 60px #7c3aed15",
        "glow-sm": "0 0 10px #7c3aed30",
        "glow-lg": "0 0 40px #7c3aed50, 0 0 80px #7c3aed20",
        inner:  "inset 0 1px 0 #ffffff08",
      },
      backgroundImage: {
        "purple-gradient": "linear-gradient(135deg, #7c3aed, #6366f1)",
        "card-gradient":   "linear-gradient(135deg, #16163a, #1c1c45)",
        "glow-gradient":   "radial-gradient(ellipse at top, #7c3aed20, transparent 70%)",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "28px",
      },
      animation: {
        "fade-up":      "fadeUp 0.4s ease forwards",
        "pulse-purple": "pulse-purple 2s ease infinite",
        shimmer:        "shimmer 2s linear infinite",
        blink:          "blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
}

export default config