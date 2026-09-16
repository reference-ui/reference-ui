/**
 * Package-layer contract for atomic stylesheets. Every compiled sheet nests
 * its six internal layers inside the compiling system's package layer, so a
 * composed page orders packages without a top-level internal layer outranking
 * another package's nested utilities. This module owns the order string, the
 * lib package open line, and the standing nesting gauge (M0-fix21-A).
 */
import { expect } from 'vitest'

export const LAYER_PREAMBLE = '@layer reset, global, base, tokens, recipes, utilities;'

/** Package open line for stations compiling the frozen lib spec. */
export const LIB_PACKAGE_OPEN = '@layer \\@reference-ui\\/lib {'

/**
 * Package-layer nesting gauge. The sheet opens its package block first, nests
 * the six-layer order inside it, and closes the package last. The rejection
 * path (ATM-TOKEN-10) has no package identity, so a sheet that is exactly the
 * bare preamble is the only other legal shape.
 */
export function expectPackageWrapped(sheet: string): void {
  if (sheet === `${LAYER_PREAMBLE}\n`) {
    return
  }
  const firstLine = sheet.slice(0, sheet.indexOf('\n'))
  expect(firstLine.startsWith('@layer ')).toBe(true)
  expect(firstLine.endsWith(' {')).toBe(true)
  expect(sheet).toContain(`\n${LAYER_PREAMBLE}`)
  expect(sheet.endsWith('}\n')).toBe(true)
}
