/**
 * Package-layer contract for atomic stylesheets. Every compiled sheet nests
 * its six internal layers inside the compiling system's package layer, so a
 * composed page orders packages without a top-level internal layer outranking
 * another package's nested utilities. The baked `@layer root` spacing-root
 * default is the one layer ahead of the wrap, ranking below every package.
 * This module owns the order string, the lib package open line, and the
 * standing nesting gauge (M0-fix21-A).
 */
import { expect } from 'vitest'

export const LAYER_PREAMBLE = '@layer reset, global, base, tokens, recipes, utilities;'

/** Baked `@layer root` spacing-root default block, verbatim engine bytes. */
export const ROOT_DEFAULT_BLOCK = '@layer root {\n  :root { --spacing-root: 0.25rem }\n}\n'

/** Package open line for stations compiling the frozen lib spec. */
export const LIB_PACKAGE_OPEN = '@layer \\@reference-ui\\/lib {'

/**
 * Package-layer nesting gauge. The sheet opens a layer block first (the baked
 * root default, then the package block), nests the six-layer order inside the
 * package, and closes the package last. The rejection path (ATM-TOKEN-10) has
 * no package identity, so a sheet that is exactly the bare preamble is the
 * only other legal shape.
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
