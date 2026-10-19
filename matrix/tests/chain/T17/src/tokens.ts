/**
 * T17 novel probe tokens. These are consumer-local: the icons/lib/fixture
 * packages never compiled them, so the classes the consumer backs here cannot
 * be coincidental package-shipped hits. The spec proves that absence against
 * each published sheet.
 */

import { tokens } from '@reference-ui/core'

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
  // Role-split tone (consumer-local, novel). `color` is a line-role prop, so the
  // probe draws `line`; a background would draw `surface`. Neither amount is a
  // lib default (lib ships 4/10/14/18 surface, 22/34/46/58 line).
  tones: {
    t17ProbeTone: {
      surface: { value: '12%' },
      line: { value: '41%' },
    },
  },
})
