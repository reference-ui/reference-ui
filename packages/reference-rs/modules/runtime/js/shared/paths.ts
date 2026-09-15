/**
 * Shared filesystem path constants for the reference-rs package.
 * Resolves repository package roots and build artifact directories.
 * Provides stable path references across native toolchain scripts.
 */
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
export const distDir = resolve(packageDir, 'dist')
export const artifactsDir = resolve(distDir, 'artifacts')
export const npmDir = resolve(distDir, 'npm')
export const nativeDir = resolve(distDir, 'native')
