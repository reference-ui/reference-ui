/**
 * Bootstrap: generate sandbox from base environment for a given matrix config.
 * Tests use getProject() to access the bootstrapped project.
 */

import { generateSandbox } from './generator/index.js'
import type { MatrixEntry } from './matrix.js'

export type EnvConfig = MatrixEntry

export async function bootstrap(config: MatrixEntry) {
  return generateSandbox(config)
}
