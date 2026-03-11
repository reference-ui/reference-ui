import { createRequire } from 'node:module'
import { CONFIG_EXTERNALS } from './constants'
import { defineConfig } from './types'

/**
 * Evaluate the bundled user config in a tiny CommonJS runtime.
 * We intentionally bundle config to CJS so it can be executed from a string via
 * `new Function('module', 'exports', 'require', code)` without writing a temp
 * file or spinning up a custom ESM loader. That also lets us intercept
 * `require('@reference-ui/core')` and related ids to provide only
 * `{ defineConfig }` while leaving every other dependency to Node resolution.
 *
 * This is an internal loader detail only. The package itself is ESM; CJS is
 * used here purely as the cheapest way to evaluate bundled config code.
 *
 * @param bundledCode - The bundled JavaScript string (CJS format)
 * @returns The evaluated config object (raw, may have default export)
 */
export function evaluateConfig(bundledCode: string): unknown {
  const module = { exports: {} }

  let baseRequire: NodeRequire
  try {
    baseRequire = createRequire(import.meta.url)
  } catch {
    baseRequire = require
  }

  const requireFn = ((id: string) => {
    if ((CONFIG_EXTERNALS as readonly string[]).includes(id)) {
      return { defineConfig }
    }
    return baseRequire(id)
  }) as NodeRequire

  const fn = new Function('module', 'exports', 'require', bundledCode)
  fn(module, module.exports, requireFn)

  return module.exports
}
