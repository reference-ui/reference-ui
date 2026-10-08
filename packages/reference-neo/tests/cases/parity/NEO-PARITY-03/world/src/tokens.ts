// Tokens for the PARITY-01 mini-lib world. They take no input and emit the
// lib-shaped token set the six components and every probe resolve against:
// light/dark colour leaves that flip on data-color-mode, a red scale for
// mixes, the ui.* semantic subtree the tag recipes reference, spacing,
// radii, and the animation token the motion fragment backs. Collected once.
import { tokens } from '@reference-ui/neo'

tokens({
  colors: {
    brand: { light: '#7c3aed', dark: '#a78bfa' },
    ink: { light: '#111111', dark: '#f5f5f5' },
    paper: { light: '#ffffff', dark: '#1f2937' },
    accent: { light: '#16a34a', dark: '#4ade80' },
    red: {
      200: { value: '#fecaca' },
      500: { value: '#ef4444' },
    },
    blue: {
      300: { value: '#93c5fd' },
    },
    ui: {
      panel: { light: '#f3f4f6', dark: '#111827' },
      button: {
        background: { light: '#7c3aed', dark: '#a78bfa' },
        foreground: { light: '#ffffff', dark: '#111111' },
        disabled: {
          foreground: { value: '#6b7280' },
          background: { value: '#e5e7eb' },
        },
      },
      field: {
        border: { value: '#d1d5db' },
        borderHover: { value: '#3b82f6' },
        placeholder: { value: '#9ca3af' },
        background: { light: '#ffffff', dark: '#030712' },
        foreground: { light: '#111111', dark: '#f9fafb' },
      },
      focus: {
        ring: { value: '#7c3aed' },
      },
      table: {
        border: { value: '#e5e7eb' },
        rowHover: { value: '#f9fafb' },
      },
      disclosure: {
        border: { value: '#e5e7eb' },
      },
      file: {
        button: { value: '#4b5563' },
        field: { value: '#f3f4f6' },
      },
      progress: {
        bar: {
          foreground: { value: '#7c3aed' },
        },
      },
    },
  },
  spacing: {
    sm: { value: '0.5rem' },
    md: { value: '1rem' },
    lg: { value: '1.5rem' },
  },
  radii: {
    sm: { value: '4px' },
    md: { value: '8px' },
    lg: { value: '12px' },
  },
  animations: {
    fade: {
      quick: { value: 'fadeIn 0.2s ease-out' },
    },
  },
})
