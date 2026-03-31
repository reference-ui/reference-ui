/**
 * Shared happy-dom helpers for design-system CSS assertions.
 */

import { expect } from 'vitest'
import { getDesignSystemCssPath } from '../primitives/setup'

export function requireDesignSystemCss(): void {
  const path = getDesignSystemCssPath()
  if (!path) {
    throw new Error(
      'Design system CSS not found. Run `ref sync` or `pnpm dev` from packages/reference-unit so `.reference-ui/` exists.',
    )
  }
}

type RgbTuple = [number, number, number]

function parseColorValue(value: string): RgbTuple | null {
  const trimmed = value.trim().toLowerCase()

  const hex = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const raw = hex[1]
    const full = raw.length === 3 ? raw.split('').map((part) => part + part).join('') : raw
    return [
      Number.parseInt(full.slice(0, 2), 16),
      Number.parseInt(full.slice(2, 4), 16),
      Number.parseInt(full.slice(4, 6), 16),
    ]
  }

  const rgb = trimmed.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/)
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  }

  return null
}

function colorLabel(value: string): string {
  const parsed = parseColorValue(value)
  return parsed ? `rgb(${parsed[0]}, ${parsed[1]}, ${parsed[2]})` : value
}

export function expectResolvedRgb(
  el: Element,
  property: 'backgroundColor' | 'color',
  expected: string,
  label: string,
): void {
  const raw = window.getComputedStyle(el)[property]
  if (raw === '' || raw == null) {
    throw new Error(`${label}: computed ${property} is empty`)
  }

  const actualColor = parseColorValue(raw)
  const expectedColor = parseColorValue(expected)
  if (actualColor && expectedColor) {
    expect(actualColor, `${label} (${property})`).toEqual(expectedColor)
    return
  }

  expect(raw, `${label} (${property})`).toBe(expected)
}

/**
 * Assert numeric `font-weight` from getComputedStyle (e.g. 400, 700).
 * happy-dom / browsers typically return string values like `"700"`.
 */
export function expectComputedFontWeight(
  el: Element,
  expected: number,
  label: string,
): void {
  const raw = window.getComputedStyle(el).fontWeight
  if (raw === '' || raw == null) {
    throw new Error(`${label}: computed fontWeight is empty`)
  }
  const n = Number.parseInt(raw, 10)
  if (Number.isNaN(n)) {
    throw new Error(`${label}: could not parse fontWeight "${raw}"`)
  }
  expect(n, label).toBe(expected)
}

export function expectComputedFontFamilyIncludes(
  el: Element,
  substring: string,
  label: string,
): void {
  const raw = window.getComputedStyle(el).fontFamily
  if (raw === '' || raw == null) {
    throw new Error(`${label}: computed fontFamily is empty`)
  }
  expect(raw.toLowerCase(), label).toContain(substring.toLowerCase())
}

export function expectNotResolvedRgb(
  el: Element,
  property: 'backgroundColor' | 'color',
  unexpected: string,
  label: string,
): void {
  const raw = window.getComputedStyle(el)[property]
  if (raw === '' || raw == null) {
    return
  }

  const actualColor = parseColorValue(raw)
  const unexpectedColor = parseColorValue(unexpected)
  if (actualColor && unexpectedColor) {
    expect(
      actualColor,
      `${label} (${property}) should not resolve to ${colorLabel(unexpected)}`,
    ).not.toEqual(unexpectedColor)
    return
  }

  expect(raw, `${label} (${property})`).not.toBe(unexpected)
}
