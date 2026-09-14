import { expect } from 'vitest'
import type { CompileResult } from '../../../../js/types.js'

export default function verify(result: CompileResult) {
  expect(result.stylesheet).toContain('border-bottom-width: 3px;')
  expect(result.stylesheet).toContain('border-bottom-style: solid;')
  expect(result.stylesheet).not.toContain('currentcolor')
  expect(result.stylesheet).not.toContain('currentColor')
}
