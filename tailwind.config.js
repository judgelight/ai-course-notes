import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
const config = {
  // 自动根据系统颜色模式切换
  darkMode: 'media',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [typography],
}

export default config
