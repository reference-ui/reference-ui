import { createRequire } from 'node:module'
import { defineConfig } from './types'

const PROVIDE_DEFINE_CONFIG = ['@reference-ui/core', '@reference-ui/cli', '@reference-ui/cli/config'] as const

/**
 * Evaluate bundled config code in a controlled environment.
 * Runs the bundled CJS-style code and returns the module.exports result.
 * When config bundles @reference-ui/core, @reference-ui/cli, or @reference-ui/cli/config as external, we provide defineConfig.
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
    if ((PROVIDE_DEFINE_CONFIG as readonly string[]).includes(id)) {
      return { defineConfig }
    }
    return baseRequire(id)
  }) as NodeRequire

  const fn = new Function('module', 'exports', 'require', bundledCode)
  fn(module, module.exports, requireFn)

  return module.exports
}
