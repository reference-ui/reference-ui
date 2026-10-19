/**
 * Day-model proof: per-date state resolution for every rendered cell.
 * Pure models computed once per date; sections consume them without
 * recomputing.
 */
import { describe, expect, it } from 'vitest'
import type { GridDay } from '../dates/grid'
import { resolveDayModels, type DayModelInputs } from './models'

function cell(date: string, outsideMonth = false): GridDay {
  const [year, month, day] = date.split('-').map(Number)
  return {
    date: date as GridDay['date'],
    year,
    month,
    day,
    outsideMonth,
    formattedDay: String(day),
    accessibleName: date,
  }
}

const base: DayModelInputs = {
  renderedDays: [cell('2024-08-15'), cell('2024-08-16')],
  isSelected: () => false,
  isSelectedInclusive: () => false,
  isInRange: () => false,
  isInRangeInclusive: () => false,
  isRangeStart: () => false,
  isRangeEnd: () => false,
  isDisabled: () => false,
  isUnavailableDay: () => false,
  previewBand: null,
  markerToday: null,
  focusedDate: null,
  view: 'day',
  idPrefix: 'cal1',
}

describe('resolveDayModels', () => {
  it('resolves identity, roving index, and default content', () => {
    const models = resolveDayModels({ ...base, focusedDate: '2024-08-15' })
    const model = models.get('2024-08-15')
    expect(model?.id).toBe('cal1-2024-08-15')
    expect(model?.tabIndex).toBe(0)
    expect(model?.isFocused).toBe(true)
    expect(model?.defaultContent).toBe('15')
    expect(models.get('2024-08-16')?.tabIndex).toBe(-1)
  })

  it('marks unavailable only for in-bounds predicate-refused dates', () => {
    const models = resolveDayModels({
      ...base,
      isDisabled: (d) => d === '2024-08-15',
      isUnavailableDay: () => true,
    })
    expect(models.get('2024-08-15')).toMatchObject({
      disabled: true,
      unavailable: false,
      unselectable: true,
    })
    expect(models.get('2024-08-16')).toMatchObject({
      disabled: false,
      unavailable: true,
      unselectable: true,
    })
  })

  it('paints the preview band interior while the endpoints keep radius-only paint', () => {
    const models = resolveDayModels({
      ...base,
      renderedDays: [cell('2024-08-15'), cell('2024-08-16'), cell('2024-08-17')],
      previewBand: {
        low: '2024-08-15',
        high: '2024-08-17',
        start: '2024-08-15',
        candidate: '2024-08-17',
      },
    })
    expect(models.get('2024-08-16')?.paintInRange).toBe(true)
    expect(models.get('2024-08-16')?.renderState.preview).toBe(true)
    expect(models.get('2024-08-15')?.paintInRange).toBe(false)
    expect(models.get('2024-08-17')?.rangeEnd).toBe(true)
    expect(models.get('2024-08-17')?.inRangeInclusive).toBe(true)
  })

  it('replaces only content through the Day renderer, nullish keeping the default', () => {
    const models = resolveDayModels({
      ...base,
      dayRender: (date, state) => (date === '2024-08-15' ? `!${state.selected}` : null),
      isSelected: (d) => d === '2024-08-15',
    })
    expect(models.get('2024-08-15')?.defaultContent).toBe('!true')
    expect(models.get('2024-08-16')?.defaultContent).toBe('16')
  })
})
