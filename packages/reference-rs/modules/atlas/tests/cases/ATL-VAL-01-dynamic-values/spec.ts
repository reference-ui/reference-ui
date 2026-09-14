/**
 * Station specification for ATL-VAL-01-dynamic-values.
 * Validates tracking of dynamic JSX prop expressions without fabricating false
 * literal string value records in distribution maps.
 * Proves primary SPEC anchor ATL-VAL-01.
 */
import { expect } from 'vitest'
import type { AtlasCaseSpec } from '../../helpers.js'

const spec: AtlasCaseSpec = {
  id: 'ATL-VAL-01',
  verify(result) {
    const button = result.components.find(c => c.name === 'Button')!
    expect(button).toBeDefined()
    expect(button.count).toBe(3)

    const variantProp = button.props.find(p => p.name === 'variant')!
    expect(variantProp).toBeDefined()
    expect(variantProp.count).toBe(3)
    expect(variantProp.values?.solid).toBe('common')
    expect(variantProp.values?.ghost).toBe('unused')

    expect(button.examples).toHaveLength(3)
  },
}

export default spec
