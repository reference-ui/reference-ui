/**
 * Matrix configuration - environment combinations to test.
 * MVP: React 18 + Vite only.
 */

import type { MatrixEnvironment } from '../../project/types.js'

/** MVP matrix - one entry */
export const MATRIX: MatrixEnvironment[] = [
  { reactVersion: '18', bundler: 'vite', bundlerVersion: '^5' },
]
