import { tokens } from '@reference-ui/system'

export const spacing = {
  px: { value: '1px' },
  r: { value: '0.25rem' },
  '0.5r': { value: 'calc(0.5 * var(--spacing-r))' },
  '1/2r': { value: 'calc(var(--spacing-r) / 2)' },
  '1/3r': { value: 'calc(var(--spacing-r) / 3)' },
  '1/4r': { value: 'calc(var(--spacing-r) / 4)' },
  '1/5r': { value: 'calc(var(--spacing-r) / 5)' },
  '1/6r': { value: 'calc(var(--spacing-r) / 6)' },
  '1r': { value: 'var(--spacing-r)' },
  '1.5r': { value: 'calc(1.5 * var(--spacing-r))' },
  '2r': { value: 'calc(2 * var(--spacing-r))' },
  '3r': { value: 'calc(3 * var(--spacing-r))' },
  '4r': { value: 'calc(4 * var(--spacing-r))' },
  '5r': { value: 'calc(5 * var(--spacing-r))' },
  '6r': { value: 'calc(6 * var(--spacing-r))' },
  '8r': { value: 'calc(8 * var(--spacing-r))' },
  '10r': { value: 'calc(10 * var(--spacing-r))' },
  '12r': { value: 'calc(12 * var(--spacing-r))' },
} as const

tokens({ spacing })
