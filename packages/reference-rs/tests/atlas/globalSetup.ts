import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { analyze, analyzeDetailed } from '../../js/atlas'
import type { AtlasDiagnostic } from '../../js/atlas'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

type AtlasDiagnosticsPayload = {
  caseName: string
  diagnostics: AtlasDiagnostic[]
  notes: string[]
}

type AtlasAnalysisPayload = {
  caseName: string
  analyses: {
    default: Awaited<ReturnType<typeof analyze>>
    withIncludes: Record<string, Awaited<ReturnType<typeof analyze>>>
  }
}

export default async function globalSetup() {
  const atlasDir = join(__dirname)
  const casesDir = join(atlasDir, 'cases')
  const caseFolders = readdirSync(casesDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()

  for (const caseName of caseFolders) {
    const caseDir = join(casesDir, caseName)
    const inputDir = join(caseDir, 'input')
    const appRoot = join(inputDir, 'app')
    const outputDir = join(caseDir, 'output')
    const includePackages = discoverCasePackages(inputDir)

    const detailed = await analyzeDetailed(appRoot)
    const withIncludes: Record<string, Awaited<ReturnType<typeof analyze>>> = {}
    for (const packageName of includePackages) {
      withIncludes[packageName] = await analyze(appRoot, { include: [packageName] })
    }

    const analysisPayload: AtlasAnalysisPayload = {
      caseName,
      analyses: {
        default: detailed.components,
        withIncludes,
      },
    }

    const diagnosticsPayload: AtlasDiagnosticsPayload = {
      caseName,
      diagnostics: detailed.diagnostics,
      notes: [
        'Atlas currently emits usage and interface mapping only.',
        'Rich prop/member metadata is expected to be resolved by Tasty in an upper layer.',
        'Use analyzeDetailed() when callers need both partial results and diagnostics.',
      ],
    }

    rmSync(outputDir, { recursive: true, force: true })
    mkdirSync(outputDir, { recursive: true })
    writeFileSync(
      join(outputDir, 'analysis.json'),
      JSON.stringify(analysisPayload, null, 2) + '\n'
    )
    writeFileSync(
      join(outputDir, 'diagnostics.json'),
      JSON.stringify(diagnosticsPayload, null, 2) + '\n'
    )
  }
}

function discoverCasePackages(inputDir: string): string[] {
  return readdirSync(inputDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name !== 'app')
    .map(entry => join(inputDir, entry.name, 'package.json'))
    .filter(packageJsonPath => {
      try {
        readFileSync(packageJsonPath, 'utf8')
        return true
      } catch {
        return false
      }
    })
    .map(
      packageJsonPath =>
        JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { name?: string }
    )
    .map(pkg => pkg.name)
    .filter((name): name is string => Boolean(name))
}
