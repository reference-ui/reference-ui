/**
 * Station specification for STT-WRAP-10.
 * Asserts a mutually recursive pair traces whole when one link reaches Div, and that a cycle
 * with no primitive (Solo1, Solo2) stays off the surface. The verdict must not depend on which
 * export the walk enters first, so a cut inside the cycle must not be cached as final.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-WRAP-10',
  verify(result) {
    expect(result).toEqual(['Ping', 'Pong'])
  },
}

export default spec
