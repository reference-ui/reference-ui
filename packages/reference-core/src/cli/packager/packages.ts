/**
 * Package definitions for Reference UI
 */

export interface PackageDefinition {
  name: string
  version: string
  description: string
  /** Entry point for bundling (if bundle: true) */
  entry?: string
  /** Whether to bundle with esbuild (false = just copy files) */
  bundle?: boolean
  /** Directories to copy (when bundle: false) */
  copyDirs?: Array<{ src: string; dest?: string }>
  /** Main entry point for package.json (defaults to './index.js') */
  main?: string
  /** Types entry point for package.json (defaults to './index.d.ts') */
  types?: string
  exports: Record<string, any>
  /** Additional files to copy (e.g., styles.css) */
  additionalFiles?: Array<{ src: string; dest: string }>
}

/**
 * @reference-ui/react - Runtime React components and APIs
 *
 * Bundled into a single ESM file for optimal loading.
 */
export const REACT_PACKAGE: PackageDefinition = {
  name: '@reference-ui/react',
  version: '0.0.0-generated',
  description: 'Reference UI React components and runtime APIs',
  bundle: true,
  entry: 'src/entry/react.ts',
  main: './react.js',
  types: './react.d.ts',
  exports: {
    '.': {
      types: './react.d.ts',
      import: './react.js',
    },
    './styles.css': './styles.css',
  },
  additionalFiles: [{ src: 'src/system/styles.css', dest: 'styles.css' }],
}

/**
 * All packages to be bundled/copied
 */
export const PACKAGES: PackageDefinition[] = [REACT_PACKAGE]
