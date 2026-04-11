import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        cream: "#f4efe6",
        oat: "#ede5d7",
        cocoa: "#4d3729",
        caramel: "#cb7747",
        ember: "#9a4f25",
        sage: "#8d9476"
      },
      fontFamily: {
        display: [
          "Iowan Old Style",
          "Palatino Linotype",
          "Book Antiqua",
          "Georgia",
          "serif"
        ],
        body: [
          "Avenir Next",
          "Segoe UI",
          "PingFang SC",
          "Hiragino Sans GB",
          "Noto Sans SC",
          "sans-serif"
        ],
        mono: [
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "JetBrains Mono",
          "monospace"
        ]
      },
      boxShadow: {
        warm: "0 12px 30px rgba(107, 66, 37, 0.12)"
      },
      keyframes: {
        floatUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "0%": { transform: "translateX(-30%)" },
          "100%": { transform: "translateX(120%)" }
        },
        pulseLine: {
          "0%, 100%": { transform: "scaleX(0.6)", opacity: "0.5" },
          "50%": { transform: "scaleX(1)", opacity: "1" }
        }
      },
      animation: {
        "float-up": "floatUp 0.6s ease-in-out both",
        shimmer: "shimmer 1.8s ease-in-out infinite",
        "pulse-line": "pulseLine 1.5s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
