/**
 * Station specification for ATL-OBS-02.
 * Validates the binding rules for aliases and namespaces: `<Box>` imported as Div and `<R.Div>`
 * from a namespace import both count as Div, while the unlisted Section never counts.
 * Proves ATL-OBS-02 (src/usage/observe.rs).
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../harness/helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-OBS-02',
  verify(result) {
    expect(result.observed.map(element => element.name)).toEqual(['Div'])

    const div = result.observed[0]!
    expect(div.source).toBe('@reference-ui/react')
    expect(div.count).toBe(2)
    expect(div.filePresence).toBe(2)
    expect(div.examples).toEqual(['<Box padding="2r">', '<R.Div padding="4r">'])

    const padding = div.props.find(prop => prop.name === 'padding')!
    expect(padding.count).toBe(2)
    expect(padding.values).toEqual({ '2r': 'very common', '4r': 'very common' })
    expect(div.props.find(prop => prop.name === 'children')!.count).toBe(2)
  },
}

export default spec
