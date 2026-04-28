import type { MatrixBundlerStrategy, MatrixReactRuntime } from '../../discovery/index.js'
import {
  createManagedVite7ConfigSource,
  createManagedVite7IndexHtmlSource,
  managedVite7DevDependencies,
} from './vite7/index.js'
import {
  createManagedWebpack5ConfigSource,
  createManagedWebpack5IndexHtmlSource,
  managedWebpack5DevDependencies,
} from './webpack5/index.js'

export function getManagedBundlerDevDependencies(
  bundlers: readonly MatrixBundlerStrategy[],
): Record<string, string> {
  const devDependencies: Record<string, string> = {}

  for (const bundler of bundlers) {
    if (bundler === 'vite7') {
      Object.assign(devDependencies, managedVite7DevDependencies)
      continue
    }

    if (bundler === 'webpack5') {
      Object.assign(devDependencies, managedWebpack5DevDependencies)
    }
  }

  return devDependencies
}

export function createManagedBundlerFiles(options: {
  bundlers: readonly MatrixBundlerStrategy[]
  react: MatrixReactRuntime
  title: string
}): Record<string, string> {
  const files: Record<string, string> = {}

  for (const bundler of options.bundlers) {
    if (bundler === 'vite7') {
      files['index.html'] = createManagedVite7IndexHtmlSource({
        reactRuntime: options.react,
        title: options.title,
      })
      files['vite.config.ts'] = createManagedVite7ConfigSource()
      continue
    }

    if (bundler === 'webpack5') {
      files['index.html'] = createManagedWebpack5IndexHtmlSource({
        reactRuntime: options.react,
        title: options.title,
      })
      files['webpack.config.cjs'] = createManagedWebpack5ConfigSource()
    }
  }

  return files
}