import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const hsl = (token: string) => `hsl(var(--${token}))`;

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: hsl('background'),
        foreground: hsl('foreground'),
        card: {
          DEFAULT: hsl('card'),
          foreground: hsl('card-foreground'),
        },
        popover: {
          DEFAULT: hsl('popover'),
          foreground: hsl('popover-foreground'),
        },
        primary: {
          DEFAULT: hsl('primary'),
          foreground: hsl('primary-foreground'),
        },
        secondary: {
          DEFAULT: hsl('secondary'),
          foreground: hsl('secondary-foreground'),
        },
        muted: {
          DEFAULT: hsl('muted'),
          foreground: hsl('muted-foreground'),
        },
        accent: {
          DEFAULT: hsl('accent'),
          foreground: hsl('accent-foreground'),
        },
        destructive: {
          DEFAULT: hsl('destructive'),
          foreground: hsl('destructive-foreground'),
        },
        success: {
          DEFAULT: hsl('success'),
          foreground: hsl('success-foreground'),
        },
        border: hsl('border'),
        input: hsl('input'),
        ring: hsl('ring'),
        protein: hsl('protein'),
        carbs: {
          DEFAULT: hsl('carbs'),
          text: hsl('carbs-text'),
        },
        fat: hsl('fat'),
        fiber: hsl('fiber'),
        warning: hsl('warning'),
        'surface-subtle': hsl('surface-subtle'),
        zone: {
          low: hsl('zone-low'),
          athletes: hsl('zone-athletes'),
          normal: hsl('zone-normal'),
          over: hsl('zone-over'),
          obese: hsl('zone-obese'),
        },
        toast: {
          success: hsl('toast-success'),
          error: hsl('toast-error'),
          warning: hsl('toast-warning'),
          info: hsl('toast-info'),
          foreground: hsl('toast-foreground'),
        },
        compare: {
          '1': hsl('compare-1'),
          '2': hsl('compare-2'),
          '3': hsl('compare-3'),
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 6px)',
      },
      fontFamily: {
        sans: [
          'var(--font-manrope)',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      spacing: {
        '18': '4.5rem',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
