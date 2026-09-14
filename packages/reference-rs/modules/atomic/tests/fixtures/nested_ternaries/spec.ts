import { expect } from 'vitest'
import type { CompileResult } from '../../../../js/types.js'
import { hasWant } from '../../helpers.js'

export default function verify(result: CompileResult) {
  expect(hasWant(result, 'borderBottom', '3px solid')).toBe(true)
  expect(hasWant(result, 'borderBottom', '3px solid transparent')).toBe(true)
}
