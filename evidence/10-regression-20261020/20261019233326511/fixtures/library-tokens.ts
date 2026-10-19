import { tokens } from '@reference-ui/system'

tokens({
  colors: {
    studio: {
      canvas: { light: '#f3f6f5', dark: '#0b1614' },
      surface: { light: '#ffffff', dark: '#142522' },
      ink: { light: '#183a34', dark: '#e5f4ef' },
      muted: { light: '#59736b', dark: '#aac3b9' },
      line: { light: '#d9e5df', dark: '#35534a' },
      brand: { light: '#0f766e', dark: '#5eead4' },
      accent: { value: '{colors.studio.brand}' },
    },
  },
  spacing: {
    studio: {
      tight: { value: '0.5rem' },
      gap: { value: '1rem' },
      panel: { value: '1.5rem' },
      page: { value: '2rem' },
      zero: { value: '0px' },
    },
  },
  radii: {
    studio: {
      card: { value: '1rem' },
      control: { value: '0.625rem' },
      pill: { value: '999px' },
    },
  },
  tones: {
    studioSoft: {
      surface: { value: '10%' },
      line: { value: '45%' },
    },
  },
})
