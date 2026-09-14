import { expect } from 'vitest'
import type { CompileResult } from '../../../../js/types.js'
import { hasWant } from '../../helpers.js'

export default function verify(result: CompileResult) {
  expect(hasWant(result, 'color', 'blue.600')).toBe(true)
  expect(hasWant(result, 'color', 'red.500', ['_hover'])).toBe(true)
  expect(hasWant(result, 'bg', 'gray.900', ['_dark'])).toBe(true)
}
