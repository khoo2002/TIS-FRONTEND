module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui')
  ],
  daisyui: {
    themes: [
      {
        nsc: {
          "primary": "#ec4899",
          "secondary": "#06b6d4",
          "accent": "#f97316",
          "neutral": "#111827",
          "base-100": "#ffffff",
          "info": "#60a5fa",
          "success": "#34d399",
          "warning": "#f59e0b",
          "error": "#ef4444",
        }
      },
      'dark'
    ]
  },
};
