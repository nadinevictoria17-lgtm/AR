/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    // System-native stack on purpose (see DESIGN.md "Type"): zero webfont
    // load, zero flash-of-fallback, and it reads as a precise instrument
    // rather than a themed template — the exact opposite of the previous
    // Poppins-everywhere / font-black-everywhere pattern.
    fontFamily: {
      sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
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
        success:             'hsl(var(--success))',
        'success-foreground':'hsl(var(--success-foreground))',
        warning:             'hsl(var(--warning))',
        'warning-foreground':'hsl(var(--warning-foreground))',
        card:                'hsl(var(--card))',
        'card-foreground':   'hsl(var(--card-foreground))',
        accent:              'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
      },
      // One consistent radius scale used everywhere (replaces the ad hoc
      // rounded-[1.5rem]/[2rem]/[2.5rem] values scattered per-component,
      // which had no documented relationship to each other).
      borderRadius: {
        sm:  '6px',
        DEFAULT: '8px',
        md:  '8px',
        lg:  '10px',
        xl:  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      animation: {
        'slide-up':   'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':    'fadeIn 0.25s ease',
        'spin-slow':  'spin 3s linear infinite',
        'orbit':      'orbit 3s linear infinite',
      },
      keyframes: {
        slideUp:   { from: { transform: 'translateY(16px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        orbit:     { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
      },
    },
  },
  plugins: [],
}
