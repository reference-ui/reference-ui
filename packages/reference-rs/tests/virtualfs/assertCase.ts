import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

export function runVirtualCaseTest(caseImportUrl: string) {
  const caseDir = dirname(fileURLToPath(caseImportUrl))

  describe(`virtualfs case ${caseDir.split('/').pop()}`, () => {
    it('matches the expected rewritten output', () => {
      const expected = readFileSync(join(caseDir, 'expected.tsx'), 'utf-8')
      const actual = readFileSync(join(caseDir, 'output', 'result.tsx'), 'utf-8')

      expect(actual).toBe(expected)
    })

    it('writes perf metrics for the native rewrite call', () => {
      const metricsPath = join(caseDir, 'output', 'perf-metrics.txt')

      expect(existsSync(metricsPath)).toBe(true)

      const metrics = readFileSync(metricsPath, 'utf-8')
      expect(metrics).toContain('// perf metrics')
      expect(metrics).toContain('// rust_api_ms:')
      expect(metrics).toContain('// note: measured around the native rewrite call only')

      const msMatch = metrics.match(/\/\/ rust_api_ms: ([0-9.]+)/)
      expect(msMatch).not.toBeNull()
      expect(Number(msMatch![1])).toBeGreaterThanOrEqual(0)
    })
  })
}
