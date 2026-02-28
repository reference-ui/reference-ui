import { createRequire } from 'node:module'
import { defineConfig } from './types'

const CORE_MODULE_ID = '@reference-ui/core'

/**
 * Evaluate bundled config code in a controlled environment.
 * Runs the bundled CJS-style code and returns the module.exports result.
 * When config bundles @reference-ui/core as external, we provide defineConfig via a custom require.
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
    if (id === CORE_MODULE_ID) {
      return { defineConfig }
    }
    return baseRequire(id)
  }) as NodeRequire

  const fn = new Function('module', 'exports', 'require', bundledCode)
  fn(module, module.exports, requireFn)

  return module.exports
}
