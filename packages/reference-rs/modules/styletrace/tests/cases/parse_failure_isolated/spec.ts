/**
 * Station specification for parse_failure_isolated.
 * Asserts an unparsable sibling is skipped while Card still traces.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'parse_failure_isolated',
  verify(result) {
    expect(result).toEqual(['Card'])
  },
}

export default spec
