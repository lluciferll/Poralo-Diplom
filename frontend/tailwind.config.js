/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        nx: {
          bg: '#05060a',
          surface: '#0b0d14',
          card: '#111420',
          elevated: '#161b2e',
          border: '#232a3d',
          borderHi: '#2f3a55',
          accent: '#6366f1',
          accentHi: '#818cf8',
          violet: '#8b5cf6',
          gold: '#c4a35a',
          success: '#22c55e',
          danger: '#ef4444',
          muted: '#8b93a7',
          text: '#eef0f6',
          dim: '#5c6478',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        mesh: 'radial-gradient(ellipse 60% 50% at 20% 0%, rgba(99,102,241,0.12), transparent), radial-gradient(ellipse 50% 40% at 80% 10%, rgba(139,92,246,0.08), transparent)',
        scanline:
          'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',
      },
      boxShadow: {
        panel: '0 0 0 1px rgba(99,102,241,0.08), 0 24px 48px rgba(0,0,0,0.45)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
    },
  },
  plugins: [],
};
