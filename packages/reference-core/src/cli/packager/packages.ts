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
  exports: Record<string, any>
  /** Additional files to copy (e.g., styles.css) */
  additionalFiles?: Array<{ src: string; dest: string }>
}

/**
 * @reference-ui/react - Runtime React components and APIs
 *
 * This package is NOT bundled - we copy the source files directly.
 * The user's bundler (Vite, etc.) will handle bundling.
 */
export const REACT_PACKAGE: PackageDefinition = {
  name: '@reference-ui/react',
  version: '0.0.0-generated',
  description: 'Reference UI React components and runtime APIs',
  bundle: false,
  copyDirs: [
    { src: 'src/primitives', dest: 'primitives' },
    { src: 'src/components', dest: 'components' },
    { src: 'src/styled', dest: 'styled' },
    { src: 'src/system', dest: 'system' },
  ],
  exports: {
    '.': {
      types: './react.d.ts',
      import: './react.js',
    },
    './styles.css': './system/styles.css',
  },
  additionalFiles: [
    { src: 'src/entry/react.ts', dest: 'react.js' },
    { src: 'src/system/styles.css', dest: 'styles.css' },
  ],
}

/**
 * All packages to be bundled/copied
 */
export const PACKAGES: PackageDefinition[] = [REACT_PACKAGE]
