import { xunit } from './unit'

// Imported arrow with a default (SPEC-V2-57: the descriptor export).
export const xtone = (base: string, shade: string = '600') => `${base}.${shade}`

// Imported function declaration.
export function xaccent(): string {
  return 'yellow.700'
}

// Imported object-return spread.
export const xconfig = () => ({ color: 'teal.600', backgroundColor: 'navy' })

// Cross-file capture: the unit bakes from another file's export.
export const xwidth = (n: number) => `${n}${xunit}`

// An imported impure helper refuses like a same-file one.
export const xroll = () => Math.random()
