/**
 * Design System Tokens - Clube da Esquerda
 * Comprehensive token definitions for colors, typography, and effects
 */

export const colors = {
  linen: {
    50: '#faf8f6',
    100: '#f5f2ed',
    200: '#ebe5db',
    300: '#e1d9ca',
    400: '#d7ccb8',
    500: '#cdbfa7', // Primary sand/linen
    sand: '#cdbfa7',
    600: '#b8a78a',
    700: '#a38f6d',
    800: '#8e7750',
    900: '#7a6343',
  },
  terracotta: {
    50: '#fdf6f2',
    100: '#fceae1',
    200: '#f8d0ba',
    300: '#f5b692',
    400: '#f19c6a',
    500: '#ed8242', // Primary terracotta
    main: '#ed8242',
    600: '#d86d2e',
    700: '#c25826',
    800: '#9c461f',
    900: '#7a341a',
  },
  embroidery: {
    black: '#1a1a1a',
    dark: '#3a3a3a',
    gray: '#5a5a5a',
  },
  thread: {
    black: '#1a1a1a',
    white: '#ffffff',
    red: '#d32f2f',
    gold: '#f9a825',
    green: '#2e7d32',
    blue: '#1976d2',
  },
} as const;

export const typography = {
  fonts: {
    heading: "'Caveat', cursive",
    handwritten: "'Dancing Script', cursive",
    body: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  sizes: {
    heading: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: '1.2',
      letterSpacing: '0.05em',
    },
    subheading: {
      fontSize: '1.5rem',
      fontWeight: 400,
      lineHeight: '1.3',
    },
    body: {
      fontSize: '0.75rem',
      lineHeight: '1.5',
    },
    buttonText: {
      fontSize: '1rem',
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
    },
  },
} as const;

export const shadows = {
  embroidery: '0 2px 4px rgba(26, 26, 26, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
  embroidery3d: '0 4px 8px rgba(26, 26, 26, 0.2), inset 0 -2px 4px rgba(26, 26, 26, 0.1)',
  embroideryPressed: 'inset 0 2px 4px rgba(26, 26, 26, 0.3), 0 1px 2px rgba(0, 0, 0, 0.1)',
  frame: `inset 0 1px 0 rgba(255, 255, 255, 0.5),
           inset 0 -2px 4px rgba(0, 0, 0, 0.2),
           0 8px 16px rgba(0, 0, 0, 0.15)`,
} as const;

export const effects = {
  threadStitch: `repeating-linear-gradient(
    90deg,
    currentColor 0,
    currentColor 2px,
    transparent 2px,
    transparent 4px
  )`,
  linedTexture: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(184, 167, 138, 0.1) 2px, rgba(184, 167, 138, 0.1) 4px),
    repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(184, 167, 138, 0.1) 2px, rgba(184, 167, 138, 0.1) 4px)`,
} as const;

export const animations = {
  buttonPress: {
    keyframes: {
      '0%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(2px)' },
      '100%': { transform: 'translateY(0)' },
    },
    duration: '0.15s',
    timingFunction: 'ease-out',
  },
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
} as const;

export const borderRadius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '999px',
} as const;
