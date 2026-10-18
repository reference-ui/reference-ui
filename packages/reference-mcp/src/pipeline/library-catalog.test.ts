import { describe, expect, it } from 'vitest'
import { REFERENCE_UI_LIBRARY_COMPONENTS } from './library-catalog'

describe('library-catalog', () => {
  it('advertises no defaultValue: lib value components omit it from their public props', () => {
    // Every lib value component Omits defaultValue (value is optional or
    // required-controlled), so an advertised one fails consumers with TS2322 (#16).
    const advertised = REFERENCE_UI_LIBRARY_COMPONENTS.flatMap(component =>
      component.props
        .filter(prop => prop.name === 'defaultValue')
        .map(() => component.name)
    )
    expect(advertised).toEqual([])
  })
})
