/**
 * Expression table. Each row is a JSX prop whose literal arms must appear
 * as wants, including breakpoint `when` on the array row.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-LEAF-08',
  verify(result) {
    expect(hasWant(result, 'bg', 'n100')).toBe(true)
    expect(hasWant(result, 'bg', 'n200')).toBe(true)
    expect(hasWant(result, 'color', 'primary')).toBe(true)
    expect(hasWant(result, 'border', '1px solid red')).toBe(true)
    expect(hasWant(result, 'borderColor', 'transparent')).toBe(true)
    expect(hasWant(result, 'm', '0', ['base'])).toBe(true)
    expect(hasWant(result, 'm', '1r', ['sm'])).toBe(true)
    expect(hasWant(result, 'm', '2r', ['md'])).toBe(true)
    expect(hasWant(result, 'm', '3r', ['lg'])).toBe(true)
    expect(hasWant(result, 'w', '100%')).toBe(true)
    expect(hasWant(result, 'w', 'auto')).toBe(true)
    expect(hasWant(result, 'h', '200px')).toBe(true)
    expect(hasWant(result, 'h', '0px')).toBe(true)
    expect(hasWant(result, 'opacity', '0.5')).toBe(true)
    expect(hasWant(result, 'opacity', '1')).toBe(true)
    expect(hasWant(result, 'zIndex', '1000')).toBe(true)
    expect(hasWant(result, 'zIndex', '1')).toBe(true)
    expect(hasWant(result, 'gap', '0.5r')).toBe(true)
    expect(hasWant(result, 'gap', '1r')).toBe(true)
    expect(hasWant(result, 'display', 'none')).toBe(true)
    expect(hasWant(result, 'display', 'flex')).toBe(true)
    expect(hasWant(result, 'flexDirection', 'column')).toBe(true)
    expect(hasWant(result, 'flexDirection', 'row')).toBe(true)
    expect(hasWant(result, 'justifyContent', 'center')).toBe(true)
    expect(hasWant(result, 'justifyContent', 'flex-start')).toBe(true)
    expect(hasWant(result, 'alignItems', 'stretch')).toBe(true)
    expect(hasWant(result, 'alignItems', 'center')).toBe(true)
    expect(hasWant(result, 'textAlign', 'right')).toBe(true)
    expect(hasWant(result, 'textAlign', 'left')).toBe(true)
    expect(hasWant(result, 'borderRadius', 'full')).toBe(true)
    expect(hasWant(result, 'borderRadius', 'md')).toBe(true)
    expect(hasWant(result, 'cursor', 'pointer')).toBe(true)
    expect(hasWant(result, 'cursor', 'default')).toBe(true)
  },
}

export default spec
