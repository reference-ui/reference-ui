/**
 * Want matchers for the atomic case helpers: whether a compile result carries a want with a given
 * prop, value and condition path, and the site, harvest and per-prop slices of its wants. Takes a
 * `CompileResult` and returns a boolean or a want list. Wants with `origin: 'harvest'` were minted
 * onto refused dynamic sinks, so the site slice leaves them out.
 */
import type { CompileResult } from '../../js/types.js'

function matchesWantValue(actual: unknown, expected: string | number | boolean): boolean {
  if (typeof expected === 'string') {
    return (actual as Record<string, string>)?.String === expected
  }
  if (typeof expected === 'number') {
    return (actual as Record<string, string>)?.Number === String(expected)
  }
  if (typeof expected === 'boolean') {
    return (actual as Record<string, boolean>)?.Bool === expected
  }
  return false
}

export function hasWant(
  result: CompileResult,
  prop: string,
  value: string | number | boolean,
  when: string[] = []
): boolean {
  return (result.wants ?? []).some(
    w =>
      w.prop === prop &&
      matchesWantValue(w.value, value) &&
      w.when.length === when.length &&
      w.when.every((cond, idx) => cond === when[idx])
  )
}

export function getWantsForProp(
  result: CompileResult,
  prop: string
): NonNullable<CompileResult['wants']> {
  return (result.wants ?? []).filter(w => w.prop === prop)
}

/** Wants minted by the site walk, excluding the harvest floor (`ATM-HARVEST-01`). */
export function siteWants(
  result: CompileResult
): NonNullable<CompileResult['wants']> {
  return (result.wants ?? []).filter(w => w.origin !== 'harvest')
}

/** Wants minted by harvest onto refused dynamic sinks (`ATM-HARVEST-01`). */
export function harvestWants(
  result: CompileResult
): NonNullable<CompileResult['wants']> {
  return (result.wants ?? []).filter(w => w.origin === 'harvest')
}
