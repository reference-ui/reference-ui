import { expect } from 'vitest'
import type { CompileResult } from '../../../../js/types.js'

export default function verify(result: CompileResult) {
  expect(result.stylesheet).toBeDefined()
  expect(result.css?.classes ?? {}).toEqual({})
}
