import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "indigo-dusk": "#6809CE",
        "deep-blue": "#00008B",
        "sky-blue": "#87CEEB",
        azure: "#F0FFFF",
        "cornflower": "#6495ED",
        accent: {
          orange: "#2563EB",
          blue: "#3B82F6",
          green: "#22c55e",
          red: "#ef4444",
          yellow: "#eab308",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
