import { expect } from 'vitest'
import type { CompileResult } from '../../../../js/types.js'

export default function verify(result: CompileResult) {
  expect(result.stylesheet).toContain('margin-top: var(--spacing-root);')
  expect(result.stylesheet).toContain('margin-bottom: calc(2 * var(--spacing-root));')
  expect(result.stylesheet).toContain('padding-top: calc(0.5 * var(--spacing-root));')
  // We can just verify the snapshot has it since golden test will check exact match.
  // The spec is mainly for human intent.
  expect(result.css?.classes?.['pb:1/3r']).toBeDefined()
  expect(result.css?.classes?.['gap:2/3r']).toBeDefined()
}
