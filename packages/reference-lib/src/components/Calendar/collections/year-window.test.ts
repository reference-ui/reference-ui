import { describe, expect, it } from 'vitest'
import { resolveYearWindow } from './year-window'

describe('resolveYearWindow', () => {
  it('seats ten either side of the shown year unbounded', () => {
    expect(resolveYearWindow(2024)).toEqual({ startYear: 2014, endYear: 2034 })
  })

  it('clamps to keep 21 in-domain at the edges', () => {
    expect(resolveYearWindow(5)).toEqual({ startYear: 1, endYear: 21 })
    expect(resolveYearWindow(9995)).toEqual({ startYear: 9979, endYear: 9999 })
  })

  it('runs min-through-max when both bounds exist', () => {
    expect(resolveYearWindow(2024, '2020-06-01', '2022-06-01')).toEqual({
      startYear: 2020,
      endYear: 2022,
    })
  })

  it('reaches a 21-year run from a single bound toward the shown year', () => {
    expect(resolveYearWindow(2024, '2020-06-01', undefined)).toEqual({
      startYear: 2020,
      endYear: 2040,
    })
    expect(resolveYearWindow(2030, undefined, '2024-06-01')).toEqual({
      startYear: 2004,
      endYear: 2024,
    })
  })
})
