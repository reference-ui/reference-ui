import { describe, expect, it } from 'vitest'
import { sizeStyles } from './styles'

describe('sizeStyles', () => {
  it('maps a string value to equal width and height', () => {
    expect(sizeStyles('2r')).toEqual({
      width: '2r',
      height: '2r',
    })
  })

  it('maps a numeric value to equal width and height', () => {
    expect(sizeStyles(24)).toEqual({
      width: 24,
      height: 24,
    })
  })
})