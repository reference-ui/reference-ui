/**
 * Station specification for STT-WRAP-11.
 * Asserts a non-ASCII capital first letter (Ärger) and a non-ASCII later letter (Kärtchen) both trace as components, and that
 * an empty file and a BOM-only file parse silently: the trace raises no diagnostic at all.
 */
import { expect } from 'vitest'
import { styletraceDiagnostics, type StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-WRAP-11',
  verify(result) {
    expect(result).toEqual(['Kärtchen', 'Ärger'])
    expect(styletraceDiagnostics(result)).toEqual([])
  },
}

export default spec
