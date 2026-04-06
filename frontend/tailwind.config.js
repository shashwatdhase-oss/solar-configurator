module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ui: {
          base: "#f4f7f9",
          panel: "#ffffff",
          accent: "#0f766e",
          dark: "#111827",
          muted: "#6b7280"
        }
      }
    },
  },
  plugins: [],
};

