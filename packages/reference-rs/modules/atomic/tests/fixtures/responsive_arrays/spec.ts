import { expect } from 'vitest'
import type { CompileResult } from '../../../../js/types.js'
import { hasWant } from '../../helpers.js'

export default function verify(result: CompileResult) {
  expect(hasWant(result, 'mt', '1r', ['base'])).toBe(true)
  expect(hasWant(result, 'mt', '2r', ['sm'])).toBe(true)
  expect(hasWant(result, 'mt', '4r', ['md'])).toBe(true)
}
