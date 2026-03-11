import { createRequire } from 'node:module'
import { CONFIG_EXTERNALS } from './constants'
import { defineConfig } from './types'

/**
 * Evaluate bundled config code in a controlled environment.
 * Runs the bundled CJS-style code and returns the module.exports result.
 * When config bundles the core package (or the legacy cli alias) as external, we provide defineConfig.
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
