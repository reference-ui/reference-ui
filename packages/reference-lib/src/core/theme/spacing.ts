import { getRhythm, tokens } from '@reference-ui/system'

export const spacing = {
  px: { value: '1px' },
  r: { value: 'var(--spacing-root)' },
  '0.5r': { value: getRhythm(0.5) },
  '1/2r': { value: getRhythm(1, 2) },
  '1/3r': { value: getRhythm(1, 3) },
  '1/4r': { value: getRhythm(1, 4) },
  '1/5r': { value: getRhythm(1, 5) },
  '1/6r': { value: getRhythm(1, 6) },
  '1r': { value: getRhythm(1) },
  '1.5r': { value: getRhythm(1.5) },
  '2r': { value: getRhythm(2) },
  '3r': { value: getRhythm(3) },
  '4r': { value: getRhythm(4) },
  '5r': { value: getRhythm(5) },
  '6r': { value: getRhythm(6) },
  '8r': { value: getRhythm(8) },
  '10r': { value: getRhythm(10) },
  '12r': { value: getRhythm(12) },
} as const

tokens({ spacing })
