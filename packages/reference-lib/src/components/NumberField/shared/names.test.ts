import { describe, expect, it } from 'vitest'
import { stepperNameIds, stepperNameText } from './names'

describe('accessible-name text plumbing', () => {
  it('stringifies authored names and blanks nullish ones', () => {
    expect(stepperNameText('Increase')).toBe('Increase')
    expect(stepperNameText(null)).toBe('')
    expect(stepperNameText(undefined)).toBe('')
    expect(stepperNameText(7)).toBe('7')
  })

  it('splits labelledby values into ids and blanks empties', () => {
    expect(stepperNameIds('a b  c')).toEqual(['a', 'b', 'c'])
    expect(stepperNameIds('   ')).toEqual([])
    expect(stepperNameIds('solo')).toEqual(['solo'])
  })
})
