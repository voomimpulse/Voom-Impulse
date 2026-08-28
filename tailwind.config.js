/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        encre: "#123A5C",
        ardoise: "#1F5C86",
        ivoire: "#FFFFFF",
        ocre: "#F0A22E",
        ocreclair: "#F7C46C",
        vert: "#3F6B4F",
        rouille: "#A8462F",
        ardoiseclair: "#4E85AE",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        corps: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
