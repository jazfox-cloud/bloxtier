/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        ink: '#07110f',
        panel: '#0e1916',
        field: '#13231f',
        line: '#24443b',
        mint: '#5df2a9',
        lime: '#b7ff5a',
        cyan: '#68d8ff',
        gold: '#ffd166',
        danger: '#ff6b6b'
      },
      boxShadow: {
        glow: '0 0 32px rgba(93, 242, 169, 0.18)',
        cyan: '0 0 28px rgba(104, 216, 255, 0.14)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
