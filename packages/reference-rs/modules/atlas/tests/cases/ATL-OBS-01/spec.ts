/**
 * Station specification for ATL-OBS-01.
 * Validates that the observation pass reads props from the AST: nested braces, an arrow body
 * and a bare attribute yield exactly style, onClick and disabled, with children counted only for
 * the usage that has children.
 * Proves ATL-OBS-01 (src/usage/observe.rs).
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../harness/helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-OBS-01',
  verify(result) {
    expect(result.observed.map(element => element.name)).toEqual(['Button'])

    const button = result.observed[0]!
    expect(button.source).toBe('@reference-ui/react')
    expect(button.count).toBe(2)
    expect(button.filePresence).toBe(1)
    expect(button.usedWith).toEqual({})
    expect(button.examples).toEqual([
      '<Button style={{ a: { b: 1 } }} onClick={() => go()} disabled>',
      '<Button style={{ a: { b: 1 } }} onClick={() => go()} disabled />',
    ])

    expect(button.props.map(prop => prop.name)).toEqual([
      'children',
      'disabled',
      'onClick',
      'style',
    ])

    const counts = Object.fromEntries(button.props.map(prop => [prop.name, prop.count]))
    expect(counts).toEqual({ children: 1, disabled: 2, onClick: 2, style: 2 })

    const disabled = button.props.find(prop => prop.name === 'disabled')!
    expect(disabled.values).toEqual({ true: 'very common' })
    expect(button.props.find(prop => prop.name === 'style')!.values).toBeUndefined()
  },
}

export default spec
