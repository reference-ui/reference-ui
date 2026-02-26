/**
 * Dependency version resolution.
 * Maps config to exact package versions (React, bundler, etc.).
 */

import type { MatrixEnvironment } from './types.js'

/** Resolved dependency versions for a project */
export interface ResolvedDependencies {
  react: string
  reactDom: string
  bundler: { name: string; version: string; devDependencies: Record<string, string> }
}

/**
 * Resolve exact package versions for the given environment.
 * @param environment - Matrix environment (React version, bundler, bundler version)
 * @returns Resolved versions for package.json
 */
export function resolveDependencies(environment: MatrixEnvironment): ResolvedDependencies {
  const reactVersions: Record<string, { react: string; reactDom: string }> = {
    '18': { react: '18.3.1', reactDom: '18.3.1' },
    '19': { react: '19.0.0', reactDom: '19.0.0' },
  }
  const { react, reactDom } = reactVersions[environment.reactVersion] ?? reactVersions['18']

  const bundlerVersions: Record<string, Record<string, string>> = {
    vite: { '5': '5.4.0', '6': '6.0.0' },
    webpack: { '5': '5.95.0' },
    rollup: { '4': '4.28.0' },
  }
  const versionMap = bundlerVersions[environment.bundler]
  const major = environment.bundlerVersion.replace(/[\^~]/, '').split('.')[0] ?? '5'
  const bundlerVersion = versionMap?.[major] ?? (environment.bundler === 'vite' ? '5.4.0' : '5.95.0')

  const bundlerDep: Record<string, Record<string, string>> = {
    vite: { vite: bundlerVersion, '@vitejs/plugin-react': '4.3.4' },
    webpack: { webpack: bundlerVersion, 'webpack-cli': '6.0.1', 'html-webpack-plugin': '5.6.3' },
    rollup: { rollup: bundlerVersion, '@rollup/plugin-node-resolve': '15.2.3' },
  }

  return {
    react,
    reactDom,
    bundler: {
      name: environment.bundler,
      version: bundlerVersion,
      devDependencies: bundlerDep[environment.bundler] ?? bundlerDep.vite,
    },
  }
}
