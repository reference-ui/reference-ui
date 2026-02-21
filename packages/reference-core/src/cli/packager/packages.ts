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
 * @reference-ui/system - Design tokens and CSS utilities
 *
 * This package is NOT bundled - we copy the generated system folder directly
 * since it's already in the correct format from Panda.
 */
export const SYSTEM_PACKAGE: PackageDefinition = {
  name: '@reference-ui/system',
  version: '0.0.0-generated',
  description: 'Reference design system tokens and utilities',
  bundle: false,
  copyDirs: [
    { src: 'src/system' }, // Copy entire system folder
  ],
  exports: {
    '.': {
      types: './css/index.d.ts',
      default: './css/index.js',
    },
    './css': {
      types: './css/index.d.ts',
      default: './css/index.js',
    },
    './tokens': {
      types: './tokens/index.d.ts',
      default: './tokens/index.js',
    },
    './patterns': {
      types: './patterns/index.d.ts',
      default: './patterns/index.js',
    },
    './recipes': {
      types: './recipes/index.d.ts',
      default: './recipes/index.js',
    },
    './styles.css': './styles.css',
  },
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
