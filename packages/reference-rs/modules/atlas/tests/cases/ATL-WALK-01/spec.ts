/**
 * Case specification for ATL-WALK-01.
 * Validates that the JSX walker reaches every expression position: a class render(), an optional
 * call argument, a throw, a template literal and a `new` argument each yield one call site for the
 * local component placed there, and the observed Button inside each is counted once per form.
 * Proves ATL-WALK-01 (src/usage/walker.rs).
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../harness/helpers.js'

const HIDDEN = ['Badge', 'Banner', 'Fallback', 'Label', 'Notice']

const spec: AtlasCaseSpec = {
  id: 'ATL-WALK-01',
  verify(result) {
    for (const name of HIDDEN) {
      const component = result.components.find(c => c.name === name)
      expect(component, name).toBeDefined()
      expect(component!.count, name).toBe(1)
      expect(component!.examples[0], name).toMatch(new RegExp(`^<${name} tone=`))
    }

    expect(result.observed.map(element => element.name)).toEqual(['Button'])
    const button = result.observed[0]!
    expect(button.count).toBe(5)
    expect(button.filePresence).toBe(1)
    const tone = button.props.find(prop => prop.name === 'tone')!
    expect(Object.keys(tone.values ?? {}).sort()).toEqual([
      'class',
      'new',
      'optional',
      'template',
      'throw',
    ])
  },
}

export default spec
