/** @type {import('tailwindcss').Config} */
module.exports = {
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
        brand: {
          gold: {
            DEFAULT: '#BC9D6F',
            hover: '#A8895C',
            light: '#F8F4EE',
            border: '#E8DCB8',
          },
          teal: {
            DEFAULT: '#528286',
            hover: '#436B6F',
            light: '#EEF4F5',
            border: '#BCCFD1',
          },
          green: {
            DEFAULT: '#315036',
            hover: '#253D29',
            light: '#EDF4EE',
            border: '#B8D4BD',
          },
          maroon: {
            DEFAULT: '#723542',
            hover: '#5D2A35',
            light: '#F9EFF1',
            border: '#E2BDC5',
          },
          warm: {
            DEFAULT: '#F5F9F1',
            50: '#FAFDF8',
            100: '#F5F9F1',
            200: '#E8EFE2',
          },
          dark: '#313131',
          muted: '#68726A',
          border: '#E3EAE0',
        },
      },
    },
  },
  plugins: [],
};
