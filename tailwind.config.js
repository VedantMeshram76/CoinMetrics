/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./views/*.ejs"
  ],
  theme: {
    extend: {
      colors: {
        brandBlack: '#000000',
        darkCard: '#0d0d11',
        neonLavender: '#a855f7',
        mutedText: '#8a8a93',
        accentOrange: '#f97316',

        'bg-main': '#060608',
        'card-bg': '#0d0e12',
        'mint-accent': '#12d396',
        'text-muted-custom': '#8f929e',
        'trend-up': '#12d396',
        'trend-down': '#ff3b69',

        darkBg: '#060608',
        cardBg: '#0d0d11',
        emeraldCustom: '#10b981',
        roseCustom: '#ef4444',
        borderCustom: 'rgba(255, 255, 255, 0.05)',
        textSecondary: '#8a8a93',

        // Ecosystem News custom palette
        'news-bg': '#0b0c10',
        'news-card': '#111217',
        'news-border': '#27272a',

        darkBg: '#060608',
        cardBg: '#0d0d11',
        emeraldCustom: '#10b981',
        roseCustom: '#ef4444',
        textSecondary: '#8a8a93',

        darkBg: '#060608',
        cardBg: '#0d0e12',
        emeraldCustom: '#10b981',
        borderCustom: 'rgba(255, 255, 255, 0.05)',
        textSecondary: '#8a8a93',

        brandBlack: '#000000',
        darkCard: '#0d0d11',
        neonLavender: '#a855f7',
        mutedText: '#8a8a93',
        accentOrange: '#f97316'
      }
    },
  },
  plugins: [],
}