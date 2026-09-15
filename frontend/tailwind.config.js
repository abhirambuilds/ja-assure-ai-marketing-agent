/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ja: {
          navy: "#0a192f",
          dark: "#0f172a",
          card: "#1e293b",
          primary: "#2563eb",
          accent: "#38bdf8",
          gold: "#d97706",
          emerald: "#10b981",
          rose: "#f43f5e"
        }
      }
    },
  },
  plugins: [],
}
