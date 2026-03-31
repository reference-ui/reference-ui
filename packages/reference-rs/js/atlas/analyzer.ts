import path from 'node:path'

import { buildAnalysisContext, isPackagePattern } from './project'
import { discoverIncludedLibraryComponents, discoverLocalComponents } from './discovery'
import {
  applyFilters,
  calculateUsage,
  collectUsage,
  compareComponents,
  createState,
  finalizeState,
} from './usage'
import type {
  AtlasAnalysisResult,
  AtlasConfig,
  AtlasDiagnostic,
  Component,
} from './types'

/**
 * Analyze a project and return Atlas components only.
 *
 * Use `analyzeDetailed()` when the caller also needs diagnostics.
 */
export async function analyze(
  rootDir: string,
  config?: AtlasConfig
): Promise<Component[]> {
  return (await analyzeDetailed(rootDir, config)).components
}

/**
 * Analyze a project and return both components and diagnostics.
 *
 * This is the recommended integration point for build steps and golden-output
 * generation because it preserves partial results instead of forcing callers to
 * infer failure modes from missing components.
 */
export async function analyzeDetailed(
  rootDir: string,
  config?: AtlasConfig
): Promise<AtlasAnalysisResult> {
  const normalizedRoot = path.resolve(rootDir)
  const context = await buildAnalysisContext(normalizedRoot, config)
  const diagnostics: AtlasDiagnostic[] = []
  const states = new Map<string, ReturnType<typeof createState>>()

  for (const template of discoverLocalComponents(context, diagnostics)) {
    states.set(getComponentKey(template), createState(template))
  }

  const includePatterns = config?.include ?? []
  const includePackageNames = includePatterns.filter(isPackagePattern)
  const includeSelectors = includePatterns
    .filter(pattern => pattern.includes(':'))
    .map(pattern => {
      const [source, name] = pattern.split(':')
      return { source, name }
    })

  for (const template of discoverIncludedLibraryComponents(
    context,
    includePackageNames,
    includeSelectors,
    diagnostics
  )) {
    const key = getComponentKey(template)
    if (!states.has(key)) {
      states.set(key, createState(template))
    }
  }

  collectUsage(context, states)

  const components = Array.from(states.values()).map(finalizeState)
  return {
    components: calculateUsage(applyFilters(components, config)).sort(compareComponents),
    diagnostics: normalizeDiagnostics(diagnostics),
  }
}

function getComponentKey(component: Pick<Component, 'name' | 'source'>): string {
  return `${component.name}@@${component.source}`
}

function normalizeDiagnostics(diagnostics: AtlasDiagnostic[]): AtlasDiagnostic[] {
  return Array.from(
    new Map(
      diagnostics.map(diagnostic => [
        `${diagnostic.code}:${diagnostic.source}:${diagnostic.componentName ?? ''}:${diagnostic.interfaceName ?? ''}`,
        diagnostic,
      ])
    ).values()
  ).sort((left, right) => {
    if (left.code !== right.code) {
      return left.code.localeCompare(right.code)
    }
    if (left.source !== right.source) {
      return left.source.localeCompare(right.source)
    }
    return (left.componentName ?? '').localeCompare(right.componentName ?? '')
  })
}
