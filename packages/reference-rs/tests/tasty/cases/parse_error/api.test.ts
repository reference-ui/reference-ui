import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { buildTasty } from '../../../../js/tasty/build'
import {
  addCaseEmittedSnapshotTests,
  addCaseRuntimeSmokeTests,
} from '../../api-test-helpers'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageDir = join(__dirname, '..', '..', '..', '..')

describe('parse_error tasty api', () => {
  addCaseRuntimeSmokeTests('parse_error', 'Ok')
  addCaseEmittedSnapshotTests('parse_error')

  it('reports parse errors in diagnostics without crashing', async () => {
    const built = await buildTasty({
      rootDir: join(packageDir, 'tests', 'tasty'),
      include: ['cases/parse_error/input/**/*.{ts,tsx}'],
      outputDir: join(packageDir, 'tests', 'tasty', 'cases', 'parse_error', 'output'),
    })
    expect(
      built.diagnostics.some(
        (d) => d.source === 'scanner' && d.message.includes('parse reported'),
      ),
    ).toBe(true)
  })
})
