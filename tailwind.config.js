/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'kazakh-blue': '#00AFCA',
        'kazakh-blue-dark': '#0099CC',
        'kazakh-gold': '#FFB700',
        'kazakh-gold-light': '#FFD700',
      },
    },
  },
  plugins: [],
}

