/**
 * Turns `pipeline test` into a concrete set of jobs.
 *
 * `--packages` runs one matrix package (or a short list) instead of the whole
 * fanout. Extra params shrink that run for rapid development: `--react` pins
 * one declared React version, so you do not pay for 17/18/19 when you only
 * need one. `--full` expands every declared React and bundler. Default is the
 * first declared React and the preferred bundler for each selected package.
 */

import {
  getPreferredLocalMatrixBundlers,
  listMatrixWorkspacePackages,
  type MatrixBundlerStrategy,
  type MatrixReactRuntime,
  type MatrixWorkspacePackage,
} from '../discovery/index.js'
import type { MatrixRunOptions } from './types.js'

export interface MatrixJob {
  bundlers: readonly MatrixBundlerStrategy[]
  package: MatrixWorkspacePackage
  reactRuntime: MatrixReactRuntime
}

export interface MatrixExecutionPlan {
  jobs: MatrixJob[]
}

export type MatrixPlanOptions = Pick<MatrixRunOptions, 'full' | 'packageNames' | 'react'>

export function resolveJobReactRuntimes(
  pkg: MatrixWorkspacePackage,
  options: Pick<MatrixPlanOptions, 'full' | 'react'>,
): readonly MatrixReactRuntime[] {
  if (options.react) {
    if (!pkg.config.reactVersions.includes(options.react)) {
      throw new Error(
        `${pkg.workspacePackage.name} does not declare React runtime ${options.react}. Declared: ${pkg.config.reactVersions.join(', ')}.`,
      )
    }

    return [options.react]
  }

  if (options.full) {
    return pkg.config.reactVersions
  }

  return [pkg.config.react]
}

export function resolveJobBundlers(
  pkg: MatrixWorkspacePackage,
  options: Pick<MatrixPlanOptions, 'full'>,
): readonly MatrixBundlerStrategy[] {
  if (options.full) {
    return pkg.config.bundlers
  }

  return getPreferredLocalMatrixBundlers(pkg.config.bundlers)
}

export function planMatrixJobs(
  packages: readonly MatrixWorkspacePackage[],
  options: Pick<MatrixPlanOptions, 'full' | 'react'> = {},
): MatrixJob[] {
  const jobs: MatrixJob[] = []

  for (const pkg of packages) {
    const bundlers = resolveJobBundlers(pkg, options)

    for (const reactRuntime of resolveJobReactRuntimes(pkg, options)) {
      jobs.push({
        bundlers,
        package: pkg,
        reactRuntime,
      })
    }
  }

  return jobs
}

export function planMatrixExecution(options: MatrixPlanOptions = {}): MatrixExecutionPlan {
  return {
    jobs: planMatrixJobs(listMatrixWorkspacePackages(options.packageNames), options),
  }
}
