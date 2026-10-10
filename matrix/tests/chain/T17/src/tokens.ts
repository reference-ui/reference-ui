import { tokens } from '@reference-ui/neo'

/**
 * T17 novel probe tokens. These are consumer-local: the icons/lib/fixture
 * packages never compiled them, so the classes the fan-out backs here cannot
 * be coincidental package-shipped hits. The spec proves that absence against
 * each published sheet.
 */
tokens({
  colors: {
    t17ProbeInk: {
      value: 'rgb(183, 2, 51)',
      description: 'T17 fan-out probe color (consumer-local, novel).',
    },
  },
  spacing: {
    t17ProbeGap: {
      value: '13px',
      description: 'T17 fan-out probe spacing (consumer-local, novel).',
    },
  },
})
