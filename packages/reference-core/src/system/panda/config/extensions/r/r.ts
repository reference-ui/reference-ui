/**
 * Responsive container query prop (`r`) for the box pattern.
 *
 * Unlike sibling pattern files (container, size), the `r` extension is NOT
 * registered via a top-level `extendPattern()` side-effect. Its transform
 * needs the user's resolved breakpoint table baked into the function body
 * (closures don't survive `transform.toString()` rebuilding inside
 * `extendPatterns()`). The factory `createRExtension(breakpoints)` is invoked
 * from the generated `panda.config.ts` template after `tokens({ breakpoints })`
 * fragments have been resolved.
 */

export type { ResponsiveProp } from './createRExtension'
export { createRExtension } from './createRExtension'
