/**
 * Magnitude sort station. `@container` min-width blocks emit 640 → 1536,
 * not lexicographic 1024-first. `@media` max-width blocks emit descending.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'

const MIN = ['640', '768', '1024', '1280', '1536'] as const
const MAX = ['1536', '1280', '1024', '768', '640'] as const

function assertAscending(sheet: string, needles: readonly string[]) {
  const positions = needles.map(n => {
    const i = sheet.indexOf(n)
    expect(i, n).toBeGreaterThan(-1)
    return i
  })
  for (let i = 1; i < positions.length; i++) {
    expect(positions[i]).toBeGreaterThan(positions[i - 1]!)
  }
}

const spec: AtomicCaseSpec = {
  id: 'ATM-ORDER-01',
  verify(result) {
    const sheet = result.stylesheet
    assertAscending(
      sheet,
      MIN.map(px => `@container (min-width: ${px}px)`)
    )
    assertAscending(
      sheet,
      MAX.map(px => `@media (max-width: ${px}px)`)
    )
  },
}

export default spec
