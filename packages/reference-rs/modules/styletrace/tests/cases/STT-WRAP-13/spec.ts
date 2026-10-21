/**
 * Station specification for STT-WRAP-13.
 * Asserts components typed through a self-referential alias, two mutually recursive aliases and a doubly recursive
 * conditional and a fanning alias, both with growing arguments, trace as Fanned, Looped, Nested and Pinged; before the guard each walk overflowed the stack.
 */
import { expect } from 'vitest'
import type { StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-WRAP-13',
  verify(result) {
    expect(result).toEqual(['Fanned', 'Looped', 'Nested', 'Pinged'])
  },
}

export default spec
