/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        encre: "#141B2E",      // fond profond, sections structurantes
        ardoise: "#1F2A44",    // panneaux, cartes
        ivoire: "#F6F3EC",     // fond clair des zones de contenu
        ocre: "#C8963E",       // accent signature (or/ocre, référence textile)
        ocreclair: "#E4B968",
        vert: "#3F6B4F",       // statut positif / payé
        rouille: "#A8462F",    // statut alerte / impayé
        ardoiseclair: "#3A4766",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        corps: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
