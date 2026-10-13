/**
 * Station specification for STT-NEG-05.
 * Asserts a class component whose props expose StyleProps is not traced and emits exactly one
 * STT-W-CLASS-COMPONENT warning naming it and its file. A class with no StyleProps stays silent,
 * and the function component Tile still traces.
 */
import { expect } from 'vitest'
import { styletraceDiagnostics, type StyletraceCaseSpec } from '../../harness/helpers.js'

const spec: StyletraceCaseSpec = {
  id: 'STT-NEG-05',
  verify(result) {
    expect(result).toEqual(['Tile'])
    const classes = styletraceDiagnostics(result).filter(
      d => d.code === 'STT-W-CLASS-COMPONENT'
    )
    expect(classes).toHaveLength(1)
    expect(classes[0]?.file).toMatch(/index\.tsx$/)
    expect(classes[0]?.message).toContain('`Card`')
    expect(classes[0]?.message).toContain('its style props are not traced')
  },
}

export default spec
