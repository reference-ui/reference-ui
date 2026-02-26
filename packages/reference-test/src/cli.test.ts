import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('CLI', () => {
  it('ref CLI is built and runnable', () => {
    const require = createRequire(import.meta.url)
    const corePath = require.resolve('@reference-ui/core/package.json')
    const coreDir = join(corePath, '..')
    const cliEntry = join(coreDir, 'dist/cli/index.mjs')
    expect(existsSync(cliEntry), 'reference-core dist/cli must exist (build first)').toBe(true)

    const result = execSync(`node "${cliEntry}" --help`, { encoding: 'utf-8' })
    expect(result).toMatch(/ref|Usage|Commands/i)
  })
})
