import { font, globalCss, keyframes, tokens } from '@reference-ui/system'

tokens({
  colors: {
    launch: {
      surface: { value: '#f7f6ef', dark: '#101e19' },
      ink: { value: '#193e31', dark: '#e8f5ec' },
      brand: { value: '#12634a', dark: '#80e1a7' },
      accent: { value: '{colors.launch.brand}' },
      line: { value: '#cddbd1', dark: '#3e5b4b' },
      panel: { value: '#ffffff', dark: '#1a3025' },
      brandText: { value: '#ffffff', dark: '#102d20' },
    },
  },
  spacing: {
    launch: {
      page: { value: '24px' },
      card: { value: '16px' },
      roomy: { value: '32px' },
      gap: { value: '12px' },
      small: { value: '8px' },
      override: { value: '40px' },
      zero: { value: '0' },
    },
  },
  radii: {
    launch: {
      card: { value: '20px' },
      pill: { value: '999px' },
    },
  },
  animations: {
    launch: {
      pulse: { value: 'fernPulse 2s linear infinite' },
    },
  },
})

keyframes({
  fernPulse: {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.6' },
  },
})

font('display', {
  value: 'Georgia, serif',
  fontFace: { src: 'local("Georgia")' },
  weights: { normal: '430', bold: '720' },
  css: { letterSpacing: '-0.03em' },
})

globalCss({
  body: {
    margin: 'launch.zero',
    containerType: 'inline-size',
  },
  'a:focus-visible': {
    outline: '2px solid {colors.launch.brand}',
    outlineOffset: '2px',
  },
  button: {
    cursor: 'pointer',
  },
})
