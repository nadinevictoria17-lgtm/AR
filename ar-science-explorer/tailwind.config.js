/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    fontFamily: {
      sans: ['Poppins', 'sans-serif'],
      mono: ['Poppins', 'sans-serif'],
    },
    extend: {
      colors: {
        'subject-physics':   'hsl(var(--subject-physics))',
        'subject-biology':   'hsl(var(--subject-biology))',
        'subject-chemistry': 'hsl(var(--subject-chemistry))',
        'subject-earth':     'hsl(var(--subject-earth))',
        surface:             'hsl(var(--surface))',
        foreground:          'hsl(var(--foreground))',
        background:          'hsl(var(--background))',
        border:              'hsl(var(--border))',
        ring:                'hsl(var(--ring))',
        muted:               'hsl(var(--muted))',
        'muted-foreground':  'hsl(var(--muted-foreground))',
        primary:             'hsl(var(--primary))',
        'primary-foreground':'hsl(var(--primary-foreground))',
        secondary:           'hsl(var(--secondary))',
        'secondary-foreground':'hsl(var(--secondary-foreground))',
        destructive:         'hsl(var(--destructive))',
        'destructive-foreground':'hsl(var(--destructive-foreground))',
        card:                'hsl(var(--card))',
        'card-foreground':   'hsl(var(--card-foreground))',
        accent:              'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        glow:  '0 0 20px hsl(var(--primary) / 0.35)',
        'glow-sm': '0 0 10px hsl(var(--primary) / 0.25)',
      },
      animation: {
        'slide-up':   'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':    'fadeIn 0.25s ease',
        'spin-slow':  'spin 3s linear infinite',
        'orbit':      'orbit 3s linear infinite',
        'float':      'float 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        slideUp:   { from: { transform: 'translateY(16px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        orbit:     { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        float:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
    },
  },
  plugins: [],
}
