import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  applyResponsiveStyles,
  getVirtualNative,
  replaceFunctionName,
  resolveReferenceRsPackageDir,
  rewriteCssImports,
  rewriteCvaImports,
} from '../../js/runtime/index'

type VirtualCaseConfig = {
  api: 'rewriteCssImports' | 'rewriteCvaImports' | 'replaceFunctionName' | 'applyResponsiveStyles'
  fromName?: string
  importFrom?: string
  relativePath: string
  inputFile?: string
  outputFile?: string
  toName?: string
}

const __dirname = fileURLToPath(new URL('.', import.meta.url))

function runCase(config: VirtualCaseConfig, sourceCode: string): string {
  switch (config.api) {
    case 'rewriteCssImports':
      return rewriteCssImports(sourceCode, config.relativePath)
    case 'rewriteCvaImports':
      return rewriteCvaImports(sourceCode, config.relativePath)
    case 'replaceFunctionName':
      if (!config.fromName || !config.toName) {
        throw new Error('replaceFunctionName cases require fromName and toName in case.json')
      }
      return replaceFunctionName(
        sourceCode,
        config.relativePath,
        config.fromName,
        config.toName,
        config.importFrom,
      )
    case 'applyResponsiveStyles':
      return applyResponsiveStyles(sourceCode, config.relativePath)
  }
}

export default async function setupVirtualfs() {
  if (!getVirtualNative()) {
    throw new Error(
      'Virtual native addon not available. Run `pnpm run ensure-native` (or `pnpm run build`) first.'
    )
  }

  const packageDir = resolveReferenceRsPackageDir(pathToFileURL(__dirname).href)
  const virtualfsDir = join(packageDir, 'tests', 'virtualfs')
  const casesDir = join(virtualfsDir, 'cases')

  const caseFolders = readdirSync(casesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  if (caseFolders.length === 0) {
    throw new Error('At least one case folder must exist under tests/virtualfs/cases/')
  }

  for (const caseName of caseFolders) {
    const caseDir = join(casesDir, caseName)
    const caseConfigPath = join(caseDir, 'case.json')

    if (!existsSync(caseConfigPath)) {
      continue
    }

    const config = JSON.parse(
      readFileSync(caseConfigPath, 'utf-8')
    ) as VirtualCaseConfig
    const inputFile = config.inputFile ?? 'input.tsx'
    const outputFile = config.outputFile ?? 'result.tsx'
    const sourceCode = readFileSync(join(caseDir, inputFile), 'utf-8')
    const startedAt = performance.now()
    const rewritten = runCase(config, sourceCode)
    const rustApiMs = performance.now() - startedAt
    const outputDir = join(caseDir, 'output')

    mkdirSync(outputDir, { recursive: true })
    writeFileSync(join(outputDir, outputFile), rewritten, 'utf-8')
    writeFileSync(
      join(outputDir, 'perf-metrics.txt'),
      [
        '// perf metrics',
        `// api: ${config.api}`,
        `// rust_api_ms: ${rustApiMs.toFixed(3)}`,
        `// relative_path: ${config.relativePath}`,
        '// note: measured around the native rewrite call only',
        '',
      ].join('\n'),
      'utf-8'
    )
  }
}
