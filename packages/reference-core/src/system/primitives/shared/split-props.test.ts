import { describe, expect, it } from 'vitest'
import { splitPrimitiveProps, BOX_PATTERN_PROPS_FOR_STYLES } from './split-props'

describe('splitPrimitiveProps', () => {
  it('splits className, children, colorMode, and variant from rest', () => {
    const props = {
      className: 'custom-class',
      children: 'hello',
      colorMode: 'dark',
      variant: 'primary',
      id: 'button-1',
      title: 'Submit',
    }

    const result = splitPrimitiveProps(props)

    expect(result.className).toBe('custom-class')
    expect(result.children).toBe('hello')
    expect(result.colorMode).toBe('dark')
    expect(result.variant).toBe('primary')
    expect(result.elementProps).toEqual({
      id: 'button-1',
      title: 'Submit',
    })
    expect(result.elementProps).not.toHaveProperty('variant')
    expect(result.elementProps).not.toHaveProperty('colorMode')
  })

  it('extracts box pattern style props such as weight from elementProps into styleProps', () => {
    const props = {
      weight: 'bold',
      id: 'text-1',
      p: '4',
    }

    const result = splitPrimitiveProps(props)

    expect(result.styleProps).toHaveProperty('weight', 'bold')
    expect(result.styleProps).toHaveProperty('p', '4')
    expect(result.elementProps).toEqual({ id: 'text-1' })
    expect(result.elementProps).not.toHaveProperty('weight')
  })

  it('keeps style props and css prop in styleProps', () => {
    const props = {
      bg: 'red.500',
      color: 'white',
      css: { opacity: 0.8 },
      onClick: () => {},
    }

    const result = splitPrimitiveProps(props)

    expect(result.styleProps).toHaveProperty('bg', 'red.500')
    expect(result.styleProps).toHaveProperty('color', 'white')
    expect(result.styleProps).toHaveProperty('css', { opacity: 0.8 })
    expect(result.elementProps).toHaveProperty('onClick')
    expect(result.elementProps).not.toHaveProperty('bg')
  })
})
