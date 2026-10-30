import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        lemon: {
          50: "#FFFDF4",
          100: "#FFF6D4",
          200: "#FFE566",
          300: "#F5C518",
          400: "#E0A400",
          500: "#C48A00",
        },
        ink: "#2B2416",
        leaf: "#2F7D46",
        blush: "#E85D7A",
        cream: "#FFFDF8",
      },
      fontFamily: {
        sans: ["Nunito", "ui-rounded", "Trebuchet MS", "sans-serif"],
      },
      boxShadow: {
        lemon: "0 4px 0 #E0A400",
      },
    },
  },
  plugins: [],
};

export default config;
